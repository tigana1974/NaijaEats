-- Vendor subscription billing: upgrading a vendor plan now charges the
-- vendor's wallet (prices fixed server-side). Previously the client set
-- profiles.vendor_plan directly — upgrades were free.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vendor_plan_expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.purchase_vendor_plan(p_plan TEXT, p_cadence TEXT, p_region TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_price NUMERIC;
  v_days INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT public.has_role(v_user, 'vendor') THEN RAISE EXCEPTION 'Only vendors can change vendor plans'; END IF;
  IF p_plan NOT IN ('basic','premium','pro','enterprise') THEN RAISE EXCEPTION 'Invalid plan'; END IF;
  IF p_cadence NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'Invalid cadence'; END IF;
  IF p_region NOT IN ('NG','UK') THEN RAISE EXCEPTION 'Invalid region'; END IF;

  -- Downgrading to Basic is free and immediate.
  IF p_plan = 'basic' THEN
    UPDATE public.profiles SET vendor_plan = 'basic', vendor_plan_expires_at = NULL WHERE id = v_user;
    RETURN;
  END IF;

  v_price := CASE
    WHEN p_region = 'NG' AND p_plan = 'premium'    THEN CASE p_cadence WHEN 'monthly' THEN 15000 ELSE 144000 END
    WHEN p_region = 'NG' AND p_plan = 'pro'        THEN CASE p_cadence WHEN 'monthly' THEN 30000 ELSE 288000 END
    WHEN p_region = 'NG' AND p_plan = 'enterprise' THEN CASE p_cadence WHEN 'monthly' THEN 75000 ELSE 720000 END
    WHEN p_region = 'UK' AND p_plan = 'premium'    THEN CASE p_cadence WHEN 'monthly' THEN 39 ELSE 374 END
    WHEN p_region = 'UK' AND p_plan = 'pro'        THEN CASE p_cadence WHEN 'monthly' THEN 79 ELSE 758 END
    ELSE CASE p_cadence WHEN 'monthly' THEN 199 ELSE 1910 END
  END;
  v_days := CASE WHEN p_cadence = 'monthly' THEN 30 ELSE 365 END;

  PERFORM public.wallet_move(
    v_user, -v_price, 'premium',
    INITCAP(p_plan) || ' vendor plan — ' || p_cadence, NULL
  );

  UPDATE public.profiles
  SET vendor_plan = p_plan,
      vendor_plan_expires_at = GREATEST(COALESCE(vendor_plan_expires_at, now()), now()) + (v_days || ' days')::interval
  WHERE id = v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_vendor_plan(TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
