import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { aa as ClipboardList, i as TrendingUp, b as Star, r as Store, y as UtensilsCrossed, ag as CalendarCheck, c as ShoppingBasket } from "../_libs/lucide-react.mjs";
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
function VendorDashboard() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const {
        data: vendor
      } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      if (!vendor) return {
        vendor: null
      };
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const {
        data: orders
      } = await supabase.from("orders").select("id,status,total,created_at").eq("vendor_id", vendor.id);
      const all = orders ?? [];
      const today = all.filter((o) => new Date(o.created_at) >= todayStart);
      const revenueToday = today.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total || 0), 0);
      const pending = all.filter((o) => ["pending", "accepted", "preparing"].includes(o.status)).length;
      return {
        vendor,
        ordersToday: today.length,
        revenueToday,
        pending,
        totalOrders: all.length
      };
    }
  });
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : !data?.vendor ? /* @__PURE__ */ jsxRuntimeExports.jsx(SetupCta, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: (() => {
    const cfg = vendorConfig(data.vendor.type);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground capitalize", children: cfg.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: data.vendor.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-1 capitalize", children: [
            "Status: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: data.vendor.status })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/profile", className: "rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold", children: cfg.editLabel })
      ] }),
      data.vendor.status !== "approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl border border-border bg-card p-4 text-sm", children: [
        "Your shop is ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "capitalize", children: data.vendor.status }),
        ". Customers won't see it on Discover until it's approved."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Orders today", value: data.ordersToday ?? 0, Icon: ClipboardList }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Revenue today", value: formatMoney(data.revenueToday ?? 0, data.vendor.currency), Icon: TrendingUp }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Open orders", value: data.pending ?? 0, Icon: ClipboardList }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Rating", value: `${Number(data.vendor.rating || 0).toFixed(1)} (${data.vendor.rating_count || 0})`, Icon: Star })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-2", children: cfg.quickLinks.map((ql) => /* @__PURE__ */ jsxRuntimeExports.jsx(QuickLink, { to: ql.to, Icon: ql.Icon, title: ql.title, desc: ql.desc }, ql.to)) })
    ] });
  })() }) }) });
}
function SetupCta() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-10 w-10 mx-auto text-[var(--brand-clay)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-semibold", children: "Set up your shop" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2 max-w-md mx-auto", children: "You haven't created your vendor profile yet. Add your shop details so customers can find you." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/profile", className: "inline-block mt-6 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-5 py-2.5 font-semibold", children: "Create my shop" })
  ] });
}
function Stat({
  label,
  value,
  Icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-display text-2xl font-semibold", children: value })
  ] });
}
function QuickLink({
  to,
  Icon,
  title,
  desc
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition flex gap-4 items-start", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-[var(--brand-cream)] flex items-center justify-center text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: desc })
    ] })
  ] });
}
function vendorConfig(type) {
  const isChef = type === "home_chef" || type === "personal_chef";
  const isGrocery = type === "grocery";
  if (isChef) return {
    title: "Chef dashboard",
    editLabel: "Edit kitchen",
    quickLinks: [{
      to: "/vendor/orders",
      Icon: ClipboardList,
      title: "Orders",
      desc: "Accept and manage orders."
    }, {
      to: "/vendor/menu",
      Icon: UtensilsCrossed,
      title: "Menu",
      desc: "Manage your dishes and prices."
    }, {
      to: "/vendor/profile",
      Icon: CalendarCheck,
      title: "Availability",
      desc: "Set dates you can cook."
    }, {
      to: "/vendor/earnings",
      Icon: TrendingUp,
      title: "Earnings",
      desc: "Revenue and payout requests."
    }]
  };
  if (isGrocery) return {
    title: "Store dashboard",
    editLabel: "Edit store",
    quickLinks: [{
      to: "/vendor/orders",
      Icon: ClipboardList,
      title: "Orders",
      desc: "Accept and manage orders."
    }, {
      to: "/vendor/menu",
      Icon: ShoppingBasket,
      title: "Products",
      desc: "Manage inventory and prices."
    }, {
      to: "/vendor/earnings",
      Icon: TrendingUp,
      title: "Earnings",
      desc: "Revenue and payout requests."
    }, {
      to: "/vendor/profile",
      Icon: Store,
      title: "Store profile",
      desc: "Cover, delivery fee, details."
    }]
  };
  return {
    title: "Restaurant dashboard",
    editLabel: "Edit restaurant",
    quickLinks: [{
      to: "/vendor/orders",
      Icon: ClipboardList,
      title: "Orders queue",
      desc: "Accept, prepare, and mark ready."
    }, {
      to: "/vendor/menu",
      Icon: UtensilsCrossed,
      title: "Menu",
      desc: "Add items, categories, prices."
    }, {
      to: "/vendor/earnings",
      Icon: TrendingUp,
      title: "Earnings",
      desc: "Revenue and payout requests."
    }, {
      to: "/vendor/profile",
      Icon: Store,
      title: "Restaurant profile",
      desc: "Cover, delivery fee, prep time."
    }]
  };
}
function formatMoney(n, currency) {
  const symbol = currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(n).toLocaleString()}`;
}
export {
  VendorDashboard as component
};
