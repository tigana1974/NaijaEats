import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { c as Route$z } from "./router-LlhGIoeI.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { L as ShoppingBag, f as ChevronRight } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/react-icons.mjs";
import "./Logo-Du-Zai3C.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
const statusTone = {
  pending: "bg-amber-50 text-amber-900",
  accepted: "bg-amber-50 text-amber-900",
  preparing: "bg-amber-50 text-amber-900",
  ready: "bg-amber-50 text-amber-900",
  picked_up: "bg-blue-50 text-blue-900",
  delivered: "bg-emerald-50 text-emerald-900",
  cancelled: "bg-zinc-100 text-zinc-600"
};
const paymentTone = {
  unpaid: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
  refunded: "bg-zinc-100 text-zinc-600",
  failed: "bg-red-50 text-red-700"
};
const fmt = (n, currency = "NGN") => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency,
  maximumFractionDigits: 0
}).format(n);
function OrdersPage() {
  const {
    user
  } = Route$z.useRouteContext();
  const {
    data: orders,
    isLoading
  } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("orders").select("id, status, payment_status, total, currency, created_at, vendor:vendors(name, logo_url)").eq("customer_id", user.id).order("created_at", {
        ascending: false
      });
      return data ?? [];
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-lg font-bold", children: "My Orders" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Array.from({
    length: 3
  }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 rounded-3xl bg-zinc-100 animate-pulse" }, i)) }) : orders && orders.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: orders.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/orders/$orderId", params: {
    orderId: o.id
  }, className: "flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-zinc-100 hover:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] transition", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 shrink-0 overflow-hidden", children: o.vendor?.logo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: o.vendor.logo_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-5 w-5 text-zinc-500" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold truncate", children: o.vendor?.name ?? "Order" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-zinc-500 mt-0.5", children: [
        new Date(o.created_at).toLocaleString(),
        " · #",
        o.id.slice(0, 6).toUpperCase()
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone[o.status] ?? "bg-zinc-100 text-zinc-600"}`, children: o.status }),
        o.payment_status && o.payment_status !== "paid" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${paymentTone[o.payment_status] ?? "bg-zinc-100 text-zinc-600"}`, children: o.payment_status })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold tabular-nums", children: fmt(Number(o.total), o.currency) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-zinc-400" })
  ] }) }, o.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "mx-auto h-10 w-10 text-zinc-400" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl mt-3", children: "No orders yet" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-zinc-500 mt-1", children: "Discover vendors and place your first order." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "inline-block mt-4 rounded-full bg-[var(--brand-clay)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(255,77,77,0.6)] hover:opacity-95", children: "Browse vendors" })
  ] }) }) });
}
export {
  OrdersPage as component
};
