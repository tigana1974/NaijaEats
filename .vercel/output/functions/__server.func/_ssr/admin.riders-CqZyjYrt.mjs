import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { ab as Bike, au as UserX, ae as FileText, am as ChevronUp, V as ChevronDown, at as Download, N as CircleCheck, al as CircleX, D as Clock } from "../_libs/lucide-react.mjs";
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
const docTypeLabels = {
  drivers_license: "Driver's license",
  vehicle_registration: "Vehicle registration",
  insurance: "Insurance",
  id_document: "Government ID",
  background_check: "Background check",
  other: "Other"
};
function AdminRiders() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const qc = useQueryClient();
  const [expanded, setExpanded] = reactExports.useState(null);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-riders"],
    enabled: role === "admin",
    queryFn: async () => {
      const {
        data: riderRoles
      } = await supabase.from("user_roles").select("user_id,created_at").eq("role", "rider");
      const ids = (riderRoles ?? []).map((r) => r.user_id);
      const {
        data: profiles
      } = ids.length ? await supabase.from("profiles").select("id,full_name,phone").in("id", ids) : {
        data: []
      };
      const profileById = {};
      (profiles ?? []).forEach((p) => profileById[p.id] = p);
      const {
        data: deliveries
      } = await supabase.from("deliveries").select("rider_id,status,fee,currency");
      const byRider = {};
      (deliveries ?? []).forEach((d) => {
        if (!d.rider_id) return;
        byRider[d.rider_id] ||= {
          active: 0,
          completed: 0,
          earnings: {}
        };
        if (d.status === "delivered") {
          byRider[d.rider_id].completed++;
          byRider[d.rider_id].earnings[d.currency] = (byRider[d.rider_id].earnings[d.currency] || 0) + Number(d.fee || 0);
        } else if (["assigned", "picked_up"].includes(d.status)) {
          byRider[d.rider_id].active++;
        }
      });
      return (riderRoles ?? []).map((r) => ({
        user_id: r.user_id,
        joined: r.created_at,
        full_name: profileById[r.user_id]?.full_name ?? null,
        phone: profileById[r.user_id]?.phone ?? null,
        stats: byRider[r.user_id] ?? {
          active: 0,
          completed: 0,
          earnings: {}
        }
      }));
    }
  });
  const {
    data: docCounts
  } = useQuery({
    queryKey: ["admin-rider-doc-counts"],
    enabled: role === "admin",
    queryFn: async () => {
      const {
        data: data2,
        error
      } = await supabase.from("rider_documents").select("rider_id,status");
      if (error) throw error;
      const counts = {};
      (data2 ?? []).forEach((d) => {
        counts[d.rider_id] ||= {
          pending: 0,
          verified: 0,
          rejected: 0,
          total: 0
        };
        counts[d.rider_id][d.status]++;
        counts[d.rider_id].total++;
      });
      return counts;
    }
  });
  const {
    data: documents,
    isLoading: docsLoading
  } = useQuery({
    queryKey: ["admin-rider-documents", expanded],
    enabled: role === "admin" && !!expanded,
    queryFn: async () => {
      const {
        data: data2,
        error
      } = await supabase.from("rider_documents").select("*").eq("rider_id", expanded).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data2 ?? [];
    }
  });
  const reviewDocument = async (docId, status, rejection_reason) => {
    const {
      data: userData
    } = await supabase.auth.getUser();
    const {
      error
    } = await supabase.from("rider_documents").update({
      status,
      rejection_reason: rejection_reason ?? null,
      reviewed_by: userData.user?.id ?? null,
      reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "verified" ? "Document verified" : "Document rejected");
    qc.invalidateQueries({
      queryKey: ["admin-rider-documents"]
    });
    qc.invalidateQueries({
      queryKey: ["admin-rider-doc-counts"]
    });
  };
  const openDocument = async (filePath) => {
    const {
      data: data2,
      error
    } = await supabase.storage.from("rider-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data2?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data2.signedUrl, "_blank", "noopener,noreferrer");
  };
  const deactivateRider = async (userId) => {
    if (!window.confirm("Remove rider access for this user? They will no longer be able to accept deliveries.")) return;
    const {
      error
    } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "rider");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rider access removed");
    qc.invalidateQueries({
      queryKey: ["admin-riders"]
    });
  };
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6", children: "Riders" }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : !data || data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground", children: "No riders yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:flex sm:items-center sm:gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-5 w-5 text-[var(--brand-clay)]" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 sm:flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: r.full_name || "Unnamed rider" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs text-muted-foreground truncate", children: r.user_id }),
          r.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: r.phone }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
            "Joined ",
            new Date(r.joined).toLocaleDateString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 border-t border-border pt-3 text-sm sm:col-span-1 sm:border-0 sm:pt-0 sm:text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: r.stats.active }),
            " active ·",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: r.stats.completed }),
            " done"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: Object.entries(r.stats.earnings).map(([c, v]) => `${c} ${v.toFixed(2)}`).join(" · ") || "No earnings yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => deactivateRider(r.user_id), className: "mt-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { className: "h-3.5 w-3.5" }),
            " Remove access"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setExpanded(expanded === r.user_id ? null : r.user_id), className: "mt-2 sm:ml-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }),
            "Docs",
            docCounts?.[r.user_id] && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-0.5 rounded-full px-1.5 ${docCounts[r.user_id].pending > 0 ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`, children: docCounts[r.user_id].total }),
            expanded === r.user_id ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" })
          ] })
        ] })
      ] }),
      expanded === r.user_id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border bg-muted/30 px-1 pt-3 pb-3 -mx-1", children: docsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground px-3", children: "Loading documents…" }) : !documents || documents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground px-3", children: "No documents uploaded yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 px-1", children: documents.map((doc) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: docTypeLabels[doc.doc_type] ?? doc.doc_type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(RiderDocStatusBadge, { status: doc.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5 truncate", children: doc.file_name }),
          doc.status === "rejected" && doc.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-red-700 mt-1", children: [
            "Reason: ",
            doc.rejection_reason
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openDocument(doc.file_path), className: "flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
            " View"
          ] }),
          doc.status !== "verified" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => reviewDocument(doc.id, "verified"), className: "flex items-center gap-1 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-3 py-1.5 text-xs font-medium hover:opacity-90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
            " Verify"
          ] }),
          doc.status !== "rejected" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            const reason = window.prompt("Reason for rejecting this document?") ?? void 0;
            reviewDocument(doc.id, "rejected", reason);
          }, className: "flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }),
            " Reject"
          ] })
        ] })
      ] }, doc.id)) }) })
    ] }, r.user_id)) })
  ] }) });
}
function RiderDocStatusBadge({
  status
}) {
  const map = {
    pending: "bg-amber-100 text-amber-900",
    verified: "bg-green-100 text-green-900",
    rejected: "bg-red-100 text-red-900"
  };
  const Icon = status === "verified" ? CircleCheck : status === "rejected" ? CircleX : Clock;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" }),
    " ",
    status
  ] });
}
export {
  AdminRiders as component
};
