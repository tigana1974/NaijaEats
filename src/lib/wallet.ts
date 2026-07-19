/**
 * Server-backed wallet. The balance and ledger live in Supabase
 * (`wallet_accounts` / `wallet_ledger`) and only move through SECURITY
 * DEFINER RPCs — the client can never fabricate money.
 *
 * Pages read a cached snapshot synchronously via `loadWallet()`; the cache
 * refreshes itself in the background and dispatches WALLET_EVENT when new
 * data lands, so existing listeners re-render automatically.
 */

import { supabase } from "@/integrations/supabase/client";

export type WalletTxnType =
  | "topup"
  | "bonus"
  | "send"
  | "receive"
  | "request"
  | "order"
  | "referral"
  | "premium";

export type WalletTxn = {
  id: string;
  type: WalletTxnType;
  title: string;
  note?: string;
  /** Positive = credit, negative = debit. */
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

export const WALLET_EVENT = "naijaeats-wallet-changed";
export const CONTACTS_EVENT = "naijaeats-contacts-changed";
export const REQUESTS_EVENT = "naijaeats-requests-changed";

function getCurrentUserId() {
  if (typeof window === "undefined") return "guest";
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith("-auth-token")) {
      try {
        const data = JSON.parse(localStorage.getItem(k) || "");
        if (data?.user?.id) return data.user.id;
      } catch {}
    }
  }
  return "guest";
}

/* ─────────── Wallet snapshot cache ─────────── */

let cache: WalletState = { balance: 0, txns: [] };
let lastFetch = 0;
let fetching = false;

function mapLedgerRow(r: any): WalletTxn {
  return {
    id: r.id,
    type: (r.type as WalletTxnType) ?? "order",
    title: r.title,
    note: r.note ?? undefined,
    amount: Number(r.amount),
    createdAt: r.created_at,
  };
}

