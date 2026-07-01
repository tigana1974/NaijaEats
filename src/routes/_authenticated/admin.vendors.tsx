import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Store, FileText, ChevronDown, ChevronUp, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendors,
});

type Filter = "pending" | "approved" | "suspended" | "all";
type TypeFilter = "all" | "restaurant" | "chef" | "grocery";

const typeLabels: Record<string, string> = {
  restaurant: "Restaurant",
  chef: "Chef",
  grocery: "Grocery",
};

const docTypeLabels: Record<string, string> = {
  business_registration: "Business registration",
  id_document: "ID document",
  health_permit: "Health permit",
  food_safety_certificate: "Food safety certificate",
  other: "Other",
};

function AdminVendors() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-vendors", filter, typeFilter],
    enabled: role === "admin",
    queryFn: async () => {
      let q = supabase.from("vendors").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: docCounts } = useQuery({
    queryKey: ["admin-vendor-doc-counts"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_documents").select("vendor_id,status");
      if (error) throw error;
      const counts: Record<string, { pending: number; verified: number; rejected: number; total: number }> = {};
      (data ?? []).forEach((d: any) => {
        counts[d.vendor_id] ||= { pending: 0, verified: 0, rejected: 0, total: 0 };
        counts[d.vendor_id][d.status as "pending" | "verified" | "rejected"]++;
        counts[d.vendor_id].total++;
      });
      return counts;
    },
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["admin-vendor-documents", expanded],
    enabled: role === "admin" && !!expanded,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("vendor_id", expanded as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "approved" | "suspended" | "pending") => {
    const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Application ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const reviewDocument = async (
    docId: string,
    status: "verified" | "rejected",
    rejection_reason?: string,
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("vendor_documents")
      .update({
        status,
        rejection_reason: rejection_reason ?? null,
        reviewed_by: userData.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "verified" ? "Document verified" : "Document rejected");
    qc.invalidateQueries({ queryKey: ["admin-vendor-documents"] });
    qc.invalidateQueries({ queryKey: ["admin-vendor-doc-counts"] });
  };

  const openDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("vendor-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "suspended", label: "Suspended" },
    { key: "all", label: "All" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-semibold mb-2">Restaurant & chef approvals</h1>
        <p className="text-muted-foreground mb-6">Review and approve restaurant and chef applications.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm border transition ${
                filter === f.key
                  ? "bg-[var(--brand-clay)] text-[var(--brand-cream)] border-[var(--brand-clay)]"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "all", label: "All types" },
            { key: "restaurant", label: "Restaurants" },
            { key: "chef", label: "Chefs" },
            { key: "grocery", label: "Grocery" },
          ] as { key: TypeFilter; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`rounded-full px-3 py-1 text-xs border transition ${
                typeFilter === t.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !vendors || vendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No applications in this view.
          </div>
        ) : (
          <div className="grid gap-4">
            {vendors.map((v: any) => (
              <div key={v.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-32 sm:h-auto bg-muted shrink-0">
                  {v.cover_image_url ? (
                    <img src={v.cover_image_url} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Store className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{v.name}</h3>
                      <StatusBadge status={v.status} />
                      <span className="text-xs text-muted-foreground">{typeLabels[v.type] ?? v.type}</span>
                    </div>
                    {v.tagline && <p className="text-sm text-muted-foreground mt-0.5">{v.tagline}</p>}
                    <p className="text-sm text-muted-foreground mt-1">
                      {v.city}, {v.country} · {v.currency}
                    </p>
                    {v.description && <p className="text-sm mt-2 line-clamp-2">{v.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {v.status !== "approved" && (
                      <button
                        onClick={() => setStatus(v.id, "approved")}
                        className="flex items-center gap-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-medium hover:opacity-90"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {v.status !== "suspended" && (
                      <button
                        onClick={() => setStatus(v.id, "suspended")}
                        className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <FileText className="h-4 w-4" />
                      Docs
                      {docCounts?.[v.id] && (
                        <span
                          className={`ml-0.5 rounded-full px-1.5 text-xs ${
                            docCounts[v.id].pending > 0
                              ? "bg-amber-100 text-amber-900"
                              : "bg-green-100 text-green-900"
                          }`}
                        >
                          {docCounts[v.id].total}
                        </span>
                      )}
                      {expanded === v.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {expanded === v.id && (
                <div className="border-t border-border bg-muted/30 px-5 py-4">
                  {docsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading documents…</p>
                  ) : !documents || documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  ) : (
                    <div className="grid gap-2">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{docTypeLabels[doc.doc_type] ?? doc.doc_type}</span>
                              <DocStatusBadge status={doc.status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
                            {doc.status === "rejected" && doc.rejection_reason && (
                              <p className="text-xs text-red-700 mt-1">Reason: {doc.rejection_reason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openDocument(doc.file_path)}
                              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                            >
                              <Download className="h-3.5 w-3.5" /> View
                            </button>
                            {doc.status !== "verified" && (
                              <button
                                onClick={() => reviewDocument(doc.id, "verified")}
                                className="flex items-center gap-1 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-3 py-1.5 text-xs font-medium hover:opacity-90"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                              </button>
                            )}
                            {doc.status !== "rejected" && (
                              <button
                                onClick={() => {
                                  const reason = window.prompt("Reason for rejecting this document?") ?? undefined;
                                  reviewDocument(doc.id, "rejected", reason);
                                }}
                                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    approved: "bg-green-100 text-green-900",
    suspended: "bg-red-100 text-red-900",
  };
  const Icon = status === "approved" ? CheckCircle2 : status === "suspended" ? XCircle : Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    verified: "bg-green-100 text-green-900",
    rejected: "bg-red-100 text-red-900",
  };
  const Icon = status === "verified" ? CheckCircle2 : status === "rejected" ? XCircle : Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}
