-- Availability calendar for chef vendors
CREATE TABLE IF NOT EXISTS public.vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, date)
);

ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own availability
CREATE POLICY "Vendors manage own availability"
  ON public.vendor_availability
  FOR ALL
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
  );

-- Anyone can read availability (customers need to see it)
CREATE POLICY "Public read availability"
  ON public.vendor_availability
  FOR SELECT
  USING (true);
