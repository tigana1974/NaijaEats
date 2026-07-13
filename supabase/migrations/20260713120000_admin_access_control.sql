-- Country-scoped admin access control + audit trail.
--
-- Model: the "parent" admin oversees both markets and mints per-country
-- access codes. "Manager" admins (role = admin, but not parent) must redeem
-- a code to unlock a country's panel, and every admin data change is logged
-- by DB triggers so the parent can see who changed what, and when.

-- ---------------------------------------------------------------------------
-- 1. Who is a parent admin vs a country manager
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_parent BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;

-- Every admin that exists before this migration becomes a parent, so the
-- current owner account keeps full access. Demote extras from the new
-- Access control page.
INSERT INTO public.admin_members (user_id, is_parent)
SELECT user_id, true FROM public.user_roles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_parent_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
     AND EXISTS (SELECT 1 FROM public.admin_members m WHERE m.user_id = _user_id AND m.is_parent);
$$;

REVOKE EXECUTE ON FUNCTION public.is_parent_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_parent_admin(UUID) TO authenticated;

CREATE POLICY "Parents manage admin members"
  ON public.admin_members FOR ALL TO authenticated
  USING (public.is_parent_admin(auth.uid()))
  WITH CHECK (public.is_parent_admin(auth.uid()));

CREATE POLICY "Admins view own membership"
  ON public.admin_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Access codes (parent-only table; managers redeem via RPC, never read it)
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  country public.country_code NOT NULL,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage access codes"
  ON public.admin_access_codes FOR ALL TO authenticated
  USING (public.is_parent_admin(auth.uid()))
  WITH CHECK (public.is_parent_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,           -- insert / update / delete / panel_unlocked / region_switched / code_created ...
  table_name TEXT,                -- for data changes
  record_id TEXT,                 -- id of the touched row
  country public.country_code,    -- for unlock / switch events
  details JSONB,                  -- changed fields ({field: {from, to}}) or event context
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_user ON public.admin_audit_log(user_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_parent_admin(auth.uid()));

-- All writes happen through the SECURITY DEFINER trigger/functions below, so
-- no INSERT policy is exposed to clients.

-- ---------------------------------------------------------------------------
-- 4. Trigger: log every admin-made data change (client code can't skip this)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  d JSONB;
  rec JSONB;
BEGIN
  -- Only track changes made by admin accounts (parent or manager).
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      INTO d
    FROM jsonb_each(to_jsonb(OLD)) o
    JOIN jsonb_each(to_jsonb(NEW)) n ON n.key = o.key
    WHERE o.value IS DISTINCT FROM n.value
      AND n.key NOT IN ('updated_at');
    IF d IS NULL THEN
      RETURN NEW; -- nothing meaningful changed
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    d := jsonb_build_object('new', to_jsonb(NEW));
  ELSE
    d := jsonb_build_object('old', to_jsonb(OLD));
  END IF;

  rec := to_jsonb(COALESCE(NEW, OLD));
  INSERT INTO public.admin_audit_log (user_id, action, table_name, record_id, details)
  VALUES (uid, lower(TG_OP), TG_TABLE_NAME, COALESCE(rec->>'id', rec->>'user_id'), d);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_admin_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vendors', 'orders', 'deliveries', 'payouts', 'menu_items',
    'rider_documents', 'vendor_documents', 'user_roles',
    'admin_access_codes', 'admin_members'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_admin_changes ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_admin_changes AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_admin_change()', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. RPCs used by the panel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_admin_scope()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_admin', public.has_role(auth.uid(), 'admin'),
    'is_parent', public.is_parent_admin(auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.create_admin_access_code(p_country public.country_code, p_label TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  new_id UUID;
BEGIN
  IF NOT public.is_parent_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only the parent admin can create access codes';
  END IF;

  -- 8 chars from an alphabet without lookalike characters (no 0/O, 1/I/L).
  SELECT string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 31) + 1)::int, 1), '')
    INTO new_code
  FROM generate_series(1, 8);

  INSERT INTO public.admin_access_codes (code, country, label, created_by)
  VALUES (new_code, p_country, NULLIF(trim(p_label), ''), auth.uid())
  RETURNING id INTO new_id;

  INSERT INTO public.admin_audit_log (user_id, action, country, record_id, details)
  VALUES (auth.uid(), 'code_created', p_country, new_id::text, jsonb_build_object('label', p_label));

  RETURN jsonb_build_object('id', new_id, 'code', new_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_code_active(p_id UUID, p_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_parent_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only the parent admin can manage access codes';
  END IF;
  UPDATE public.admin_access_codes SET active = p_active WHERE id = p_id;
  INSERT INTO public.admin_audit_log (user_id, action, record_id)
  VALUES (auth.uid(), CASE WHEN p_active THEN 'code_activated' ELSE 'code_deactivated' END, p_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_admin_code(p_code TEXT, p_country public.country_code)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  SELECT * INTO c FROM public.admin_access_codes
  WHERE code = upper(trim(p_code));

  IF c IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'That code is not valid.');
  END IF;
  IF c.country <> p_country THEN
    RETURN jsonb_build_object('ok', false, 'reason',
      format('That code unlocks %s, not %s.',
        CASE c.country WHEN 'NG' THEN 'Nigeria' ELSE 'the UK' END,
        CASE p_country WHEN 'NG' THEN 'Nigeria' ELSE 'the UK' END));
  END IF;
  IF NOT c.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'That code has been deactivated.');
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'That code has expired.');
  END IF;

  UPDATE public.admin_access_codes
  SET use_count = use_count + 1, last_used_at = now()
  WHERE id = c.id;

  INSERT INTO public.admin_audit_log (user_id, action, country, record_id)
  VALUES (auth.uid(), 'panel_unlocked', p_country, c.id::text);

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_admin_event(p_action TEXT, p_country public.country_code DEFAULT NULL, p_details JSONB DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  INSERT INTO public.admin_audit_log (user_id, action, country, details)
  VALUES (auth.uid(), p_action, p_country, p_details);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_admin_scope() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_admin_access_code(public.country_code, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_admin_code_active(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_code(TEXT, public.country_code) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_event(TEXT, public.country_code, JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_admin_scope() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_access_code(public.country_code, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_code_active(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(TEXT, public.country_code) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_event(TEXT, public.country_code, JSONB) TO authenticated;
