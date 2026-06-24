import process from "node:process";

// Server-only. Never import this from a route component or anything that
// ships to the client — these are payment-provider secret keys.
//
// Required env vars (set these on your hosting platform / Supabase project,
// never with a VITE_ prefix, which would ship them to the browser):
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase project settings → API. Lets the
//                                payment webhooks bypass RLS to write
//                                payments/orders. Currently unset in this
//                                project's .env; supabaseAdmin (client.server.ts)
//                                was previously defined but never used.
//   PAYSTACK_SECRET_KEY        — Paystack dashboard → Settings → API Keys.
//   STRIPE_SECRET_KEY          — Stripe dashboard → Developers → API keys.
//   STRIPE_WEBHOOK_SECRET      — Stripe dashboard → Developers → Webhooks →
//                                your endpoint → Signing secret.
//   APP_URL                    — e.g. https://app.naijaeats.com. Used to
//                                build Paystack/Stripe success/callback URLs.
export function getPaymentConfig() {
  return {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process.env.APP_URL ?? "http://localhost:3000",
  };
}
