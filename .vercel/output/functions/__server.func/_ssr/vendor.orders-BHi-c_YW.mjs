import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
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
import "../_libs/lucide-react.mjs";
const STATUS_LABEL = {
  pending: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  picked_up: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};
function getNextActions(vendorType) {
  const isChef = vendorType === "home_chef" || vendorType === "personal_chef";
  const isGrocery = vendorType === "grocery";
  return {
    pending: {
      to: "accepted",
      label: "Accept"
    },
    accepted: {
      to: "preparing",
      label: isGrocery ? "Start packing" : isChef ? "Start cooking" : "Start preparing"
    },
    preparing: {
      to: "ready",
      label: isGrocery ? "Ready for pickup" : "Mark ready"
    }
  };
}
function VendorOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = reactExports.useState("open");
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return {
        vendor: null,
        orders: []
      };
      const {
        data: vendor
      } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      if (!vendor) return {
        vendor: null,
        orders: []
      };
      const {
        data: orders2
      } = await supabase.from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id).order("created_at", {
        ascending: false
      });
      return {
        vendor,
        orders: orders2 ?? []
      };
    }
  });
  const setStatus = async (id, status) => {
    const patch = {
      status
    };
    if (status === "accepted") patch.accepted_at = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "ready") patch.ready_at = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "delivered") patch.delivered_at = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "cancelled") patch.cancelled_at = (/* @__PURE__ */ new Date()).toISOString();
    const {
      error
    } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${STATUS_LABEL[status].toLowerCase()}`);
    qc.invalidateQueries({
      queryKey: ["vendor-orders"]
    });
    qc.invalidateQueries({
      queryKey: ["vendor-dashboard"]
    });
  };
  const orders = (data?.orders ?? []).filter((o) => filter === "open" ? !["delivered", "cancelled"].includes(o.status) : true);
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: "Orders" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Manage incoming orders." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex rounded-full bg-muted p-1", children: ["open", "all"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f), className: `px-4 py-1.5 text-sm font-medium rounded-full capitalize transition ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: f }, f)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }),
      !isLoading && !data?.vendor && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Create your shop first to receive orders." }),
      !isLoading && data?.vendor && orders.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground", children: [
        "No ",
        filter,
        " orders."
      ] }),
      orders.map((o) => {
        const symbol = o.currency === "GBP" ? "£" : "₦";
        const next = getNextActions(data?.vendor?.type)[o.status];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
                  "#",
                  o.id.slice(0, 8)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs rounded-full px-2 py-0.5 bg-muted", children: STATUS_LABEL[o.status] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-display text-xl font-semibold mt-1", children: [
                symbol,
                Number(o.total).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: new Date(o.created_at).toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              next && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setStatus(o.id, next.to), className: "rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold", children: next.label }),
              ["pending", "accepted"].includes(o.status) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setStatus(o.id, "cancelled"), className: "rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted", children: "Cancel" })
            ] })
          ] }),
          o.order_items?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 text-sm space-y-1 border-t border-border pt-3", children: o.order_items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              it.quantity,
              "× ",
              it.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              symbol,
              Number(it.subtotal).toLocaleString()
            ] })
          ] }, it.id)) }),
          o.customer_note && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-sm italic text-muted-foreground", children: [
            "Note: ",
            o.customer_note
          ] })
        ] }, o.id);
      })
    ] })
  ] }) });
}
export {
  VendorOrders as component
};
