import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaymentConfig } from "@/lib/payments.config.server";

// Stripe POSTs every Checkout/PaymentIntent event here. As with the
// Paystack webhook, this is the only place a payment is ever marked
// "success" — never the client-side success_url redirect, since that's
// just a browser navigation a user could hit manually without paying.
export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getPaymentConfig();
        if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
          console.error("[stripe webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured");
          return new Response("Not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const rawBody = await request.text();
        const stripe = new Stripe(config.stripeSecretKey);

        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
        } catch (err) {
          console.warn("[stripe webhook] signature verification failed", err instanceof Error ? err.message : err);
          return new Response("Invalid signature", { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.payment_status === "paid") {
            const { data: payment, error: findError } = await supabaseAdmin
              .from("payments")
              .select("id, order_id, status")
              .eq("provider", "stripe")
              .eq("provider_reference", session.id)
              .maybeSingle();

            if (findError) {
              console.error("[stripe webhook] lookup failed", findError.message);
              return new Response("Lookup failed", { status: 500 });
            }

            if (payment && payment.status !== "success") {
              const { error: payErr } = await supabaseAdmin
                .from("payments")
                .update({ status: "success", paid_at: new Date().toISOString() })
                .eq("id", payment.id);
              if (payErr) {
                console.error("[stripe webhook] failed to update payment", payErr.message);
                return new Response("Update failed", { status: 500 });
              }

              const { error: orderErr } = await supabaseAdmin
                .from("orders")
                .update({ payment_status: "paid" })
                .eq("id", payment.order_id);
              if (orderErr) {
                console.error("[stripe webhook] failed to update order", orderErr.message);
                return new Response("Update failed", { status: 500 });
              }
            } else if (!payment) {
              console.warn("[stripe webhook] unknown session", session.id);
            }
          }
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
