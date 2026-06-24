import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { D as Clock, ae as FileText, ak as Banknote, N as CircleCheck, r as Store, aa as ClipboardList, ab as Bike, v as Users, i as TrendingUp } from "../_libs/lucide-react.mjs";
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
import "./router-LlhGIoeI.mjs";
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
function AdminDashboard() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-dashboard"],
    enabled: role === "admin",
    queryFn: async () => {
      const [vendors, orders, riders, documents, payouts] = await Promise.all([supabase.from("vendors").select("id,status"), supabase.from("orders").select("id,status,total,currency,created_at"), supabase.from("user_roles").select("user_id").eq("role", "rider"), supabase.from("vendor_documents").select("id,status").eq("status", "pending"), supabase.from("payouts").select("id,status").eq("status", "requested")]);
      const v = vendors.data ?? [];
      const o = orders.data ?? [];
      return {
        vendorsTotal: v.length,
        vendorsPending: v.filter((x) => x.status === "pending").length,
        vendorsApproved: v.filter((x) => x.status === "approved").length,
        ordersTotal: o.length,
        ordersToday: o.filter((x) => {
          const d = new Date(x.created_at);
          const t = /* @__PURE__ */ new Date();
          return d.toDateString() === t.toDateString();
        }).length,
        riders: (riders.data ?? []).length,
        pendingDocuments: (documents.data ?? []).length,
        pendingPayouts: (payouts.data ?? []).length
      };
    }
  });
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold mb-2", children: "Admin" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Platform overview and approvals." }),
    isLoading || !data ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Pending restaurants & chefs", value: data.vendorsPending, Icon: Clock, highlight: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Pending documents", value: data.pendingDocuments, Icon: FileText, highlight: data.pendingDocuments > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Pending payouts", value: data.pendingPayouts, Icon: Banknote, highlight: data.pendingPayouts > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Approved restaurants & chefs", value: data.vendorsApproved, Icon: CircleCheck }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Total restaurants & chefs", value: data.vendorsTotal, Icon: Store }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Orders today", value: data.ordersToday, Icon: ClipboardList }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Orders total", value: data.ordersTotal, Icon: ClipboardList }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Riders", value: data.riders, Icon: Bike })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/vendors", title: "Approve restaurants & chefs", desc: "Review applications and verify documents.", Icon: Store }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/orders", title: "All orders", desc: "Monitor every order across the platform.", Icon: ClipboardList }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/riders", title: "Riders", desc: "See active riders and deliveries.", Icon: Users }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/reports", title: "Sales & performance", desc: "Revenue trends, order status, top vendors.", Icon: TrendingUp }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/customers", title: "Customer insights", desc: "Repeat rate, new customers, top spenders.", Icon: Users }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LinkCard, { to: "/admin/payouts", title: "Payouts", desc: "Review and settle vendor & rider payout requests.", Icon: Banknote })
      ] })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  Icon,
  highlight
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border p-5 ${highlight ? "border-[var(--brand-clay)] bg-[var(--brand-cream)]/40" : "border-border bg-card"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-3xl font-semibold", children: value })
  ] });
}
function LinkCard({
  to,
  title,
  desc,
  Icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "rounded-2xl border border-border bg-card p-5 hover:border-[var(--brand-clay)] transition", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-[var(--brand-clay)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-semibold", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: desc })
  ] });
}
export {
  AdminDashboard as component
};
