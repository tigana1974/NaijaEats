-- Fix: vendors (and customers) could not send chat messages.
--
-- 20260611090818 revoked EXECUTE on helper functions FROM PUBLIC. In
-- Postgres, the `authenticated` role inherits function access via the
-- default PUBLIC grant, so revoking PUBLIC without an explicit grant to
-- `authenticated` locked EVERY signed-in user out of any RLS policy that
-- calls these functions:
--
--   · messages INSERT policy  → is_conversation_participant()  → replies fail
--   · vendors SELECT policy   → has_role()                     → landing page
--     and menu queries fail for anon visitors
--
-- These grants restore the intended state: authenticated users may execute
-- the helpers (they are SECURITY DEFINER and safe — they only read), and
-- anon needs has_role because public vendor/menu SELECT policies call it.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
