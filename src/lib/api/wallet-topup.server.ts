import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Credit a confirmed wallet top-up. Called from the provider webhooks only —
 * the signature has already been verified by the caller.
 *
 * Returns true when the reference belonged to a wallet top-up (whether just
 * credited or already processed), false when it isn't a top-up (so the
 * webhook should fall through to order-payment handling).
 */
export async function creditWalletTopup(
  provider: "paystack" | "stripe",
  reference: string,
): Promise<boolean> {
  const { data: topup, error } = await (supabaseAdmin as any)
    .from("wallet_topups")
    .select("*")
    .eq("provider", provider)
    .eq("provider_reference", reference)
    .maybeSingle();
  if (error) {
    console.error(`[${provider} webhook] wallet_topups lookup failed`, error.message);
    return false;
  }
  if (!topup) return false;
  if (topup.status === "success") return true;

  // Claim the row first so a webhook retry can never double-credit.
  const { data: claimed, error: claimErr } = await (supabaseAdmin as any)
    .from("wallet_topups")
    .update({ status: "success", credited_at: new Date().toISOString() })
    .eq("id", topup.id)
    .eq("status", "pending")
    .select("id");
  if (claimErr) {
    console.error(`[${provider} webhook] failed to claim topup`, claimErr.message);
    return true;
  }
  if (!claimed || claimed.length === 0) return true; // another retry won the race

  const amount = Number(topup.amount);
  const providerLabel = provider === "paystack" ? "Paystack" : "Stripe";

  const { error: creditErr } = await (supabaseAdmin as any).rpc("wallet_move", {
    p_user: topup.user_id,
    p_amount: amount,
    p_type: "topup",
    p_title: "Wallet top-up",
    p_note: providerLabel,
  });
  if (creditErr) {
    console.error(`[${provider} webhook] CRITICAL: claimed topup ${topup.id} but credit failed`, creditErr.message);
    return true;
  }

  // Gold bonus: 10% extra on NGN top-ups of ₦20,000+.
  const bonus = topup.currency === "NGN" && amount >= 20000 ? Math.round(amount * 0.1) : 0;
  if (bonus > 0) {
    await (supabaseAdmin as any).rpc("wallet_move", {
      p_user: topup.user_id,
      p_amount: bonus,
      p_type: "bonus",
      p_title: "Gold bonus",
      p_note: "10% top-up bonus",
    });
  }

  await (supabaseAdmin as any).from("notifications").insert({
    user_id: topup.user_id,
    title: "Wallet topped up",
    message: bonus > 0 ? `Your top-up landed, plus a bonus for topping up big!` : `Your wallet top-up has landed.`,
    type: "wallet",
    link: "/wallet",
  });

  return true;
}
