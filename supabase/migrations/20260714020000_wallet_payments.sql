-- Allow customers to mark their own orders as paid via a secure RPC

CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := auth.uid();
  v_order RECORD;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.customer_id <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this order';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Order is already paid';
  END IF;

  -- Temporarily bypass the money guard trigger if it exists
  PERFORM set_config('app.bypass_order_money_guard', 'true', true);

  UPDATE public.orders
  SET payment_status = 'paid'
  WHERE id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(UUID) TO authenticated;

-- Notify pgrst to reload schema so the RPC is instantly available to the frontend
NOTIFY pgrst, 'reload schema';
