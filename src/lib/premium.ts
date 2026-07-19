/**
 * Customer premium subscription. The plan lives in `profiles.customer_plan`
 * (with an expiry) and is purchased from the wallet via the
 * `purchase_premium` RPC — localStorage is only a cache so reads stay
 * synchronous.
 *
 * Upsell dismissal + "seen" counter live in localStorage so we don't nag
 * users on every page load.
 */

import { supabase } from "@/integrations/supabase/client";
import { refreshWallet } from "@/lib/wallet";

export type CustomerPlan = "basic" | "naija_one";
export type BillingRegion = "NG" | "UK";
export type BillingCadence = "monthly" | "yearly";

const PLAN_KEY = "naijaeats.customer.plan.v2";
const DISMISS_KEY = "naijaeats.customer.upsell.dismissed.v1";
const SEEN_KEY = "naijaeats.customer.upsell.seen.v1";
export const PLAN_EVENT = "naijaeats-customer-plan-changed";

let planLastFetch = 0;

/** Fetch the live plan from the profile and update the local cache. */
export async function refreshCustomerPlan(): Promise<CustomerPlan> {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return loadCachedPlan();
    const { data } = await (supabase as any)
      .from("profiles")
      .select("customer_plan, customer_plan_expires_at")
      .eq("id", u.user.id)
      .maybeSingle();
    const expired =
      data?.customer_plan_expires_at && new Date(data.customer_plan_expires_at).getTime() < Date.now();
    const plan: CustomerPlan = data?.customer_plan === "naija_one" && !expired ? "naija_one" : "basic";
    planLastFetch = Date.now();
    if (typeof window !== "undefined") {
      const prev = localStorage.getItem(PLAN_KEY);
      localStorage.setItem(PLAN_KEY, plan);
      if (prev !== plan) window.dispatchEvent(new Event(PLAN_EVENT));
    }
    return plan;
  } catch {
    return loadCachedPlan();
  }
}

function loadCachedPlan(): CustomerPlan {
  if (typeof window === "undefined") return "basic";
  const v = localStorage.getItem(PLAN_KEY);
  return v === "naija_one" ? "naija_one" : "basic";
}

/** Synchronous cached read; refreshes from the server in the background. */
export function loadCustomerPlan(): CustomerPlan {
  if (typeof window !== "undefined" && Date.now() - planLastFetch > 30_000) {
    void refreshCustomerPlan();
  }
  return loadCachedPlan();
}

/** Buy (or extend) Naija One from the wallet. Price is fixed server-side. */
export async function purchasePremium(cadence: BillingCadence, region: BillingRegion): Promise<void> {
  const { error } = await (supabase as any).rpc("purchase_premium", {
    p_cadence: cadence,
    p_region: region,
  });
  if (error) throw new Error(error.message);
  await Promise.all([refreshCustomerPlan(), refreshWallet()]);
}

/** Downgrade to Basic (no refunds — the plan simply stops renewing). */
export async function cancelPremium(): Promise<void> {
  const { error } = await (supabase as any).rpc("cancel_premium");
  if (error) throw new Error(error.message);
  await refreshCustomerPlan();
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
