import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaymentConfig } from "@/lib/payments.config.server";

// Paystack POSTs every transaction event here. We only trust this endpoint
// to mark a payment "success" if the request carries a valid HMAC-SHA512
// signature computed with our secret key — never trust the client-side
// redirect/callback_url query params for that, those are spoofable.
export const Route = createFileRoute("/api/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getPaymentConfig();
        if (!config.paystackSecretKey) {
          console.error("[paystack webhook] PAYSTACK_SECRET_KEY is not configured");
          return new Response("Not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const expected = createHmac("sha512", config.paystackSecretKey).update(rawBody).digest("hex");
        const signatureValid =
          expected.length === signature.length &&
          timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
        if (!signatureValid) {
          console.warn("[paystack webhook] signature mismatch");
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { event?: string; data?: { reference?: string; status?: string } };
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (event.event === "charge.success" && event.data?.reference) {
          const reference = event.data.reference;

          const { data: payment, error: findError } = await supabaseAdmin
            .from("payments")
            .select("id, order_id, status")
            .eq("provider", "paystack")
            .eq("provider_reference", reference)
            .maybeSingle();

          if (findError) {
            console.error("[paystack webhook] lookup failed", findError.message);
            return new Response("Lookup failed", { status: 500 });
          }
          if (!payment) {
            // Reference we don't recognize — acknowledge so Paystack stops
            // retrying, but don't pretend we processed it.
            console.warn("[paystack webhook] unknown reference", reference);
            return new Response("OK", { status: 200 });
          }

          if (payment.status !== "success") {
            const { error: payErr } = await supabaseAdmin
              .from("payments")
              .update({ status: "success", paid_at: new Date().toISOString() })
              .eq("id", payment.id);
            if (payErr) {
              console.error("[paystack webhook] failed to update payment", payErr.message);
              return new Response("Update failed", { status: 500 });
            }

            const { error: orderErr } = await supabaseAdmin
              .from("orders")
              .update({ payment_status: "paid" })
              .eq("id", payment.order_id);
            if (orderErr) {
              console.error("[paystack webhook] failed to update order", orderErr.message);
              return new Response("Update failed", { status: 500 });
            }
          }
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
