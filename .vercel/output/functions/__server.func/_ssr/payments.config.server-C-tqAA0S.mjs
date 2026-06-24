import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import process$1 from "node:process";
function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...!SUPABASE_URL ? ["SUPABASE_URL"] : [],
      ...!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
let _supabaseAdmin;
const supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  }
});
function getPaymentConfig() {
  return {
    paystackSecretKey: process$1.env.PAYSTACK_SECRET_KEY,
    stripeSecretKey: process$1.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process$1.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process$1.env.APP_URL ?? "http://localhost:3000"
  };
}
export {
  getPaymentConfig as g,
  supabaseAdmin as s
};
