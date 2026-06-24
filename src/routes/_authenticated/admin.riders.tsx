import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { Bike, UserX, FileText, ChevronDown, ChevronUp, Download, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/riders")({
  component: AdminRiders,
});

const docTypeLabels: Record<string, string> = {
  drivers_license: "Driver's license",
  vehicle_registration: "Vehicle registration",
  insurance: "Insurance",
  id_document: "Government ID",
  background_check: "Background check",
  other: "Other",
};

function AdminRiders() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-riders"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data: riderRoles } = await supabase
        .from("user_roles")
        .select("user_id,created_at")
        .eq("role", "rider");
      const ids = (riderRoles ?? []).map((r: any) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,full_name,phone").in("id", ids)
        : { data: [] as any[] };
      const profileById: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => (profileById[p.id] = p));
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("rider_id,status,fee,currency");
      const byRider: Record<string, { active: number; completed: number; earnings: Record<string, number> }> = {};
      (deliveries ?? []).forEach((d: any) => {
        if (!d.rider_id) return;
        byRider[d.rider_id] ||= { active: 0, completed: 0, earnings: {} };
        if (d.status === "delivered") {
          byRider[d.rider_id].completed++;
          byRider[d.rider_id].earnings[d.currency] = (byRider[d.rider_id].earnings[d.currency] || 0) + Number(d.fee || 0);
        } else if (["assigned", "picked_up"].includes(d.status)) {
          // Real delivery_status values: unassigned, assigned, picked_up, delivered, cancelled.
          byRider[d.rider_id].active++;
        }
      });
      return (riderRoles ?? []).map((r: any) => ({
        user_id: r.user_id,
        joined: r.created_at,
        full_name: profileById[r.user_id]?.full_name ?? null,
        phone: profileById[r.user_id]?.phone ?? null,
        stats: byRider[r.user_id] ?? { active: 0, completed: 0, earnings: {} },
      }));
    },
  });

  const { data: docCounts } = useQuery({
    queryKey: ["admin-rider-doc-counts"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("rider_documents").select("rider_id,status");
      if (error) throw error;
      const counts: Record<string, { pending: number; verified: number; rejected: number; total: number }> = {};
      (data ?? []).forEach((d: any) => {
        counts[d.rider_id] ||= { pending: 0, verified: 0, rejected: 0, total: 0 };
        counts[d.rider_id][d.status as "pending" | "verified" | "rejected"]++;
        counts[d.rider_id].total++;
      });
      return counts;
    },
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["admin-rider-documents", expanded],
    enabled: role === "admin" && !!expanded,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_documents")
        .select("*")
        .eq("rider_id", expanded as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewDocument = async (docId: string, status: "verified" | "rejected", rejection_reason?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("rider_documents")
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
    qc.invalidateQueries({ queryKey: ["admin-rider-documents"] });
    qc.invalidateQueries({ queryKey: ["admin-rider-doc-counts"] });
  };

  const openDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("rider-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deactivateRider = async (userId: string) => {
    if (!window.confirm("Remove rider access for this user? They will no longer be able to accept deliveries.")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "rider");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rider access removed");
    qc.invalidateQueries({ queryKey: ["admin-riders"] });
  };

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">Riders</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No riders yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {data.map((r) => (
              <div key={r.user_id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div
                className="p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:flex sm:items-center sm:gap-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <Bike className="h-5 w-5 text-[var(--brand-clay)]" />
                </div>
                <div className="min-w-0 sm:flex-1">
                  <div className="text-sm font-medium truncate">{r.full_name || "Unnamed rider"}</div>
                  <div className="font-mono text-xs text-muted-foreground truncate">{r.user_id}</div>
                  {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                  <div className="text-sm text-muted-foreground">
                    Joined {new Date(r.joined).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-2 border-t border-border pt-3 text-sm sm:col-span-1 sm:border-0 sm:pt-0 sm:text-right">
                  <div>
                    <span className="font-semibold">{r.stats.active}</span> active ·{" "}
                    <span className="font-semibold">{r.stats.completed}</span> done
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {Object.entries(r.stats.earnings)
                      .map(([c, v]) => `${c} ${(v as number).toFixed(2)}`)
                      .join(" · ") || "No earnings yet"}
                  </div>
                  <button
                    onClick={() => deactivateRider(r.user_id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                  >
                    <UserX className="h-3.5 w-3.5" /> Remove access
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}
                    className="mt-2 sm:ml-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Docs
                    {docCounts?.[r.user_id] && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 ${
                          docCounts[r.user_id].pending > 0 ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"
                        }`}
                      >
                        {docCounts[r.user_id].total}
                      </span>
                    )}
                    {expanded === r.user_id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {expanded === r.user_id && (
                <div className="border-t border-border bg-muted/30 px-1 pt-3 pb-3 -mx-1">
                  {docsLoading ? (
                    <p className="text-sm text-muted-foreground px-3">Loading documents…</p>
                  ) : !documents || documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-3">No documents uploaded yet.</p>
                  ) : (
                    <div className="grid gap-2 px-1">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{docTypeLabels[doc.doc_type] ?? doc.doc_type}</span>
                              <RiderDocStatusBadge status={doc.status} />
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

function RiderDocStatusBadge({ status }: { status: string }) {
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