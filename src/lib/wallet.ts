/**
 * Local wallet ledger. Balance and transactions persist in localStorage so
 * the wallet, top-up, and send flows behave as one coherent product while
 * the Paystack/Stripe backend integration is pending. Swap the storage layer
 * for Supabase tables when payments go live.
 */

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

const KEY = "naijaeats.wallet.v1";
export const WALLET_EVENT = "naijaeats-wallet-changed";

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
