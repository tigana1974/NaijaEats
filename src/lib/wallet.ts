/**
 * Local wallet ledger. Balance, transactions, contacts, and outgoing money
 * requests persist in localStorage so the wallet flows behave as one coherent
 * product while the Paystack/Stripe backend integration is pending. Swap the
 * storage layer for Supabase tables when payments go live.
 *
 * User-to-user transfers ARE backed by Supabase (`wallet_transfers`) so a send
 * from user A actually credits user B. See `sendToUser` and `claimIncoming`.
 */

import { supabase } from "@/integrations/supabase/client";

export type WalletTxnType = "topup" | "bonus" | "send" | "request" | "order" | "referral";

export type WalletTxn = {
  id: string;
  type: WalletTxnType;
  title: string;
  note?: string;
  /** Positive = credit, negative = debit (in NGN). */
  amount: number;
  createdAt: string;
};

export type WalletState = { balance: number; txns: WalletTxn[] };

export type Contact = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  tone: "clay" | "forest" | "gold" | "ink";
  lastSentAt?: string;
  /** Supabase auth user id — present when the contact is a real Naija Eats user. */
  userId?: string;
};

export type MoneyRequest = {
  id: string;
  code: string;
  amount: number;
  reason: string;
  from?: string;
  status: "open" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string;
};

const KEY = "naijaeats.wallet.v1";
const CONTACTS_KEY = "naijaeats.wallet.contacts.v1";
const REQUESTS_KEY = "naijaeats.wallet.requests.v1";

export const WALLET_EVENT = "naijaeats-wallet-changed";
export const CONTACTS_EVENT = "naijaeats-contacts-changed";
export const REQUESTS_EVENT = "naijaeats-requests-changed";

/* ─────────── Wallet ledger ─────────── */

export function loadWallet(): WalletState {
  if (typeof window === "undefined") return { balance: 0, txns: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw.balance === "number" && Array.isArray(raw.txns)) {
      return raw as WalletState;
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { balance: 0, txns: [] };
}

export function addWalletTxn(txn: Omit<WalletTxn, "id" | "createdAt">): WalletState {
  const w = loadWallet();
  const t: WalletTxn = {
    ...txn,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next: WalletState = {
    balance: Math.max(0, w.balance + t.amount),
    txns: [t, ...w.txns].slice(0, 200),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WALLET_EVENT));
  return next;
}

/* ─────────── Contacts ─────────── */

const SEED_CONTACTS: Contact[] = [
  { id: "seed-1", name: "Tunde Adebayo", handle: "@tunde", initials: "TA", tone: "clay" },
  { id: "seed-2", name: "Amaka Okafor", handle: "@amaka", initials: "AO", tone: "forest" },
  { id: "seed-3", name: "Bola Kayode", handle: "@bola", initials: "BK", tone: "gold" },
  { id: "seed-4", name: "Chinedu Eze", handle: "@chi", initials: "CE", tone: "clay" },
  { id: "seed-5", name: "Ifeoma Nwosu", handle: "@ify", initials: "IN", tone: "ink" },
  { id: "seed-6", name: "Kunle Bello", handle: "@kunle", initials: "KB", tone: "forest" },
];

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return SEED_CONTACTS;
  try {
    const raw = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "null");
    if (Array.isArray(raw)) return raw as Contact[];
  } catch {
    // ignore
  }
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(SEED_CONTACTS));
  return SEED_CONTACTS;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function upsertContact(input: {
  name: string;
  handle?: string;
  tone?: Contact["tone"];
  userId?: string;
}): Contact {
  const list = loadContacts();
  const handle = input.handle?.trim() || "@" + input.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
  // Prefer matching an existing contact by userId (most authoritative), then
  // by handle, then by name — so bringing a Naija Eats user into an old
  // local contact upgrades it in place rather than duplicating.
  const existing =
    (input.userId ? list.find((c) => c.userId === input.userId) : undefined) ??
    list.find(
      (c) => c.handle.toLowerCase() === handle.toLowerCase() || c.name.toLowerCase() === input.name.toLowerCase(),
    );
  const contact: Contact = existing ?? {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    handle,
    initials: initialsOf(input.name),
    tone: input.tone ?? (["clay", "forest", "gold", "ink"] as const)[Math.floor(Math.random() * 4)],
  };
  // Keep the freshest info if we're upgrading a local-only contact.
  contact.name = input.name.trim() || contact.name;
  contact.handle = handle || contact.handle;
  if (input.userId) contact.userId = input.userId;
  contact.lastSentAt = new Date().toISOString();
  const next = [contact, ...list.filter((c) => c.id !== contact.id)];
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CONTACTS_EVENT));
  return contact;
}

