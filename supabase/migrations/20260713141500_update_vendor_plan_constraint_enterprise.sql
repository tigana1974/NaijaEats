-- Update vendor_plan check constraint to include 'enterprise'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vendor_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vendor_plan_check
  CHECK (vendor_plan IN ('basic', 'premium', 'pro', 'enterprise'));
