-- Payable chat invoices shared between a vendor and customer. Payment is
-- atomic: debit payer, credit vendor, mark invoice paid, then notify parties.

CREATE TABLE IF NOT EXISTS public.chat_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID UNIQUE REFERENCES public.messages(id) ON DELETE SET NULL,
  issuer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  note TEXT NOT NULL DEFAULT 'Food invoice',
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_invoices_conversation
  ON public.chat_invoices(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_invoices_code ON public.chat_invoices(code);

ALTER TABLE public.chat_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view chat invoices" ON public.chat_invoices;
CREATE POLICY "Participants view chat invoices"
  ON public.chat_invoices FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

GRANT SELECT ON public.chat_invoices TO authenticated;
GRANT ALL ON public.chat_invoices TO service_role;

DROP TRIGGER IF EXISTS update_chat_invoices_updated_at ON public.chat_invoices;
CREATE TRIGGER update_chat_invoices_updated_at
  BEFORE UPDATE ON public.chat_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.chat_invoice_create(
  p_conversation_id UUID,
  p_amount NUMERIC,
  p_note TEXT DEFAULT 'Food invoice'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner UUID;
  v_currency TEXT;
  v_code TEXT;
  v_message_id UUID := gen_random_uuid();
  v_invoice public.chat_invoices;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT v.owner_id, COALESCE(v.currency, 'NGN')
    INTO v_owner, v_currency
  FROM public.conversations c
  JOIN public.vendors v ON v.id = c.vendor_id
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF v_owner <> v_user THEN RAISE EXCEPTION 'Only the vendor can issue an invoice in this conversation'; END IF;

  LOOP
    v_code := UPPER(SUBSTR(MD5(gen_random_uuid()::text || clock_timestamp()::text), 1, 10));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.chat_invoices WHERE code = v_code);
  END LOOP;

  INSERT INTO public.messages (id, conversation_id, sender_id, body)
  VALUES (v_message_id, p_conversation_id, v_user, '[[CHAT_INVOICE:' || v_code || ']]');

  INSERT INTO public.chat_invoices (
    code, conversation_id, message_id, issuer_id, amount, currency, note
  ) VALUES (
    v_code,
    p_conversation_id,
    v_message_id,
    v_user,
    p_amount,
    v_currency,
    LEFT(COALESCE(NULLIF(TRIM(p_note), ''), 'Food invoice'), 300)
  ) RETURNING * INTO v_invoice;

  RETURN to_jsonb(v_invoice);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_invoice_lookup(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT i.id, i.code, i.conversation_id, i.message_id, i.amount, i.currency,
         i.note, i.status, i.created_at, i.paid_at,
         COALESCE(NULLIF(p.full_name, ''), v.name, 'NaijaEats vendor') AS issuer_name
    INTO v_row
  FROM public.chat_invoices i
  JOIN public.conversations c ON c.id = i.conversation_id
  JOIN public.vendors v ON v.id = c.vendor_id
  LEFT JOIN public.profiles p ON p.id = i.issuer_id
  WHERE i.code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_invoice_pay(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_invoice public.chat_invoices;
  v_customer UUID;
  v_vendor_id UUID;
  v_vendor_name TEXT;
  v_payer_name TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO v_invoice
  FROM public.chat_invoices
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF v_invoice.status <> 'unpaid' THEN RAISE EXCEPTION 'This invoice is no longer unpaid'; END IF;
  IF v_invoice.issuer_id = v_user THEN RAISE EXCEPTION 'You cannot pay your own invoice'; END IF;

  SELECT c.customer_id, c.vendor_id, v.name
    INTO v_customer, v_vendor_id, v_vendor_name
  FROM public.conversations c
  JOIN public.vendors v ON v.id = c.vendor_id
  WHERE c.id = v_invoice.conversation_id;

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone') INTO v_payer_name
  FROM public.profiles WHERE id = v_user;

  PERFORM public.wallet_move(
    v_user,
    -v_invoice.amount,
    'invoice',
    'Paid ' || COALESCE(v_vendor_name, 'vendor') || ' invoice',
    'INV-' || v_invoice.code
  );
  PERFORM public.wallet_move(
    v_invoice.issuer_id,
    v_invoice.amount,
    'invoice',
    'Invoice paid by ' || COALESCE(v_payer_name, 'customer'),
    'INV-' || v_invoice.code
  );

  UPDATE public.chat_invoices
  SET status = 'paid', payer_id = v_user, paid_at = now(), updated_at = now()
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_invoice.issuer_id,
    'Invoice paid',
    COALESCE(v_payer_name, 'A customer') || ' paid invoice INV-' || v_invoice.code || '.',
    'wallet',
    '/vendor/messages/' || v_invoice.conversation_id
  );

  IF v_customer IS DISTINCT FROM v_user AND v_customer IS DISTINCT FROM v_invoice.issuer_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_customer,
      'Your invoice was paid',
      COALESCE(v_payer_name, 'Someone') || ' paid invoice INV-' || v_invoice.code || ' for you.',
      'wallet',
      '/chats/' || v_vendor_id
    );
  END IF;

  RETURN to_jsonb(v_invoice);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_invoice_share(p_code TEXT, p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_invoice public.chat_invoices;
  v_recipient RECORD;
  v_sender_name TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO v_invoice FROM public.chat_invoices
  WHERE code = UPPER(TRIM(p_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  IF NOT public.is_conversation_participant(v_invoice.conversation_id, v_user) THEN
    RAISE EXCEPTION 'You cannot share this invoice';
  END IF;

  SELECT id, username, COALESCE(NULLIF(full_name, ''), '@' || username) AS display_name
    INTO v_recipient
  FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(LEADING '@' FROM p_username));
  IF NOT FOUND THEN RAISE EXCEPTION 'NaijaEats ID not found'; END IF;
  IF v_recipient.id = v_user THEN RAISE EXCEPTION 'Choose another NaijaEats user'; END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = v_user;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_recipient.id,
    'Invoice shared with you',
    v_sender_name || ' shared invoice INV-' || v_invoice.code || ' with you.',
    'wallet',
    '/invoice/' || v_invoice.code
  );

  RETURN jsonb_build_object('username', v_recipient.username, 'display_name', v_recipient.display_name);
END;
$$;

REVOKE ALL ON FUNCTION public.chat_invoice_create(UUID, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_invoice_lookup(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_invoice_pay(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_invoice_share(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_invoice_create(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_invoice_lookup(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_invoice_pay(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_invoice_share(TEXT, TEXT) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_invoices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE public.chat_invoices REPLICA IDENTITY FULL;

-- Keep attachment notifications readable instead of exposing message markers.
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer UUID;
  v_owner UUID;
  v_recipient UUID;
  v_sender_name TEXT;
  v_body_preview TEXT;
  v_link TEXT;
BEGIN
  SELECT c.customer_id, vd.owner_id
    INTO v_customer, v_owner
  FROM public.conversations c
  JOIN public.vendors vd ON vd.id = c.vendor_id
  WHERE c.id = NEW.conversation_id;

  IF v_customer IS NULL OR v_owner IS NULL THEN RETURN NEW; END IF;

  IF NEW.sender_id = v_customer THEN
    v_recipient := v_owner;
    v_link := '/vendor/messages/' || NEW.conversation_id;
  ELSIF NEW.sender_id = v_owner THEN
    v_recipient := v_customer;
    v_link := '/chats/' || (SELECT vendor_id FROM public.conversations WHERE id = NEW.conversation_id);
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  v_body_preview := CASE
    WHEN NEW.body LIKE '[[CHAT_INVOICE:%' THEN 'Sent you an invoice'
    WHEN NEW.body LIKE '[[AUDIO]]:%' THEN 'Sent a voice note'
    WHEN NEW.body IS NULL OR length(NEW.body) = 0 THEN 'Sent an attachment'
    WHEN length(NEW.body) > 80 THEN substr(NEW.body, 1, 80) || '...'
    ELSE NEW.body
  END;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_recipient, 'message', 'New message from ' || v_sender_name, v_body_preview, v_link);

  RETURN NEW;
END;
$$;
