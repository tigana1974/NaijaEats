-- Live rider tracking: the rider app writes its GPS position onto the active
-- delivery row (throttled client-side to ~1 write per 12s), and the customer
-- order page reads it — instantly via realtime (deliveries is already in the
-- supabase_realtime publication) with polling as backstop.
--
-- Access control is already right: riders can only UPDATE their own delivery,
-- customers can only SELECT deliveries for their own orders, and the
-- prevent_delivery_tampering trigger doesn't cover these columns so rider
-- writes pass.
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS rider_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS rider_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS rider_location_at TIMESTAMPTZ;
