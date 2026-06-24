import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaymentConfig } from "@/lib/payments.config.server";

// The only client-facing entry point into payments. Takes an order the
// caller already owns (enforced by RLS via context.supabase) and returns a
// checkout URL to redirect to. It never marks anything "paid" itself —
// that only happens in the provider webhooks (see routes/api/webhooks/*),
// which run with the service-role key and verify a provider signature.
export const initiatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, vendor_id, total, currency, payment_status, vendors(name)")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError) throw new Error(orderError.message);
    // RLS already restricts this to orders the caller owns; a null result
    // here means "not found or not yours" — don't distinguish the two.
    if (!order) throw new Error("Order not found");
    if (order.customer_id !== userId) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("This order has already been paid for");

    const config = getPaymentConfig();
    const vendorName = (order.vendors as { name?: string } | null)?.name ?? "your order";
    const email = typeof claims?.email === "string" ? claims.email : undefined;

    if (order.currency === "NGN") {
      if (!config.paystackSecretKey) {
        throw new Error("Paystack is not configured on this server (PAYSTACK_SECRET_KEY missing)");
      }
      if (!email) {
        throw new Error("Your account has no email on file — required to pay via Paystack");
      }

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(Number(order.total) * 100), // kobo
          currency: "NGN",
          callback_url: `${config.appUrl}/orders/${order.id}`,
          metadata: { order_id: order.id },
        }),
      });
      const json = (await res.json()) as {
        status: boolean;
        message?: string;
        data?: { authorization_url: string; reference: string };
      };
      if (!res.ok || !json.status || !json.data) {
        throw new Error(json.message ?? "Paystack could not initialize this transaction");
      }

      const { error: insertError } = await supabaseAdmin.from("payments").insert({
        order_id: order.id,
        provider: "paystack",
        provider_reference: json.data.reference,
        amount: Number(order.total),
        currency: "NGN",
        status: "pending",
      });
      if (insertError) throw new Error(insertError.message);

      return { checkoutUrl: json.data.authorization_url };
    }

    if (order.currency === "GBP") {
      if (!config.stripeSecretKey) {
        throw new Error("Stripe is not configured on this server (STRIPE_SECRET_KEY missing)");
      }

      const stripe = new Stripe(config.stripeSecretKey);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: { name: `Order from ${vendorName}` },
              unit_amount: Math.round(Number(order.total) * 100), // pence
            },
            quantity: 1,
          },
        ],
        success_url: `${config.appUrl}/orders/${order.id}?payment=success`,
        cancel_url: `${config.appUrl}/orders/${order.id}?payment=cancelled`,
        metadata: { order_id: order.id },
      });

      if (!session.url) throw new Error("Stripe did not return a checkout URL");

      const { error: insertError } = await supabaseAdmin.from("payments").insert({
        order_id: order.id,
        provider: "stripe",
        provider_reference: session.id,
        amount: Number(order.total),
        currency: "GBP",
        status: "pending",
      });
      if (insertError) throw new Error(insertError.message);

      return { checkoutUrl: session.url };
    }

    throw new Error(`No payment provider configured for currency ${order.currency}`);
  });
