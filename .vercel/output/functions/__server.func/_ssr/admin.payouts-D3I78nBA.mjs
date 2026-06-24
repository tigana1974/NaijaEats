import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { al as CircleX, N as CircleCheck, ai as LoaderCircle, D as Clock, ak as Banknote } from "../_libs/lucide-react.mjs";
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
const statusMeta = {
  requested: {
    label: "Requested",
    cls: "bg-amber-100 text-amber-900",
    Icon: Clock
  },
  processing: {
    label: "Processing",
    cls: "bg-blue-100 text-blue-900",
    Icon: LoaderCircle
  },
  paid: {
    label: "Paid",
    cls: "bg-green-100 text-green-900",
    Icon: CircleCheck
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-900",
    Icon: CircleX
  }
};
function AdminPayouts() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const qc = useQueryClient();
  const [filter, setFilter] = reactExports.useState("requested");
  const {
    data: payouts,
    isLoading
  } = useQuery({
    queryKey: ["admin-payouts", filter],
    enabled: role === "admin",
    queryFn: async () => {
      let q = supabase.from("payouts").select("*").order("requested_at", {
        ascending: false
      });
      if (filter !== "all") q = q.eq("status", filter);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((p) => p.user_id)));
      const {
        data: profiles
      } = userIds.length ? await supabase.from("profiles").select("id,full_name,phone").in("id", userIds) : {
        data: []
      };
      const {
        data: roles
      } = userIds.length ? await supabase.from("user_roles").select("user_id,role").in("user_id", userIds) : {
        data: []
      };
      const profileById = {};
      (profiles ?? []).forEach((p) => profileById[p.id] = p);
      const roleById = {};
      (roles ?? []).forEach((r) => {
        if (r.role === "vendor" || r.role === "rider") roleById[r.user_id] = r.role;
      });
      return (data ?? []).map((p) => ({
        ...p,
        full_name: profileById[p.user_id]?.full_name ?? null,
        requester_role: roleById[p.user_id] ?? "unknown"
      }));
    }
  });
  const updatePayout = async (id, status, admin_note) => {
    const {
      data: userData
    } = await supabase.auth.getUser();
    const patch = {
      status,
      admin_note: admin_note ?? null
    };
    if (status === "paid" || status === "rejected") {
      patch.processed_at = (/* @__PURE__ */ new Date()).toISOString();
      patch.processed_by = userData.user?.id ?? null;
    }
    const {
      error
    } = await supabase.from("payouts").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payout ${status}`);
    qc.invalidateQueries({
      queryKey: ["admin-payouts"]
    });
  };
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  const filters = [{
    key: "requested",
    label: "Requested"
  }, {
    key: "processing",
    label: "Processing"
  }, {
    key: "paid",
    label: "Paid"
  }, {
    key: "rejected",
    label: "Rejected"
  }, {
    key: "all",
    label: "All"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold mb-2", children: "Payouts" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Review and settle vendor and rider payout requests." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-6 flex-wrap", children: filters.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f.key), className: `rounded-full px-4 py-1.5 text-sm border transition ${filter === f.key ? "bg-[var(--brand-clay)] text-[var(--brand-cream)] border-[var(--brand-clay)]" : "bg-card border-border hover:bg-muted"}`, children: f.label }, f.key)) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : !payouts || payouts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground", children: "No payout requests in this view." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: payouts.map((p) => {
      const meta = statusMeta[p.status] ?? statusMeta.requested;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-lg", children: [
              p.currency === "GBP" ? "£" : "₦",
              Number(p.amount).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.cls}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { className: "h-3 w-3" }),
              " ",
              meta.label
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs rounded-full px-2 py-0.5 bg-muted capitalize", children: p.requester_role })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
            p.full_name || "Unnamed user",
            " · ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: p.user_id })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Requested ",
            new Date(p.requested_at).toLocaleString(),
            p.payout_method ? ` · ${p.payout_method}` : ""
          ] }),
          p.admin_note && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Note: ",
            p.admin_note
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 shrink-0", children: [
          p.status === "requested" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updatePayout(p.id, "processing"), className: "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted", children: "Mark processing" }),
          (p.status === "requested" || p.status === "processing") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => updatePayout(p.id, "paid"), className: "flex items-center gap-1 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-3 py-1.5 text-xs font-medium hover:opacity-90", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-3.5 w-3.5" }),
              " Mark paid"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
              const reason = window.prompt("Reason for rejecting this payout?") ?? void 0;
              updatePayout(p.id, "rejected", reason);
            }, className: "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted", children: "Reject" })
          ] })
        ] })
      ] }) }, p.id);
    }) })
  ] }) });
}
export {
  AdminPayouts as component
};
