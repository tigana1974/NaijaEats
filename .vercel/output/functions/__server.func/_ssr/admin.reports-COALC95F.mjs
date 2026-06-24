import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { i as TrendingUp, r as Store } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, L as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Legend, b as Line, B as BarChart, c as Bar } from "../_libs/recharts.mjs";
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
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled"
};
const CHART_COLORS = ["#E86A2C", "#2A1810", "#5B7C4A", "#F4B942"];
function AdminReports() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-reports"],
    enabled: role === "admin",
    queryFn: async () => {
      const since = /* @__PURE__ */ new Date();
      since.setDate(since.getDate() - 30);
      const {
        data: orders,
        error
      } = await supabase.from("orders").select("id,status,total,currency,vendor_id,created_at,vendors(name)").gte("created_at", since.toISOString()).order("created_at", {
        ascending: true
      });
      if (error) throw error;
      return orders ?? [];
    }
  });
  const currencies = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    (data ?? []).forEach((o) => set.add(o.currency));
    return Array.from(set);
  }, [data]);
  const revenueByDay = reactExports.useMemo(() => {
    const byDay = {};
    (data ?? []).forEach((o) => {
      if (o.status === "cancelled") return;
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      byDay[day] ||= {};
      byDay[day][o.currency] = (byDay[day][o.currency] ?? 0) + Number(o.total || 0);
    });
    return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, byCurrency]) => ({
      day: new Date(day).toLocaleDateString(void 0, {
        month: "short",
        day: "numeric"
      }),
      ...byCurrency
    }));
  }, [data]);
  const statusBreakdown = reactExports.useMemo(() => {
    const counts = {};
    (data ?? []).forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: STATUS_LABEL[status] ?? status,
      count
    }));
  }, [data]);
  const topVendors = reactExports.useMemo(() => {
    const byVendor = {};
    (data ?? []).forEach((o) => {
      if (o.status === "cancelled") return;
      byVendor[o.vendor_id] ||= {
        name: o.vendors?.name ?? "Unknown vendor",
        revenue: {},
        orders: 0
      };
      byVendor[o.vendor_id].orders++;
      byVendor[o.vendor_id].revenue[o.currency] = (byVendor[o.vendor_id].revenue[o.currency] ?? 0) + Number(o.total || 0);
    });
    return Object.values(byVendor).sort((a, b) => Object.values(b.revenue).reduce((s, n) => s + n, 0) - Object.values(a.revenue).reduce((s, n) => s + n, 0)).slice(0, 8);
  }, [data]);
  const totals = reactExports.useMemo(() => {
    const revenue = {};
    let orderCount = 0;
    let cancelled = 0;
    (data ?? []).forEach((o) => {
      orderCount++;
      if (o.status === "cancelled") {
        cancelled++;
        return;
      }
      revenue[o.currency] = (revenue[o.currency] ?? 0) + Number(o.total || 0);
    });
    return {
      revenue,
      orderCount,
      cancelled
    };
  }, [data]);
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold mb-2", children: "Sales & performance" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Last 30 days across the platform." }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : !data || data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground", children: "No orders in the last 30 days." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8", children: [
        Object.entries(totals.revenue).map(([currency, amount]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
            " Revenue (",
            currency,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-2xl font-display font-semibold", children: [
            currency,
            " ",
            amount.toLocaleString(void 0, {
              maximumFractionDigits: 0
            })
          ] })
        ] }, currency)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-sm", children: "Orders (30d)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-2xl font-display font-semibold", children: totals.orderCount })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-sm", children: "Cancellation rate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-2xl font-display font-semibold", children: [
            totals.orderCount > 0 ? (totals.cancelled / totals.orderCount * 100).toFixed(1) : "0",
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold mb-4", children: "Revenue over time" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: revenueByDay, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "day", tick: {
              fontSize: 12
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
              fontSize: 12
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
            currencies.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: c, name: c, stroke: CHART_COLORS[i % CHART_COLORS.length], strokeWidth: 2, dot: false, connectNulls: true }, c))
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold mb-4", children: "Orders by status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: statusBreakdown, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "status", tick: {
              fontSize: 11
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: {
              fontSize: 12
            }, allowDecimals: false }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "count", fill: "var(--brand-clay)", radius: [6, 6, 0, 0] })
          ] }) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold p-5 pb-3", children: "Top vendors by revenue" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border", children: topVendors.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold", children: i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium truncate flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                " ",
                v.name
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                v.orders,
                " orders"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-right shrink-0", children: Object.entries(v.revenue).map(([c, amount]) => `${c} ${amount.toLocaleString(void 0, {
            maximumFractionDigits: 0
          })}`).join(" · ") })
        ] }, v.name + i)) })
      ] })
    ] })
  ] }) });
}
export {
  AdminReports as component
};
