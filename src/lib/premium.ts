/**
 * Client-side helpers for the customer premium subscription.
 * Plans persist to `profiles.customer_plan` when available, otherwise fall
 * back to a versioned localStorage flag so the UI stays responsive during
 * dev before that column is added to Supabase.
 *
 * Upsell dismissal + "seen" counter live in localStorage so we don't nag
 * users on every page load.
 */

export type CustomerPlan = "basic" | "plus" | "elite";
export type BillingRegion = "NG" | "UK";
export type BillingCadence = "monthly" | "yearly";

const PLAN_KEY = "naijaeats.customer.plan.v1";
const DISMISS_KEY = "naijaeats.customer.upsell.dismissed.v1";
const SEEN_KEY = "naijaeats.customer.upsell.seen.v1";
export const PLAN_EVENT = "naijaeats-customer-plan-changed";

export function loadCustomerPlan(): CustomerPlan {
  if (typeof window === "undefined") return "basic";
  const v = localStorage.getItem(PLAN_KEY);
  if (v === "plus" || v === "elite") return v;
  return "basic";
}

export function setCustomerPlan(plan: CustomerPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, plan);
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export function isUpsellDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return true;
  // Snooze for 7 days after "not now"
  return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
}

export function dismissUpsell() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function clearUpsellDismiss() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DISMISS_KEY);
  localStorage.removeItem(SEEN_KEY);
}

export function bumpUpsellSeen(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(localStorage.getItem(SEEN_KEY) ?? 0) + 1;
  localStorage.setItem(SEEN_KEY, String(n));
  return n;
}

export function detectRegion(): BillingRegion {
  if (typeof window === "undefined") return "NG";
  const stored = localStorage.getItem("naija-billing-region") as BillingRegion | null;
  if (stored === "NG" || stored === "UK") return stored;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return /London|Europe/i.test(tz) ? "UK" : "NG";
}
