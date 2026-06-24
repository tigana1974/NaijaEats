-- Auto-create a delivery row whenever a new order is placed
CREATE OR REPLACE FUNCTION public.handle_new_order_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup TEXT;
BEGIN
  SELECT COALESCE(v.address_line, '') || CASE WHEN v.city IS NOT NULL THEN ', ' || v.city ELSE '' END
    INTO v_pickup
  FROM public.vendors v
  WHERE v.id = NEW.vendor_id;

  INSERT INTO public.deliveries (order_id, status, fee, currency, pickup_address, dropoff_address)
  VALUES (
    NEW.id,
    'unassigned',
    COALESCE(NEW.delivery_fee, 0),
    NEW.currency,
    v_pickup,
    NEW.delivery_address
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_create_delivery ON public.orders;
CREATE TRIGGER on_order_created_create_delivery
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order_delivery();

-- Ensure one delivery per order
CREATE UNIQUE INDEX IF NOT EXISTS deliveries_order_id_unique ON public.deliveries(order_id);