-- Chef booking availability.
--
-- 1. chef_time_blocks — admin/chef-declared "not bookable" windows.
-- 2. chef_busy_slots() — the busy windows (confirmed/pending bookings +
--    blocks) for one chef on one date, exposed without leaking any customer
--    data, so the booking form can grey out taken times.

CREATE TABLE IF NOT EXISTS public.chef_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '00:00',
  end_time TIME NOT NULL DEFAULT '23:59',
  reason TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_chef_time_blocks_vendor_date ON public.chef_time_blocks(vendor_id, date);

ALTER TABLE public.chef_time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read chef blocks" ON public.chef_time_blocks;
CREATE POLICY "Anyone can read chef blocks" ON public.chef_time_blocks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage chef blocks" ON public.chef_time_blocks;
CREATE POLICY "Admins manage chef blocks" ON public.chef_time_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Chefs manage own blocks" ON public.chef_time_blocks;
CREATE POLICY "Chefs manage own blocks" ON public.chef_time_blocks
  FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_time_blocks TO authenticated;
GRANT SELECT ON public.chef_time_blocks TO anon;
GRANT ALL ON public.chef_time_blocks TO service_role;

-- Busy windows for a chef on a date: pending/accepted bookings (a booking
-- with no start time holds the whole day) plus admin/chef blocks. Definer so
-- it can read other customers' bookings while returning only time ranges.
CREATE OR REPLACE FUNCTION public.chef_busy_slots(p_chef_id UUID, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_out JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(slot ORDER BY slot->>'start'), '[]'::jsonb) INTO v_out
  FROM (
    SELECT jsonb_build_object(
      'start', COALESCE(NULLIF(b.start_time, ''), '00:00'),
      'end', CASE
        WHEN NULLIF(b.start_time, '') IS NULL THEN '23:59'
        -- start + duration in minutes, clamped to 23:59 so it never wraps
        ELSE TO_CHAR(
          TIME '00:00' + LEAST(
            EXTRACT(EPOCH FROM (b.start_time || ':00')::time) / 60 + b.hours * 60,
            1439
          ) * INTERVAL '1 minute', 'HH24:MI')
      END,
      'source', 'booking'
    ) AS slot
    FROM public.chef_bookings b
    WHERE b.chef_id = p_chef_id
      AND b.event_date = p_date
      AND b.status IN ('pending', 'accepted', 'countered')
    UNION ALL
    SELECT jsonb_build_object(
      'start', TO_CHAR(t.start_time, 'HH24:MI'),
      'end', TO_CHAR(t.end_time, 'HH24:MI'),
      'source', 'block'
    ) AS slot
    FROM public.chef_time_blocks t
    WHERE t.vendor_id = p_chef_id AND t.date = p_date
  ) s;
  RETURN v_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chef_busy_slots(UUID, DATE) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
