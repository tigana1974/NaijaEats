-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  link TEXT,
  is_unread BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to auto-create notifications when order status changes
CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_vendor_name TEXT;
BEGIN
  -- We only care when the status actually changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Get the customer ID and vendor name
    SELECT customer_id INTO v_customer_id FROM public.orders WHERE id = NEW.id;
    SELECT name INTO v_vendor_name FROM public.vendors WHERE id = NEW.vendor_id;

    -- If the order is for a customer, send them a notification
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
        WHEN 'out_for_delivery' THEN
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

      -- Insert the notification
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_customer_id, v_title, v_message, 'order', '/orders/' || NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_status_change();
