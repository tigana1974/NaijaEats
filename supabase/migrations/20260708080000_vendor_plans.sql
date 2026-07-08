-- Add vendor_plan to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vendor_plan TEXT NOT NULL DEFAULT 'basic' CHECK (vendor_plan IN ('basic', 'premium'));
