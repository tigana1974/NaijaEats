-- Wallet transaction PIN.
--
-- Every money movement (manual or via Xora) must be authorised with a 4–6 digit
-- PIN that only the account owner knows. The PIN is NEVER stored in plaintext:
-- we keep a bcrypt hash, in a table with no SELECT policy, reachable only via
-- SECURITY DEFINER functions. Brute force is limited with a failed-attempt
-- counter and a temporary lockout.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.wallet_security (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash         TEXT NOT NULL,
  failed_attempts  INT NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_security ENABLE ROW LEVEL SECURITY;

-- Deliberately NO policies: the hash must never be readable or writable from
-- the client. All access goes through the SECURITY DEFINER functions below.
REVOKE ALL ON public.wallet_security FROM anon, authenticated;

/* ─── Does the signed-in user have a PIN set? ─── */
CREATE OR REPLACE FUNCTION public.wallet_pin_status()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.wallet_security;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO r FROM public.wallet_security WHERE user_id = auth.uid();
  RETURN json_build_object(
    'has_pin', r.user_id IS NOT NULL,
    'locked', COALESCE(r.locked_until > now(), false),
    'locked_until', r.locked_until
  );
END;
$$;

/* ─── Set or change the PIN. Changing requires the current PIN. ─── */
CREATE OR REPLACE FUNCTION public.wallet_pin_set(p_new_pin TEXT, p_current_pin TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.wallet_security;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_new_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4 to 6 digits';
  END IF;
  -- Reject trivially guessable PINs.
  IF p_new_pin IN ('0000','1111','2222','3333','4444','5555','6666','7777','8888','9999',
                   '1234','4321','000000','123456','654321','111111') THEN
    RAISE EXCEPTION 'Please choose a less predictable PIN';
  END IF;

  SELECT * INTO r FROM public.wallet_security WHERE user_id = auth.uid();

  IF r.user_id IS NOT NULL THEN
    IF p_current_pin IS NULL OR r.pin_hash <> crypt(p_current_pin, r.pin_hash) THEN
      RAISE EXCEPTION 'Current PIN is incorrect';
    END IF;
    UPDATE public.wallet_security
       SET pin_hash = crypt(p_new_pin, gen_salt('bf')),
           failed_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE user_id = auth.uid();
  ELSE
    INSERT INTO public.wallet_security (user_id, pin_hash)
    VALUES (auth.uid(), crypt(p_new_pin, gen_salt('bf')));
  END IF;
END;
$$;

/* ─── Verify a PIN. Locks the wallet for 15 min after 5 bad tries. ─── */
CREATE OR REPLACE FUNCTION public.wallet_pin_verify(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.wallet_security;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO r FROM public.wallet_security WHERE user_id = auth.uid();
  IF r.user_id IS NULL THEN
    RAISE EXCEPTION 'No wallet PIN set. Please create one first.';
  END IF;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN
    RAISE EXCEPTION 'Too many incorrect attempts. Try again later.';
  END IF;

  IF r.pin_hash = crypt(p_pin, r.pin_hash) THEN
    UPDATE public.wallet_security
       SET failed_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE user_id = auth.uid();
    RETURN TRUE;
  END IF;

  UPDATE public.wallet_security
     SET failed_attempts = r.failed_attempts + 1,
         locked_until = CASE WHEN r.failed_attempts + 1 >= 5
                             THEN now() + INTERVAL '15 minutes' ELSE NULL END,
         updated_at = now()
   WHERE user_id = auth.uid();
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_pin_set(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_pin_verify(TEXT) TO authenticated;