/** Fetch the live balance + ledger and broadcast the change. */
export async function refreshWallet(): Promise<WalletState> {
  if (typeof window === "undefined") return cache;
  fetching = true;
  try {
    const [{ data: acct, error: acctErr }, { data: ledger }] = await Promise.all([
      (supabase as any).rpc("wallet_get"),
      (supabase as any)
        .from("wallet_ledger")
        .select("id, type, title, note, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (acctErr) throw acctErr;
    cache = {
      balance: Number(acct?.balance ?? 0),
      txns: (ledger ?? []).map(mapLedgerRow),
    };
    lastFetch = Date.now();
    window.dispatchEvent(new Event(WALLET_EVENT));
  } catch {
    // signed out, or migration not applied — keep the last snapshot
  } finally {
    fetching = false;
  }
  return cache;
}

/** Synchronous snapshot; kicks a background refresh when stale. */
export function loadWallet(): WalletState {
  if (typeof window !== "undefined" && !fetching && Date.now() - lastFetch > 5_000) {
    void refreshWallet();
  }
  return cache;
}

/* ─────────── Money movements (server RPCs) ─────────── */

/** Pay one of your own unpaid orders from the wallet. */
export async function walletPayOrder(orderId: string): Promise<void> {
  const { error } = await (supabase as any).rpc("wallet_pay_order", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  await refreshWallet();
}

/** Debit the wallet for a platform purchase (meal plan, chef booking, …). */
export async function walletCharge(amount: number, title: string, note?: string): Promise<void> {
  const { error } = await (supabase as any).rpc("wallet_charge", {
    p_amount: amount,
    p_title: title,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  await refreshWallet();
}

/** Send money to another Naija Eats user — atomic on the server. */
export async function sendToUser(input: {
  recipientId: string;
  recipientLabel: string;
  amount: number;
  note?: string;
  senderName?: string | null;
  senderUsername?: string | null;
}): Promise<void> {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  const { error } = await (supabase as any).rpc("wallet_send", {
    p_recipient: input.recipientId,
    p_amount: input.amount,
    p_note: input.note?.trim() || null,
  });
  if (error) throw new Error(error.message);
  await refreshWallet();
}

/* ─────────── Incoming money (compat layer) ─────────── */

const seenKey = () => `naijaeats.wallet.seenAt.v2.${getCurrentUserId()}`;

/**
 * Transfers now settle instantly on the server, so there is nothing to
 * "claim" — this refreshes the snapshot and reports how many inbound credits
 * arrived since the last check (so callers can toast about new money).
 */
export async function claimIncomingTransfers(): Promise<number> {
  const prev = Number(localStorage.getItem(seenKey()) ?? 0);
  const state = await refreshWallet();
  const inbound = state.txns.filter(
    (t) =>
      t.amount > 0 &&
      (t.type === "receive" || t.type === "request" || t.type === "referral") &&
      new Date(t.createdAt).getTime() > prev,
  );
  localStorage.setItem(seenKey(), String(Date.now()));
  return prev === 0 ? 0 : inbound.length;
}

/** Realtime: fire the callback whenever a new ledger row lands for anyone
 *  visible to this client (RLS limits that to the signed-in user). */
export function subscribeIncomingTransfers(onEvent: () => void): () => void {
  const channel = supabase
    .channel("wallet-ledger-inbox")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "wallet_ledger" },
      () => onEvent(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/* ─────────── Contacts (local address book) ─────────── */

const getContactsKey = () => `naijaeats.wallet.contacts.v2.${getCurrentUserId()}`;

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(getContactsKey()) || "null");
    if (Array.isArray(raw)) return raw as Contact[];
  } catch {
    // ignore
  }
  return [];
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
  contact.name = input.name.trim() || contact.name;
  contact.handle = handle || contact.handle;
  if (input.userId) contact.userId = input.userId;
  contact.lastSentAt = new Date().toISOString();
  const next = [contact, ...list.filter((c) => c.id !== contact.id)];
  localStorage.setItem(getContactsKey(), JSON.stringify(next));
  window.dispatchEvent(new Event(CONTACTS_EVENT));
  return contact;
}

/* ─────────── Money requests (server-backed) ─────────── */

let requestsCache: MoneyRequest[] = [];
let requestsLastFetch = 0;

function mapRequestRow(r: any): MoneyRequest {
  return {
    id: r.id,
    code: r.code,
    amount: Number(r.amount),
    reason: r.reason ?? "",
    from: r.from_label ?? undefined,
    // "settled" (marked received outside the app) renders as paid.
    status: r.status === "settled" ? "paid" : (r.status as MoneyRequest["status"]),
    createdAt: r.created_at,
    paidAt: r.paid_at ?? undefined,
  };
}

export async function refreshRequests(): Promise<MoneyRequest[]> {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return requestsCache;
    const { data, error } = await (supabase as any)
      .from("wallet_requests")
      .select("*")
      .eq("requester_id", u.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    requestsCache = (data ?? []).map(mapRequestRow);
    requestsLastFetch = Date.now();
    window.dispatchEvent(new Event(REQUESTS_EVENT));
  } catch {
    // signed out or table missing — keep snapshot
  }
  return requestsCache;
}

export function loadRequests(): MoneyRequest[] {
  if (typeof window !== "undefined" && Date.now() - requestsLastFetch > 5_000) {
    void refreshRequests();
  }
  return requestsCache;
}

export async function createRequest(input: { amount: number; reason: string; from?: string }): Promise<MoneyRequest> {
  const { data, error } = await (supabase as any).rpc("wallet_request_create", {
    p_amount: input.amount,
    p_reason: input.reason,
    p_from: input.from ?? null,
  });
  if (error) throw new Error(error.message);
  await refreshRequests();
  return mapRequestRow(data);
}

/**
 * Requester bookkeeping. "cancelled" closes the request; "paid" marks it as
 * settled outside the app — it does NOT credit the wallet (only a real payer
 * using the code moves money).
 */
export async function markRequest(id: string, status: MoneyRequest["status"]): Promise<MoneyRequest | null> {
  const serverStatus = status === "paid" ? "settled" : "cancelled";
  const { error } = await (supabase as any).rpc("wallet_request_mark", { p_id: id, p_status: serverStatus });
  if (error) throw new Error(error.message);
  const list = await refreshRequests();
  return list.find((r) => r.id === id) ?? null;
}

/** Look up someone's open request by code (to pay it). */
export async function lookupRequest(code: string): Promise<{
  id: string;
  code: string;
  amount: number;
  reason: string;
  status: string;
  requester_name: string;
}> {
  const { data, error } = await (supabase as any).rpc("wallet_request_lookup", { p_code: code });
  if (error) throw new Error(error.message);
  return data;
}

/** Pay someone's request by code — debits you, credits them, atomically. */
export async function payRequestByCode(code: string): Promise<void> {
  const { error } = await (supabase as any).rpc("wallet_request_pay", { p_code: code });
  if (error) throw new Error(error.message);
  await refreshWallet();
}

export function requestUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://naijaeats.app";
  return `${origin}/pay/${code}`;
}
