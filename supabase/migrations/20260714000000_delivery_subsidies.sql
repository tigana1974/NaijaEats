-- Add subsidization fields to support Free Delivery Option 3
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS offers_free_delivery BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subsidized_delivery_fee NUMERIC NOT NULL DEFAULT 0;

-- Drop the old create_order
DROP FUNCTION IF EXISTS public.create_order(UUID, JSONB, TEXT, TEXT, TIMESTAMPTZ);

-- Recreate with new p_calculated_delivery_fee param
CREATE OR REPLACE FUNCTION public.create_order(
  p_vendor_id UUID,
  p_items JSONB,
  p_delivery_address TEXT DEFAULT NULL,
  p_customer_note TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_calculated_delivery_fee NUMERIC DEFAULT 0
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
  v_customer_fee NUMERIC := 0;
  v_subsidized_fee NUMERIC := 0;
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

  -- Determine who pays the delivery fee
  IF v_vendor.offers_free_delivery THEN
    v_customer_fee := 0;
    v_subsidized_fee := p_calculated_delivery_fee;
  ELSE
    v_customer_fee := p_calculated_delivery_fee;
    v_subsidized_fee := 0;
  END IF;

  -- Create the order shell first
  INSERT INTO public.orders (customer_id, vendor_id, status, currency, delivery_address, customer_note, scheduled_for, delivery_fee, subsidized_delivery_fee)
  VALUES (v_customer_id, p_vendor_id, 'pending', v_currency, p_delivery_address, p_customer_note, p_scheduled_for, v_customer_fee, v_subsidized_fee)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for item %', v_item->>'menu_item_id';
    END IF;

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
      total = v_subtotal + v_customer_fee
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(UUID, JSONB, TEXT, TEXT, TIMESTAMPTZ, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(UUID, JSONB, TEXT, TEXT, TIMESTAMPTZ, NUMERIC) TO authenticated;

-- Update the handle_new_order_delivery trigger to sum both fees for the rider
CREATE OR REPLACE FUNCTION public.handle_new_order_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup TEXT;
  v_total_rider_fee NUMERIC;
BEGIN
  SELECT COALESCE(v.address_line, '') || CASE WHEN v.city IS NOT NULL THEN ', ' || v.city ELSE '' END
    INTO v_pickup
  FROM public.vendors v
  WHERE v.id = NEW.vendor_id;

  v_total_rider_fee := COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.subsidized_delivery_fee, 0);

  INSERT INTO public.deliveries (order_id, status, fee, currency, pickup_address, dropoff_address)
  VALUES (
    NEW.id,
    'unassigned',
    v_total_rider_fee,
    NEW.currency,
    v_pickup,
    NEW.delivery_address
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
