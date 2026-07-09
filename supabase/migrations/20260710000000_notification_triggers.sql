-- Auto-create notification rows for the events every role cares about.
-- Client shells already query `notifications` with `is_unread = true`, so the
-- unread count on the bell icon updates the moment one of these triggers
-- inserts a row.

/* ─────────── 1. New chat message → notify the other participant ─────────── */

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer UUID;
  v_owner UUID;
  v_recipient UUID;
  v_sender_name TEXT;
  v_body_preview TEXT;
  v_link TEXT;
BEGIN
  SELECT c.customer_id, vd.owner_id
    INTO v_customer, v_owner
  FROM public.conversations c
  JOIN public.vendors vd ON vd.id = c.vendor_id
  WHERE c.id = NEW.conversation_id;

  IF v_customer IS NULL OR v_owner IS NULL THEN RETURN NEW; END IF;

  -- Recipient = whichever participant is NOT the sender
  IF NEW.sender_id = v_customer THEN
    v_recipient := v_owner;
    v_link := '/vendor/messages/' || NEW.conversation_id;
  ELSIF NEW.sender_id = v_owner THEN
    v_recipient := v_customer;
    v_link := '/chats/' || (SELECT vendor_id FROM public.conversations WHERE id = NEW.conversation_id);
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  v_body_preview := CASE
    WHEN NEW.body IS NULL OR length(NEW.body) = 0 THEN 'Sent an attachment'
    WHEN length(NEW.body) > 80 THEN substr(NEW.body, 1, 80) || '…'
    ELSE NEW.body
  END;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    v_recipient,
    'message',
    'New message from ' || v_sender_name,
    v_body_preview,
    v_link
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_notify ON public.messages;
CREATE TRIGGER on_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

/* ─────────── 2. New order → notify the vendor + confirm to the customer ─── */

CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_vendor_name TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner, v_vendor_name
  FROM public.vendors WHERE id = NEW.vendor_id;

  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      v_owner,
      'order',
      'New order received',
      'A customer just placed an order — tap to accept.',
      '/vendor/orders'
    );
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.customer_id,
      'order',
      'Order placed',
      COALESCE('Your order from ' || v_vendor_name || ' has been placed.', 'Your order has been placed.'),
      '/orders/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_notify ON public.orders;
CREATE TRIGGER on_order_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

/* ─────────── 3. Order status changes → notify the customer ─────────────── */

CREATE OR REPLACE FUNCTION public.notify_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'accepted'   THEN v_title := 'Order accepted';   v_msg := 'Your order was accepted and is being prepared.';
    WHEN 'preparing'  THEN v_title := 'Order in the kitchen'; v_msg := 'The chef is preparing your food now.';
    WHEN 'ready'      THEN v_title := 'Order ready';      v_msg := 'Your order is ready and out for delivery soon.';
    WHEN 'picked_up'  THEN v_title := 'Rider on the way'; v_msg := 'Your rider has picked up the order.';
    WHEN 'delivered'  THEN v_title := 'Delivered';        v_msg := 'Your order has been delivered. Enjoy!';
    WHEN 'cancelled'  THEN v_title := 'Order cancelled';  v_msg := 'Your order was cancelled.';
    ELSE RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (NEW.customer_id, 'order', v_title, v_msg, '/orders/' || NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_notify ON public.orders;
CREATE TRIGGER on_order_status_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status();

/* ─────────── 4. Delivery assignment → notify the rider ─────────────────── */

CREATE OR REPLACE FUNCTION public.notify_delivery_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when a rider is actually assigned (was null / became not null,
  -- or was reassigned to a different rider)
  IF NEW.rider_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.rider_id IS NOT DISTINCT FROM NEW.rider_id THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.rider_id,
    'delivery',
    'New pickup assigned',
    'You have a new delivery to pick up.',
    '/rider/dashboard'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_delivery_assigned ON public.deliveries;
CREATE TRIGGER on_delivery_assigned
  AFTER INSERT OR UPDATE OF rider_id ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.notify_delivery_assigned();

/* ─────────── 5. Payment status → notify the customer & vendor ─────────── */

CREATE OR REPLACE FUNCTION public.notify_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer UUID;
  v_owner UUID;
  v_vendor_name TEXT;
  v_amount TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;

  SELECT o.customer_id, v.owner_id, v.name
    INTO v_customer, v_owner, v_vendor_name
  FROM public.orders o
  JOIN public.vendors v ON v.id = o.vendor_id
  WHERE o.id = NEW.order_id;

  v_amount := to_char(NEW.amount, 'FM999,999,990.00');

  IF v_customer IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      v_customer,
      'payment',
      'Payment confirmed',
      'Your payment of ' || v_amount || ' was received.',
      '/orders/' || NEW.order_id
    );
  END IF;

  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      v_owner,
      'payment',
      'Payment received',
      'You received ' || v_amount || ' for a new order.',
      '/vendor/earnings'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payment_notify ON public.payments;
