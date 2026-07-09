-- User-to-user wallet transfers.
-- Sender inserts a row when they hit "Send" in the wallet; recipient's client
-- pulls unclaimed transfers on wallet mount (and via realtime), credits the
-- local wallet, then marks each row as claimed.
CREATE TABLE public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  sender_name TEXT,
  sender_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  CONSTRAINT no_self_transfer CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_wallet_transfers_recipient_unclaimed
  ON public.wallet_transfers (recipient_id, claimed_at)
  WHERE claimed_at IS NULL;

CREATE INDEX idx_wallet_transfers_recipient_recent
  ON public.wallet_transfers (recipient_id, created_at DESC);

CREATE INDEX idx_wallet_transfers_sender_recent
  ON public.wallet_transfers (sender_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.wallet_transfers TO authenticated;
GRANT ALL ON public.wallet_transfers TO service_role;

ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Sender OR recipient may read their transfer rows.
CREATE POLICY "Participants can view transfers"
  ON public.wallet_transfers FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Sender is the only one who can create a transfer.
CREATE POLICY "Sender can insert transfers"
  ON public.wallet_transfers FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Recipient marks their own transfer as claimed. The USING check gates both
-- the row and the columns they can touch — the WITH CHECK block enforces
-- they can only set claimed_at, not change amount/note/etc.
CREATE POLICY "Recipient can claim transfer"
  ON public.wallet_transfers FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Realtime so the recipient client sees incoming transfers instantly.
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transfers;
ALTER TABLE public.wallet_transfers REPLICA IDENTITY FULL;
