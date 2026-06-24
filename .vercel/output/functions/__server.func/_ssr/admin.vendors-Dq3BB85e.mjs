import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { r as Store, N as CircleCheck, al as CircleX, ae as FileText, am as ChevronUp, V as ChevronDown, at as Download, D as Clock } from "../_libs/lucide-react.mjs";
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
const typeLabels = {
  restaurant: "Restaurant",
  home_chef: "Home chef",
  personal_chef: "Personal chef",
  grocery: "Grocery"
};
const docTypeLabels = {
  business_registration: "Business registration",
  id_document: "ID document",
  health_permit: "Health permit",
  food_safety_certificate: "Food safety certificate",
  other: "Other"
};
function AdminVendors() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const qc = useQueryClient();
  const [filter, setFilter] = reactExports.useState("pending");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [expanded, setExpanded] = reactExports.useState(null);
  const {
    data: vendors,
    isLoading
  } = useQuery({
    queryKey: ["admin-vendors", filter, typeFilter],
    enabled: role === "admin",
    queryFn: async () => {
      let q = supabase.from("vendors").select("*").order("created_at", {
        ascending: false
      });
      if (filter !== "all") q = q.eq("status", filter);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: docCounts
  } = useQuery({
    queryKey: ["admin-vendor-doc-counts"],
    enabled: role === "admin",
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("vendor_documents").select("vendor_id,status");
      if (error) throw error;
      const counts = {};
      (data ?? []).forEach((d) => {
        counts[d.vendor_id] ||= {
          pending: 0,
          verified: 0,
          rejected: 0,
          total: 0
        };
        counts[d.vendor_id][d.status]++;
        counts[d.vendor_id].total++;
      });
      return counts;
    }
  });
  const {
    data: documents,
    isLoading: docsLoading
  } = useQuery({
    queryKey: ["admin-vendor-documents", expanded],
    enabled: role === "admin" && !!expanded,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("vendor_documents").select("*").eq("vendor_id", expanded).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const setStatus = async (id, status) => {
    const {
      error
    } = await supabase.from("vendors").update({
      status
    }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Application ${status}`);
    qc.invalidateQueries({
      queryKey: ["admin-vendors"]
    });
    qc.invalidateQueries({
      queryKey: ["admin-dashboard"]
    });
  };
  const reviewDocument = async (docId, status, rejection_reason) => {
    const {
      data: userData
    } = await supabase.auth.getUser();
    const {
      error
    } = await supabase.from("vendor_documents").update({
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
      queryKey: ["admin-vendor-documents"]
    });
    qc.invalidateQueries({
      queryKey: ["admin-vendor-doc-counts"]
    });
  };
  const openDocument = async (filePath) => {
    const {
      data,
      error
    } = await supabase.storage.from("vendor-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  if (!roleLoading && role !== "admin") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  const filters = [{
    key: "pending",
    label: "Pending"
  }, {
    key: "approved",
    label: "Approved"
  }, {
    key: "suspended",
    label: "Suspended"
  }, {
    key: "all",
    label: "All"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold mb-2", children: "Restaurant & chef approvals" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Review and approve restaurant and chef applications." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-6 flex-wrap", children: filters.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f.key), className: `rounded-full px-4 py-1.5 text-sm border transition ${filter === f.key ? "bg-[var(--brand-clay)] text-[var(--brand-cream)] border-[var(--brand-clay)]" : "bg-card border-border hover:bg-muted"}`, children: f.label }, f.key)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-6 flex-wrap", children: [{
      key: "all",
      label: "All types"
    }, {
      key: "restaurant",
      label: "Restaurants"
    }, {
      key: "home_chef",
      label: "Home chefs"
    }, {
      key: "personal_chef",
      label: "Personal chefs"
    }, {
      key: "grocery",
      label: "Grocery"
    }].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTypeFilter(t.key), className: `rounded-full px-3 py-1 text-xs border transition ${typeFilter === t.key ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"}`, children: t.label }, t.key)) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : !vendors || vendors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground", children: "No applications in this view." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: vendors.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:w-48 h-32 sm:h-auto bg-muted shrink-0", children: v.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: v.cover_image_url, alt: v.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-8 w-8" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg", children: v.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: v.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: typeLabels[v.type] ?? v.type })
            ] }),
            v.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: v.tagline }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
              v.city,
              ", ",
              v.country,
              " · ",
              v.currency
            ] }),
            v.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2 line-clamp-2", children: v.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 shrink-0", children: [
            v.status !== "approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setStatus(v.id, "approved"), className: "flex items-center gap-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-medium hover:opacity-90", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
              " Approve"
            ] }),
            v.status !== "suspended" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setStatus(v.id, "suspended"), className: "flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
              " Reject"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setExpanded(expanded === v.id ? null : v.id), className: "flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
              "Docs",
              docCounts?.[v.id] && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-0.5 rounded-full px-1.5 text-xs ${docCounts[v.id].pending > 0 ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`, children: docCounts[v.id].total }),
              expanded === v.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" })
            ] })
          ] })
        ] })
      ] }),
      expanded === v.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border bg-muted/30 px-5 py-4", children: docsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading documents…" }) : !documents || documents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No documents uploaded yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: documents.map((doc) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: docTypeLabels[doc.doc_type] ?? doc.doc_type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DocStatusBadge, { status: doc.status })
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
    ] }, v.id)) })
  ] }) });
}
function StatusBadge({
  status
}) {
  const map = {
    pending: "bg-amber-100 text-amber-900",
    approved: "bg-green-100 text-green-900",
    suspended: "bg-red-100 text-red-900"
  };
  const Icon = status === "approved" ? CircleCheck : status === "suspended" ? CircleX : Clock;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" }),
    " ",
    status
  ] });
}
function DocStatusBadge({
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
  AdminVendors as component
};
