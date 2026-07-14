-- Per-country delivery settings. Nigeria and the UK are separate markets with
-- separate currencies and economics, so logistics config is one row per
-- country instead of a single global blob.
CREATE TABLE public.delivery_settings (
  country public.country_code PRIMARY KEY,
  base_fee NUMERIC NOT NULL,
  per_km_fee NUMERIC NOT NULL,
  max_radius_km NUMERIC NOT NULL DEFAULT 15,
  free_delivery_threshold NUMERIC NOT NULL,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  rider_cut_percentage NUMERIC NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Customer/vendor apps read these to compute fees.
CREATE POLICY "Anyone reads delivery settings"
  ON public.delivery_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage delivery settings"
  ON public.delivery_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sensible starting points per market (₦ for NG, £ for UK).
INSERT INTO public.delivery_settings
  (country, base_fee, per_km_fee, max_radius_km, free_delivery_threshold, surge_multiplier, rider_cut_percentage)
VALUES
  ('NG', 1500, 150, 15, 25000, 1.0, 80),
  ('UK', 3.50, 0.80, 10, 30, 1.0, 80)
ON CONFLICT (country) DO NOTHING;

-- Changes to delivery economics land in the admin audit trail.
DROP TRIGGER IF EXISTS audit_admin_changes ON public.delivery_settings;
CREATE TRIGGER audit_admin_changes
AFTER INSERT OR UPDATE OR DELETE ON public.delivery_settings
FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
