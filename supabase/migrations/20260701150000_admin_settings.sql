-- Global Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  platform_name TEXT NOT NULL DEFAULT 'Naija Eats',
  default_currency TEXT NOT NULL DEFAULT 'NGN',
  default_service_charge_pct NUMERIC NOT NULL DEFAULT 5.0,
  default_commission_pct NUMERIC NOT NULL DEFAULT 15.0,
  cash_on_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  wallet_payments_enabled BOOLEAN NOT NULL DEFAULT true,
  referral_program_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_single_row CHECK (id = 1)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write settings
CREATE POLICY "Admins manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Everyone can read platform settings (needed for frontend configurations)
CREATE POLICY "Public read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

-- Insert default row if not exists
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
