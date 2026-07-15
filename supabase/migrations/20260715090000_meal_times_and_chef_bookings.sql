-- Meal planning + chef event bookings.
--
-- 1. Vendors tag each menu item with when it can be eaten (breakfast /
--    lunch / dinner). The customer meal planner filters its picker by slot.
--    An empty array means "any time" so existing items keep appearing.
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS meal_times TEXT[] NOT NULL DEFAULT '{}';

-- 2. Chefs advertise an hourly cooking rate + a short blurb about the events
--    they cater. Customers book against this rate.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS event_services TEXT;

-- 3. Event bookings: a customer books a chef for a date, N hours, at the
--    chef's advertised rate.
CREATE TABLE public.chef_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  start_time TEXT,                        -- e.g. "14:00"
  hours NUMERIC NOT NULL CHECK (hours > 0 AND hours <= 24),
  guests INTEGER,
  note TEXT,
  currency TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL,           -- rate at time of booking
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chef_bookings_chef ON public.chef_bookings(chef_id, status);
CREATE INDEX idx_chef_bookings_customer ON public.chef_bookings(customer_id, created_at DESC);

ALTER TABLE public.chef_bookings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER chef_bookings_updated_at
BEFORE UPDATE ON public.chef_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Customers manage own chef bookings"
  ON public.chef_bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create chef bookings"
  ON public.chef_bookings FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers cancel own bookings"
  ON public.chef_bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Chefs view bookings for their kitchen"
  ON public.chef_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chef_bookings.chef_id AND v.owner_id = auth.uid()));

CREATE POLICY "Chefs respond to their bookings"
  ON public.chef_bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chef_bookings.chef_id AND v.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chef_bookings.chef_id AND v.owner_id = auth.uid()));

CREATE POLICY "Admins manage chef bookings"
  ON public.chef_bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Money fields are frozen after creation: chef and customer may only move
-- the status along, never reprice a booking.
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
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.chef_id IS DISTINCT FROM OLD.chef_id THEN
    RAISE EXCEPTION 'Only admins can change booking pricing or ownership';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_chef_booking_tampering() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chef_bookings_prevent_tampering
BEFORE UPDATE ON public.chef_bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_chef_booking_tampering();

-- Admin edits to bookings land in the audit trail like everything else.
DROP TRIGGER IF EXISTS audit_admin_changes ON public.chef_bookings;
CREATE TRIGGER audit_admin_changes
AFTER INSERT OR UPDATE OR DELETE ON public.chef_bookings
FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
