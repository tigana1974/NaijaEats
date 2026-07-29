-- Fix: notify_on_order_status_change referenced 'out_for_delivery', which is
-- NOT a value of the order_status enum
-- ('pending','accepted','preparing','ready','picked_up','delivered','cancelled').
-- Postgres coerces the CASE literal to order_status and raises
--   invalid input value for enum order_status: "out_for_delivery"
-- on EVERY order status change, so vendors/riders can't advance any order.
-- The correct enum value for the "out for delivery" stage is 'picked_up'
-- (the UI already labels picked_up as "Out for delivery").

CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_vendor_name TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT customer_id INTO v_customer_id FROM public.orders WHERE id = NEW.id;
    SELECT name INTO v_vendor_name FROM public.vendors WHERE id = NEW.vendor_id;

    IF v_customer_id IS NOT NULL THEN
      CASE NEW.status
        WHEN 'accepted' THEN
          v_title := 'Order Accepted';
          v_message := v_vendor_name || ' has accepted your order and will start preparing it soon.';
        WHEN 'preparing' THEN
          v_title := 'Order is Being Prepared';
          v_message := 'Good news! ' || v_vendor_name || ' is now preparing your order.';
        WHEN 'ready' THEN
          v_title := 'Order Ready';
          v_message := 'Your order from ' || v_vendor_name || ' is ready for pickup or delivery!';
        WHEN 'picked_up' THEN
          v_title := 'Order Out for Delivery';
          v_message := 'Your order from ' || v_vendor_name || ' is on its way to you!';
        WHEN 'delivered' THEN
          v_title := 'Order Delivered';
          v_message := 'Your order from ' || v_vendor_name || ' has been delivered. Enjoy your meal!';
        WHEN 'cancelled' THEN
          v_title := 'Order Cancelled';
          v_message := 'Your order from ' || v_vendor_name || ' has been cancelled.';
        ELSE
          v_title := 'Order Status Update';
          v_message := 'Your order from ' || v_vendor_name || ' status changed to: ' || NEW.status;
      END CASE;

      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_customer_id, v_title, v_message, 'order', '/orders/' || NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