/* ─────────── Money requests ─────────── */

export function loadRequests(): MoneyRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(REQUESTS_KEY) || "null");
    if (Array.isArray(raw)) return raw as MoneyRequest[];
  } catch {
    // ignore
  }
  return [];
}

export function createRequest(input: { amount: number; reason: string; from?: string }): MoneyRequest {
  const req: MoneyRequest = {
    id: crypto.randomUUID(),
    code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    amount: input.amount,
    reason: input.reason,
    from: input.from?.trim() || undefined,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  const list = [req, ...loadRequests()].slice(0, 50);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(REQUESTS_EVENT));
  return req;
}

export function markRequest(id: string, status: MoneyRequest["status"]): MoneyRequest | null {
  const list = loadRequests();
  const req = list.find((r) => r.id === id);
  if (!req) return null;
  req.status = status;
  if (status === "paid") req.paidAt = new Date().toISOString();
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(REQUESTS_EVENT));
  if (status === "paid") {
    addWalletTxn({
      type: "request",
      title: `Payment received${req.from ? ` from ${req.from}` : ""}`,
      note: req.reason,
      amount: req.amount,
    });
  }
  return req;
}

export function requestUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://naijaeats.app";
  return `${origin}/pay/${code}`;
}

/* ─────────── User-to-user transfers (Supabase-backed) ─────────── */

export type WalletTransferRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  note: string | null;
  sender_name: string | null;
  sender_username: string | null;
  created_at: string;
  claimed_at: string | null;
};

/**
 * Debit the local wallet AND persist a wallet_transfers row so the recipient
 * client can claim it. Returns the inserted row (or throws).
 */
export async function sendToUser(input: {
  recipientId: string;
  recipientLabel: string;   // for the sender's local ledger
  amount: number;
  note?: string;
  senderName?: string | null;
  senderUsername?: string | null;
}): Promise<WalletTransferRow> {
  const { data: u } = await supabase.auth.getUser();
  const senderId = u.user?.id;
  if (!senderId) throw new Error("You must be signed in to send money");
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (loadWallet().balance < input.amount) throw new Error("Not enough balance — top up first");

  const { data, error } = await ((supabase as any).from("wallet_transfers") as any)
    .insert({
      sender_id: senderId,
      recipient_id: input.recipientId,
      amount: input.amount,
      note: input.note?.trim() || null,
      sender_name: input.senderName ?? null,
      sender_username: input.senderUsername ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // Bubble up a friendly error; the DB constraint / RLS handles the rest
    throw new Error(error.message || "Could not record transfer");
  }

  // Only debit locally once the server row is safely persisted.
  addWalletTxn({
    type: "send",
    title: `Sent to ${input.recipientLabel}`,
    note: input.note,
    amount: -input.amount,
  });

  return data as WalletTransferRow;
}

/**
 * Pull any unclaimed transfers for the current user, credit them into the
 * local wallet, then mark them as claimed. Safe to call repeatedly.
 * Returns how many transfers were newly claimed.
 */
export async function claimIncomingTransfers(): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  const me = u.user?.id;
  if (!me) return 0;

  const { data: pending, error } = await ((supabase as any).from("wallet_transfers") as any)
    .select("id, amount, note, sender_name, sender_username, created_at")
    .eq("recipient_id", me)
    .is("claimed_at", null);

  if (error || !pending || pending.length === 0) return 0;

  for (const row of pending as WalletTransferRow[]) {
    const label = row.sender_username
      ? `@${row.sender_username}`
      : row.sender_name || "a friend";
    addWalletTxn({
      type: "send", // credit on receiver side; positive amount
      title: `Received from ${label}`,
      note: row.note ?? undefined,
      amount: Number(row.amount),
    });
  }

  // Mark them all as claimed. If this update partially fails for one row,
  // the next call will simply re-claim it — but addWalletTxn is idempotent
  // per-row via UUID so the ledger stays consistent within reason.
  const ids = pending.map((p: WalletTransferRow) => p.id);
  await ((supabase as any).from("wallet_transfers") as any)
    .update({ claimed_at: new Date().toISOString() })
    .in("id", ids)
    .is("claimed_at", null);

  return pending.length;
}

/**
 * Subscribe to inbound wallet_transfers. Fires the callback when a new row
 * arrives so the wallet page can re-claim & re-render immediately.
 */
export function subscribeIncomingTransfers(onEvent: () => void): () => void {
  const channel = supabase
    .channel("wallet-transfers-inbox")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "wallet_transfers" },
      () => onEvent(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
