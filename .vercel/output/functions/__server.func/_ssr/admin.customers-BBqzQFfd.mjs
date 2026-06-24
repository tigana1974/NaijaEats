import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { v as Users, m as Repeat, av as UserPlus } from "../_libs/lucide-react.mjs";
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
function AdminCustomers() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-customers"],
    enabled: role === "admin",
    queryFn: async () => {
      const {
        data: orders,
        error
      } = await supabase.from("orders").select("customer_id,total,currency,status,created_at").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      const customerIds = Array.from(new Set((orders ?? []).map((o) => o.customer_id)));
      const {
        data: profiles
      } = customerIds.length ? await supabase.from("profiles").select("id,full_name,created_at").in("id", customerIds) : {
        data: []
      };
      const profileById = {};
      (profiles ?? []).forEach((p) => profileById[p.id] = p);
      return {
        orders: orders ?? [],
        profileById
      };
    }
  });
  const stats = reactExports.useMemo(() => {
    if (!data) return null;
    const {
      orders,
      profileById
    } = data;
    const byCustomer = {};
    orders.forEach((o) => {
      byCustomer[o.customer_id] ||= {
        orders: 0,
        spend: {},
        lastOrder: o.created_at,
        firstOrder: o.created_at
      };
      const c = byCustomer[o.customer_id];
      c.orders++;
      if (o.status !== "cancelled") {
        c.spend[o.currency] = (c.spend[o.currency] ?? 0) + Number(o.total || 0);
      }
      if (o.created_at > c.lastOrder) c.lastOrder = o.created_at;
      if (o.created_at < c.firstOrder) c.firstOrder = o.created_at;
    });
    const totalCustomers = Object.keys(byCustomer).length;
    const repeatCustomers = Object.values(byCustomer).filter((c) => c.orders > 1).length;
    const repeatRate = totalCustomers > 0 ? repeatCustomers / totalCustomers * 100 : 0;
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers30d = Object.values(byCustomer).filter((c) => new Date(c.firstOrder) >= thirtyDaysAgo).length;
    const topCustomers = Object.entries(byCustomer).map(([id, c]) => ({
      id,
      name: profileById[id]?.full_name ?? "Unnamed customer",
      ...c
    })).sort((a, b) => Object.values(b.spend).reduce((s, n) => s + n, 0) - Object.values(a.spend).reduce((s, n) => s + n, 0)).slice(0, 10);
    return {
      totalCustomers,
      repeatCustomers,
      repeatRate,
      newCustomers30d,
      topCustomers
    };
  }, [data]);
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold mb-2", children: "Customer insights" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Based on every order placed on the platform." }),
    isLoading || !stats ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : stats.totalCustomers === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground", children: "No customer orders yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            " Customers with orders"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-2xl font-display font-semibold", children: stats.totalCustomers })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat, { className: "h-4 w-4" }),
            " Repeat rate"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-2xl font-display font-semibold", children: [
            stats.repeatRate.toFixed(1),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
            stats.repeatCustomers,
            " customers, 2+ orders"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }),
            " New customers (30d)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-2xl font-display font-semibold", children: stats.newCustomers30d })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold p-5 pb-3", children: "Top customers by spend" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border", children: stats.topCustomers.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold", children: i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium truncate", children: c.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                c.orders,
                " orders · last on ",
                new Date(c.lastOrder).toLocaleDateString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-right shrink-0", children: Object.entries(c.spend).map(([cur, amt]) => `${cur} ${amt.toLocaleString(void 0, {
            maximumFractionDigits: 0
          })}`).join(" · ") || "—" })
        ] }, c.id)) })
      ] })
    ] })
  ] }) });
}
export {
  AdminCustomers as component
};
