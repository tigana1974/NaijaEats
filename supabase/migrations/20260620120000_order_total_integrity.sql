-- Phase 0, fix 1: order total integrity.
--
-- Problem: "Customers create their own orders" only checked
-- auth.uid() = customer_id on INSERT — subtotal/delivery_fee/total/order_items.price
-- were whatever the client sent, so a customer could submit an order with a
-- fabricated total. This migration moves order creation into a single
-- SECURITY DEFINER function that recomputes every price server-side from
-- menu_items/vendors, and revokes direct INSERT on orders/order_items from
-- authenticated clients so create_order() is the only path in.

-- 1. Revoke direct insert privileges that let clients set their own prices.
--    SELECT/UPDATE policies are untouched — customers/vendors/riders/admins
--    still read and transition orders exactly as before.
REVOKE INSERT ON public.orders FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;

-- 2. create_order: the only supported way for a customer to place an order.
--    Takes a vendor + a list of {menu_item_id, quantity} and ignores any
--    client-supplied price entirely.
CREATE OR REPLACE FUNCTION public.create_order(
  p_vendor_id UUID,
  p_items JSONB, -- [{ "menu_item_id": "uuid", "quantity": 2 }, ...]
  p_delivery_address TEXT DEFAULT NULL,
  p_customer_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := auth.uid();
  v_vendor RECORD;
  v_item JSONB;
  v_menu_item RECORD;
  v_quantity INTEGER;
  v_subtotal NUMERIC := 0;
  v_line_subtotal NUMERIC;
  v_order_id UUID;
  v_currency TEXT;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated to place an order';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF v_vendor IS NULL THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;
  IF v_vendor.status <> 'approved' THEN
    RAISE EXCEPTION 'Vendor is not currently accepting orders';
  END IF;

  v_currency := v_vendor.currency;

  -- Create the order shell first (subtotal/total filled in after we've
  -- priced every line item below).
  INSERT INTO public.orders (customer_id, vendor_id, status, currency, delivery_address, customer_note)
  VALUES (v_customer_id, p_vendor_id, 'pending', v_currency, p_delivery_address, p_customer_note)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for item %', v_item->>'menu_item_id';
    END IF;

    -- Price comes only from the current row in menu_items — never from p_items.
    SELECT * INTO v_menu_item
    FROM public.menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
      AND vendor_id = p_vendor_id;

    IF v_menu_item IS NULL THEN
      RAISE EXCEPTION 'Menu item % does not belong to this vendor', v_item->>'menu_item_id';
    END IF;
    IF NOT v_menu_item.is_available THEN
      RAISE EXCEPTION '% is currently unavailable', v_menu_item.name;
    END IF;

    v_line_subtotal := v_menu_item.price * v_quantity;
    v_subtotal := v_subtotal + v_line_subtotal;

    INSERT INTO public.order_items (order_id, menu_item_id, name, price, quantity, subtotal)
    VALUES (v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_quantity, v_line_subtotal);
  END LOOP;

  PERFORM set_config('app.bypass_order_money_guard', 'true', true);

  UPDATE public.orders
  SET subtotal = v_subtotal,
      delivery_fee = COALESCE(v_vendor.delivery_fee, 0),
      total = v_subtotal + COALESCE(v_vendor.delivery_fee, 0)
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

-- Only authenticated users may call this; no anon ordering, no PUBLIC default.
REVOKE EXECUTE ON FUNCTION public.create_order(UUID, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(UUID, JSONB, TEXT, TEXT) TO authenticated;

-- 3. Belt-and-suspenders: even though INSERT is revoked above, make sure
--    nothing can ever UPDATE subtotal/total/order_items.price directly either.
--    Customers/vendors update *status*-adjacent fields, never money fields.
CREATE OR REPLACE FUNCTION public.prevent_order_money_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- sync_order_totals_after_item_change() sets this for the duration of its
  -- own trusted update (recomputed from real menu_items prices, never from
  -- client input) so it isn't blocked by this same guard.
  IF current_setting('app.bypass_order_money_guard', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id THEN
    RAISE EXCEPTION 'Only admins can modify order pricing or ownership fields';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_order_money_tampering() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_prevent_money_tampering ON public.orders;
CREATE TRIGGER orders_prevent_money_tampering
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_order_money_tampering();

-- order_items rows are only ever written by create_order() now (INSERT is
-- revoked from authenticated above). However, "Customers manage items for
-- own orders" (FOR ALL) and "Customers mutate items only on pending orders"
-- still grant UPDATE on order_items to let a customer adjust quantity while
-- an order is still pending — and as written, neither stops them rewriting
-- price/name/menu_item_id in that same update. Close that with a trigger
-- rather than removing the quantity-edit feature.
CREATE OR REPLACE FUNCTION public.prevent_order_item_price_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_menu_item RECORD;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.menu_item_id IS DISTINCT FROM OLD.menu_item_id
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.order_id IS DISTINCT FROM OLD.order_id THEN
    RAISE EXCEPTION 'Only quantity may be changed on an existing order item';
  END IF;

  -- Quantity changed: re-derive subtotal from the *current* menu_items price,
  -- never from a client-supplied value, and re-roll up the parent order total.
  IF NEW.quantity IS DISTINCT FROM OLD.quantity THEN
    IF NEW.quantity < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    SELECT * INTO v_menu_item FROM public.menu_items WHERE id = NEW.menu_item_id;
    IF v_menu_item IS NULL OR NOT v_menu_item.is_available THEN
      RAISE EXCEPTION 'This item is no longer available';
    END IF;

    NEW.subtotal := v_menu_item.price * NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_order_item_price_tampering() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS order_items_prevent_price_tampering ON public.order_items;
CREATE TRIGGER order_items_prevent_price_tampering
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_order_item_price_tampering();

-- Keep the parent order's subtotal/total in sync whenever a quantity edit
-- changes a line item's subtotal (the BEFORE trigger above already recomputed
-- NEW.subtotal off the real menu_items price before this AFTER trigger runs).
CREATE OR REPLACE FUNCTION public.sync_order_totals_after_item_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID := COALESCE(NEW.order_id, OLD.order_id);
  v_subtotal NUMERIC;
  v_delivery_fee NUMERIC;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
  FROM public.order_items WHERE order_id = v_order_id;

  SELECT delivery_fee INTO v_delivery_fee FROM public.orders WHERE id = v_order_id;

  PERFORM set_config('app.bypass_order_money_guard', 'true', true);

  UPDATE public.orders
  SET subtotal = v_subtotal,
      total = v_subtotal + COALESCE(v_delivery_fee, 0)
  WHERE id = v_order_id;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_order_totals_after_item_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS order_items_sync_order_totals ON public.order_items;
CREATE TRIGGER order_items_sync_order_totals
AFTER UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_totals_after_item_change();
