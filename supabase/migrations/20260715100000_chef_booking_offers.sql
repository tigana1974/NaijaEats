-- Chef booking price negotiation.
--
-- Customers can bid their own price instead of accepting the chef's rate;
-- the chef can accept, decline, or counter-offer; the customer then accepts
-- or walks away. Every move lands in the other party's notifications inbox.

ALTER TABLE public.chef_bookings
  ADD COLUMN IF NOT EXISTS offer_total NUMERIC,     -- the customer's bid (their proposed total)
  ADD COLUMN IF NOT EXISTS counter_total NUMERIC;   -- the chef's counter-offer

-- Add the 'countered' state to the lifecycle.
ALTER TABLE public.chef_bookings DROP CONSTRAINT IF EXISTS chef_bookings_status_check;
ALTER TABLE public.chef_bookings ADD CONSTRAINT chef_bookings_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'completed', 'cancelled'));

-- Rework the tamper guard: pricing stays frozen EXCEPT for the two legal
-- negotiation moves — the chef setting a counter, and the customer accepting
-- that exact counter (which becomes the agreed total).
CREATE OR REPLACE FUNCTION public.prevent_chef_booking_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.chef_id IS DISTINCT FROM OLD.chef_id
     OR NEW.offer_total IS DISTINCT FROM OLD.offer_total THEN
    RAISE EXCEPTION 'Only admins can change booking pricing or ownership';
  END IF;

  IF NEW.counter_total IS DISTINCT FROM OLD.counter_total THEN
    -- Only as part of the chef moving the booking to 'countered'.
    IF NOT (NEW.status = 'countered' AND NEW.counter_total > 0) THEN
      RAISE EXCEPTION 'A counter-offer can only be set while countering the booking';
    END IF;
  END IF;

  IF NEW.total IS DISTINCT FROM OLD.total THEN
    -- Only as the customer accepting the chef''s exact counter.
    IF NOT (OLD.status = 'countered' AND NEW.status = 'accepted' AND NEW.total = OLD.counter_total) THEN
      RAISE EXCEPTION 'The agreed total can only change by accepting the chef''s counter-offer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Inbox notifications for every negotiation move.
CREATE OR REPLACE FUNCTION public.notify_chef_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_chef_name TEXT;
  v_symbol TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner, v_chef_name FROM public.vendors WHERE id = NEW.chef_id;
  v_symbol := CASE WHEN NEW.currency = 'GBP' THEN '£' ELSE '₦' END;

  IF TG_OP = 'INSERT' THEN
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_owner,
        CASE WHEN NEW.offer_total IS NOT NULL THEN 'New booking offer' ELSE 'New event booking request' END,
        CASE WHEN NEW.offer_total IS NOT NULL
          THEN format('A customer offered %s%s for %s hours on %s. Accept, decline, or counter.', v_symbol, NEW.offer_total, NEW.hours, NEW.event_date)
          ELSE format('A customer wants to book you for %s hours on %s (%s%s).', NEW.hours, NEW.event_date, v_symbol, NEW.total)
        END,
        'order',
        '/vendor/profile'
      );
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'countered' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.customer_id, 'Chef sent a counter-offer',
        format('%s countered your offer with %s%s for your event on %s. Open Book a Chef to respond.', COALESCE(v_chef_name, 'The chef'), v_symbol, NEW.counter_total, NEW.event_date),
        'order', '/book');
    ELSIF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.customer_id, 'Booking confirmed',
        format('%s accepted your booking for %s — total %s%s.', COALESCE(v_chef_name, 'The chef'), NEW.event_date, v_symbol, NEW.total),
        'order', '/book');
      -- Also tell the chef when it was the customer who accepted a counter.
      IF OLD.status = 'countered' AND v_owner IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (v_owner, 'Counter-offer accepted',
          format('Your counter of %s%s was accepted for the event on %s.', v_symbol, NEW.total, NEW.event_date),
          'order', '/vendor/profile');
      END IF;
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.customer_id, 'Booking declined',
        format('%s declined your booking request for %s.', COALESCE(v_chef_name, 'The chef'), NEW.event_date),
        'order', '/book');
    ELSIF NEW.status = 'cancelled' AND v_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_owner, 'Booking cancelled',
        format('The customer cancelled the booking for %s.', NEW.event_date),
        'order', '/vendor/profile');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_chef_booking() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chef_bookings_notify ON public.chef_bookings;
CREATE TRIGGER chef_bookings_notify
AFTER INSERT OR UPDATE ON public.chef_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_chef_booking();
