import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { H as Wallet, O as Package, N as CircleCheck, ab as Bike, ad as PackageSearch, ae as FileText, a0 as MapPin } from "../_libs/lucide-react.mjs";
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
import "./router-Ck7azls6.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./avatar-DhUB8IKM.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./Logo-Du-Zai3C.mjs";
function RiderDashboard() {
  const qc = useQueryClient();
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const [online, setOnline] = reactExports.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("rider_online") === "true";
  });
  reactExports.useEffect(() => {
    localStorage.setItem("rider_online", String(online));
  }, [online]);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["rider-dashboard"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const [{
        data: active
      }, {
        data: today
      }, {
        data: completed
      }] = await Promise.all([supabase.from("deliveries").select("*, orders(*)").eq("rider_id", uid).in("status", ["assigned", "picked_up"]).order("created_at", {
        ascending: false
      }).limit(1), supabase.from("deliveries").select("fee, currency, delivered_at").eq("rider_id", uid).eq("status", "delivered").gte("delivered_at", startOfToday()), supabase.from("deliveries").select("id").eq("rider_id", uid).eq("status", "delivered")]);
      const earnings = (today ?? []).reduce((s, d) => s + Number(d.fee || 0), 0);
      const currency = (today ?? [])[0]?.currency ?? "NGN";
      return {
        active: (active ?? [])[0] ?? null,
        earningsToday: earnings,
        currency,
        deliveriesToday: today?.length ?? 0,
        totalDeliveries: completed?.length ?? 0
      };
    }
  });
  const advance = async (id, status) => {
    const patch = {
      status
    };
    if (status === "picked_up") patch.picked_up_at = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "delivered") patch.delivered_at = (/* @__PURE__ */ new Date()).toISOString();
    const {
      error
    } = await supabase.from("deliveries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    const orderStatus = status === "delivered" ? "delivered" : "picked_up";
    const {
      data: d
    } = await supabase.from("deliveries").select("order_id").eq("id", id).maybeSingle();
    if (d?.order_id) {
      const orderPatch = {
        status: orderStatus
      };
      if (status === "delivered") orderPatch.delivered_at = (/* @__PURE__ */ new Date()).toISOString();
      await supabase.from("orders").update(orderPatch).eq("id", d.order_id);
    }
    toast.success(status === "delivered" ? "Delivery complete" : "Picked up");
    qc.invalidateQueries({
      queryKey: ["rider-dashboard"]
    });
  };
  const symbol = data?.currency === "GBP" ? "£" : "₦";
  if (!roleLoading && role !== "rider") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: "Rider hub" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Pick up. Drop off. Get paid." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOnline((v) => !v), className: `rounded-full px-5 py-2.5 font-semibold inline-flex items-center gap-2 transition ${online ? "bg-green-600 text-white" : "bg-muted text-foreground"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${online ? "bg-white animate-pulse" : "bg-muted-foreground"}` }),
        online ? "Online" : "Offline"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Earnings today", value: `${symbol}${(data?.earningsToday ?? 0).toLocaleString()}`, Icon: Wallet }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Deliveries today", value: data?.deliveriesToday ?? 0, Icon: Package }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Total deliveries", value: data?.totalDeliveries ?? 0, Icon: CircleCheck })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: "Active delivery" }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Loading…" }) : !data?.active ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-2xl border border-border bg-card p-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-8 w-8 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "No active delivery." }),
        online ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/rider/available", className: "mt-4 inline-block rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold", children: "Find a job" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Go online to receive jobs." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ActiveCard, { delivery: data.active, symbol, onAdvance: advance })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/rider/available", className: "rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition flex gap-3 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PackageSearch, { className: "h-6 w-6 text-[var(--brand-clay)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Available jobs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Browse pickups nearby." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/rider/earnings", className: "rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition flex gap-3 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-6 w-6 text-[var(--brand-clay)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Earnings" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "View your payouts." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/rider/documents", className: "rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition flex gap-3 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-6 w-6 text-[var(--brand-clay)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Documents" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Upload for verification." })
        ] })
      ] })
    ] })
  ] }) });
}
function ActiveCard({
  delivery,
  symbol,
  onAdvance
}) {
  const phase = delivery.status === "assigned" ? "to_pickup" : "to_dropoff";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Order #",
          delivery.order_id.slice(0, 8)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-display text-xl font-semibold mt-1", children: [
          "Earn ",
          symbol,
          Number(delivery.fee).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs rounded-full px-2 py-0.5 bg-muted capitalize", children: delivery.status })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-4 space-y-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: `h-5 w-5 mt-0.5 ${phase === "to_pickup" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Pickup" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: delivery.pickup_address || "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: `h-5 w-5 mt-0.5 ${phase === "to_dropoff" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Drop-off" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: delivery.dropoff_address || delivery.orders?.delivery_address || "—" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex gap-2", children: [
      delivery.status === "assigned" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onAdvance(delivery.id, "picked_up"), className: "flex-1 rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2.5 font-semibold", children: "Confirm pickup" }),
      delivery.status === "picked_up" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onAdvance(delivery.id, "delivered"), className: "flex-1 rounded-lg bg-green-600 text-white py-2.5 font-semibold", children: "Mark delivered" })
    ] })
  ] });
}
function Stat({
  label,
  value,
  Icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-display text-xl font-semibold", children: value })
  ] });
}
function startOfToday() {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
export {
  RiderDashboard as component
};
