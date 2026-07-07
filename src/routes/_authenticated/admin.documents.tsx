import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTabs,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
} from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Check, X, FileText, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments,
});

type Tab = "pending" | "verified" | "rejected" | "all";
type Kind = "vendor" | "rider";

const DOC_LABEL: Record<string, string> = {
  business_registration: "Business registration",
  id_document: "ID document",
  health_permit: "Health permit",
  food_safety_certificate: "Food safety certificate",
  drivers_license: "Driver's licence",
  vehicle_registration: "Vehicle registration",
  insurance: "Insurance",
  background_check: "Background check",
  other: "Other",
};

function AdminDocuments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [kind, setKind] = useState<Kind | "both">("both");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const [vRes, rRes] = await Promise.all([
        supabase
          .from("vendor_documents")
          .select("id,doc_type,file_name,file_path,status,rejection_reason,created_at,vendor_id,vendors(name)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("rider_documents")
          .select("id,doc_type,file_name,file_path,status,rejection_reason,created_at,rider_id")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      const vendorDocs = ((vRes.data ?? []) as unknown as any[]).map((d) => ({
        ...d,
        kind: "vendor" as const,
        owner_name: d.vendors?.name ?? "Vendor",
      }));
      const riderRows = (rRes.data ?? []) as unknown as any[];
      const riderIds = Array.from(new Set(riderRows.map((d) => d.rider_id).filter(Boolean)));
      let names = new Map<string, string>();
      if (riderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", riderIds);
        names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || "Rider"]));
      }
      const riderDocs = riderRows.map((d) => ({
        ...d,
        kind: "rider" as const,
        owner_name: names.get(d.rider_id) ?? "Rider",
      }));
      return [...vendorDocs, ...riderDocs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
  });

  const list = data ?? [];

  const review = async (doc: any, status: "verified" | "rejected") => {
    let rejection_reason: string | null = null;
    if (status === "rejected") {
      rejection_reason = window.prompt("Reason for rejection (shown to the uploader):") || null;
      if (rejection_reason === null) return; // cancelled
    }
    const { data: u } = await supabase.auth.getUser();
    const table = doc.kind === "vendor" ? "vendor_documents" : "rider_documents";
    const { error } = await supabase
      .from(table)
      .update({
        status,
        rejection_reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: u.user?.id ?? null,
      })
      .eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success(status === "verified" ? "Document verified" : "Document rejected");
    qc.invalidateQueries({ queryKey: ["admin-documents-full"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
  };

  const openFile = async (doc: any) => {
    const bucket = doc.kind === "vendor" ? "vendor-documents" : "rider-documents";
    const { data: signed, error } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 300);
    if (error || !signed?.signedUrl) {
      // Fall back to a public URL in case the bucket is public
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(doc.file_path);
      if (pub?.publicUrl) return window.open(pub.publicUrl, "_blank");
      return toast.error("Could not open document");
    }
    window.open(signed.signedUrl, "_blank");
  };

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: list.length, pending: 0, verified: 0, rejected: 0 };
    for (const d of list) if (d.status in c) c[d.status as Tab]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((d: any) => {
      if (tab !== "all" && d.status !== tab) return false;
      if (kind !== "both" && d.kind !== kind) return false;
      if (search) {
        const hay = `${d.owner_name} ${d.file_name} ${DOC_LABEL[d.doc_type] ?? d.doc_type}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [list, tab, kind, search]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="System"
          title="Documents"
          description="Verify vendor business documents and rider licences before approving accounts."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Awaiting review" value={isLoading ? "…" : counts.pending.toLocaleString()} hint="Blockers for onboarding" />
          <UberKpi label="Verified" value={isLoading ? "…" : counts.verified.toLocaleString()} hint="Approved documents" />
          <UberKpi label="Rejected" value={isLoading ? "…" : counts.rejected.toLocaleString()} hint="Sent back to uploader" />
          <UberKpi label="Total documents" value={isLoading ? "…" : counts.all.toLocaleString()} hint="Vendors + riders" />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "verified", label: "Verified", count: counts.verified },
              { id: "rejected", label: "Rejected", count: counts.rejected },
              { id: "all", label: "All", count: counts.all },
            ]}
          />

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {(["both", "vendor", "rider"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  kind === k
                    ? "bg-[oklch(0.945_0.003_260)] font-medium text-[oklch(0.18_0.006_260)]"
                    : "bg-white border border-[oklch(0.92_0.003_260)] text-neutral-600 hover:bg-[oklch(0.965_0.003_260)]"
                }`}
              >
                {k === "both" ? "Vendors + riders" : k === "vendor" ? "Vendor docs" : "Rider docs"}
              </button>
            ))}
          </div>

          <UberFilterBar search={search} onSearch={setSearch} filters={[{ label: "Type" }]} onExport={() => {}} />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Document</UberTh>
                <UberTh>Owner</UberTh>
                <UberTh>Type</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Uploaded</UberTh>
                <UberTh>Actions</UberTh>
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading documents…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">
                    {tab === "pending" ? "Nothing awaiting review — you're all caught up." : "No documents match the current filter."}
                  </UberTd>
                </UberTr>
              ) : (
                filtered.map((d: any) => (
                  <UberTr key={`${d.kind}-${d.id}`}>
                    <UberTd>
                      <button
                        type="button"
                        onClick={() => openFile(d)}
                        className="group flex items-center gap-2 text-left"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[oklch(0.95_0.005_260)] text-neutral-600">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block max-w-[220px] truncate font-medium text-[oklch(0.18_0.006_260)] group-hover:underline">
                            {d.file_name}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            Open <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </span>
                      </button>
                    </UberTd>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{d.owner_name}</div>
                      <div className="text-[11px] capitalize text-neutral-500">{d.kind}</div>
                    </UberTd>
                    <UberTd className="text-neutral-700">{DOC_LABEL[d.doc_type] ?? d.doc_type}</UberTd>
                    <UberTd>
                      <UberStatus status={d.status} />
                      {d.status === "rejected" && d.rejection_reason && (
                        <div className="mt-1 max-w-[180px] truncate text-[11px] text-neutral-500">{d.rejection_reason}</div>
                      )}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {new Date(d.created_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                    </UberTd>
                    <UberTd>
                      {d.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => review(d, "verified")}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--naija-green)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--naija-green-dark)] hover:bg-[oklch(0.97_0.03_145)]"
                          >
                            <Check className="h-3 w-3" /> Verify
                          </button>
                          <button
                            type="button"
                            onClick={() => review(d, "rejected")}
                            className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.6_0.16_15)] bg-white px-2.5 py-1 text-[12px] font-medium text-[oklch(0.42_0.16_15)] hover:bg-[oklch(0.97_0.02_15)]"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                    </UberTd>
                  </UberTr>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>
    </AdminShell>
  );
}