CREATE TRIGGER on_payment_notify
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_status();

/* ─────────── 6. Wallet transfer received → notify recipient ─────────────── */

CREATE OR REPLACE FUNCTION public.notify_wallet_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_label TEXT;
BEGIN
  v_label := CASE
    WHEN NEW.sender_username IS NOT NULL THEN '@' || NEW.sender_username
    WHEN NEW.sender_name IS NOT NULL THEN NEW.sender_name
    ELSE 'A friend'
  END;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.recipient_id,
    'wallet',
    'Money received',
    v_label || ' sent you ₦' || to_char(NEW.amount, 'FM999,999,990.00') || (CASE WHEN NEW.note IS NOT NULL THEN ' — ' || NEW.note ELSE '' END),
    '/wallet'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wallet_transfer_notify ON public.wallet_transfers;
CREATE TRIGGER on_wallet_transfer_notify
  AFTER INSERT ON public.wallet_transfers
  FOR EACH ROW EXECUTE FUNCTION public.notify_wallet_transfer();

/* ─────────── 7. Payout status change → notify recipient ─────────────────── */

CREATE OR REPLACE FUNCTION public.notify_payout_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'processing' THEN v_title := 'Payout processing'; v_msg := 'Your payout is being processed.';
    WHEN 'paid'       THEN v_title := 'Payout completed';  v_msg := 'Your payout of ' || NEW.currency || ' ' || to_char(NEW.amount, 'FM999,999,990.00') || ' has been sent.';
    WHEN 'rejected'   THEN v_title := 'Payout rejected';   v_msg := 'Your payout request was rejected — check with support.';
    ELSE RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (NEW.user_id, 'payout', v_title, v_msg, '/wallet');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payout_status_notify ON public.payouts;
CREATE TRIGGER on_payout_status_notify
  AFTER INSERT OR UPDATE OF status ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_payout_status();

/* ─────────── 8. Vendor status (approved / suspended) → notify owner ────── */

CREATE OR REPLACE FUNCTION public.notify_vendor_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
BEGIN
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'approved'  THEN v_title := 'Shop approved 🎉';  v_msg := NEW.name || ' is now live on Discover.';
    WHEN 'suspended' THEN v_title := 'Shop suspended';    v_msg := NEW.name || ' has been suspended. Contact support.';
    WHEN 'pending'   THEN v_title := 'Shop pending review'; v_msg := NEW.name || ' is being reviewed by our team.';
    ELSE RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (NEW.owner_id, 'shop', v_title, v_msg, '/vendor/shops');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_vendor_status_notify ON public.vendors;
CREATE TRIGGER on_vendor_status_notify
  AFTER INSERT OR UPDATE OF status ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.notify_vendor_status();

/* ─────────── Realtime + read policies ─────────────────────────────────── */

-- Make sure notifications stream to clients in realtime.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
