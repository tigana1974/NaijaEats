import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-D53ep1OT.mjs";
import { S as Stripe } from "../_libs/stripe.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-BJ6JTBN_.mjs";
import { g as getPaymentConfig, s as supabaseAdmin } from "./payments.config.server-C-tqAA0S.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "os";
import "events";
import "http";
import "https";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "node:process";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const initiatePayment_createServerFn_handler = createServerRpc({
  id: "f97d295818f3993990f59f82c6dcf65f6450fc19ef32de3d5b3781e7e51bf805",
  name: "initiatePayment",
  filename: "src/lib/api/payments.functions.ts"
}, (opts) => initiatePayment.__executeServer(opts));
const initiatePayment = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator(objectType({
  orderId: stringType().uuid()
})).handler(initiatePayment_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId,
    claims
  } = context;
  const {
    data: order,
    error: orderError
  } = await supabase.from("orders").select("id, customer_id, vendor_id, total, currency, payment_status, vendors(name)").eq("id", data.orderId).maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found");
  if (order.customer_id !== userId) throw new Error("Order not found");
  if (order.payment_status === "paid") throw new Error("This order has already been paid for");
  const config = getPaymentConfig();
  const vendorName = order.vendors?.name ?? "your order";
  const email = typeof claims?.email === "string" ? claims.email : void 0;
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(order.total) * 100),
        // kobo
        currency: "NGN",
        callback_url: `${config.appUrl}/orders/${order.id}`,
        metadata: {
          order_id: order.id
        }
      })
    });
    const json = await res.json();
    if (!res.ok || !json.status || !json.data) {
      throw new Error(json.message ?? "Paystack could not initialize this transaction");
    }
    const {
      error: insertError
    } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "paystack",
      provider_reference: json.data.reference,
      amount: Number(order.total),
      currency: "NGN",
      status: "pending"
    });
    if (insertError) throw new Error(insertError.message);
    return {
      checkoutUrl: json.data.authorization_url
    };
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
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Order from ${vendorName}`
          },
          unit_amount: Math.round(Number(order.total) * 100)
          // pence
        },
        quantity: 1
      }],
      success_url: `${config.appUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${config.appUrl}/orders/${order.id}?payment=cancelled`,
      metadata: {
        order_id: order.id
      }
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    const {
      error: insertError
    } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "stripe",
      provider_reference: session.id,
      amount: Number(order.total),
      currency: "GBP",
      status: "pending"
    });
    if (insertError) throw new Error(insertError.message);
    return {
      checkoutUrl: session.url
    };
  }
  throw new Error(`No payment provider configured for currency ${order.currency}`);
});
export {
  initiatePayment_createServerFn_handler
};
