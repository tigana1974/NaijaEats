-- 1. Add is_master_admin to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Upgrade all existing admins to master_admin so no one is locked out initially
UPDATE public.user_roles 
SET is_master_admin = true 
WHERE role = 'admin';

-- 3. Create user_invites table
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'admin',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS on user_invites
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Only master admins can select/view invites
CREATE POLICY "Master admins can view invites"
  ON public.user_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_master_admin = true
    )
  );

-- Policy: Only master admins can insert invites
CREATE POLICY "Master admins can insert invites"
  ON public.user_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_master_admin = true
    )
  );

-- Policy: Only master admins can delete invites
CREATE POLICY "Master admins can delete invites"
  ON public.user_invites
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_master_admin = true
    )
  );

-- 5. Secure the handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  selected_role public.app_role;
  selected_country public.country_code;
  selected_currency TEXT;
  invite_record RECORD;
BEGIN
  -- Check if there's a pending invite for this email
  SELECT * INTO invite_record FROM public.user_invites WHERE email = NEW.email;

  IF FOUND THEN
    -- If invited, use the invited role
    selected_role := invite_record.role;
    
    -- Delete the used invite
    DELETE FROM public.user_invites WHERE id = invite_record.id;
  ELSE
    -- IMPORTANT SECURITY FIX:
    -- Only allow safe roles from metadata (or default to customer).
    -- Explicitly PREVENT anyone from injecting 'admin'.
    selected_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'customer'
    );
    
    IF selected_role = 'admin' THEN
      selected_role := 'customer'; -- Silently fallback to customer if they try to hack it
    END IF;
  END IF;

  selected_country := COALESCE(
    (NEW.raw_user_meta_data->>'country')::public.country_code,
    'NG'
  );

  selected_currency := CASE selected_country
    WHEN 'UK' THEN 'GBP'
    ELSE 'NGN'
  END;

  INSERT INTO public.profiles (id, full_name, country, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    selected_country,
    selected_currency
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
