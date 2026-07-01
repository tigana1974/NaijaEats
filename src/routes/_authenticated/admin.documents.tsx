import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  uberBtn,
} from "@/components/admin/AdminUI";
import { FileCheck2, FileText, ShieldCheck, AlertTriangle, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments,
});

function AdminDocuments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const [vendorDocsRes, riderDocsRes] = await Promise.all([
        supabase.from("vendor_documents").select("*, vendors(name)"),
        supabase.from("rider_documents").select("*, profiles(full_name, email)"),
      ]);
      
      const vDocs = (vendorDocsRes.data ?? []).map(d => ({
        ...d,
        user_type: "vendor",
        user_name: (d.vendors as any)?.name || "Unknown Vendor",
      }));
      
      const rDocs = (riderDocsRes.data ?? []).map(d => ({
        ...d,
        user_type: "rider",
        user_name: (d.profiles as any)?.full_name || (d.profiles as any)?.email || "Unknown Rider",
      }));

      return [...vDocs, ...rDocs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, type, status }: { id: string, type: "vendor" | "rider", status: string }) => {
      const table = type === "vendor" ? "vendor_documents" : "rider_documents";
      const { error } = await supabase.from(table).update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document updated");
      queryClient.invalidateQueries({ queryKey: ["admin-documents-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update document");
    }
  });

  const list = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((d) =>
      [d.user_name, d.doc_type, d.file_name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [list, search]);

  const kpis = useMemo(() => {
    return {
      total: list.length,
      verified: list.filter(d => d.status === "approved").length,
      pending: list.filter(d => d.status === "pending").length,
      rejected: list.filter(d => d.status === "rejected").length,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Compliance"
          title="Documents"
          description="Verify vendor and rider documents (IDs, licenses, registrations)."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total Documents" value={isLoading ? "…" : kpis.total} Icon={FileText} />
          <UberKpi label="Verified" value={isLoading ? "…" : kpis.verified} Icon={FileCheck2} accent="green" />
          <UberKpi label="Awaiting Review" value={isLoading ? "…" : kpis.pending} Icon={ShieldCheck} accent="orange" />
          <UberKpi label="Rejected" value={isLoading ? "…" : kpis.rejected} Icon={AlertTriangle} accent="red" />
        </div>

        <div className="mt-8">
          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Type" }, { label: "Status" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>User</UberTh>
                <UberTh>Document Type</UberTh>
                <UberTh>File Name</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Uploaded</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading documents…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No documents found.</UberTd>
                </UberTr>
              ) : (
                filtered.map((d) => (
                  <UberTr key={d.id}>
                    <UberTd>
                      <div className="flex items-center gap-2.5">
                        <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium ${d.user_type === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {d.user_type === 'vendor' ? 'V' : 'R'}
                        </div>
                        <div>
                          <div className="font-medium text-[oklch(0.18_0.006_260)]">{d.user_name}</div>
                          <div className="font-mono text-[11px] text-neutral-500 capitalize">{d.user_type}</div>
                        </div>
                      </div>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <span className="capitalize">{d.doc_type.replace(/_/g, ' ')}</span>
                    </UberTd>
                    <UberTd className="text-neutral-600">
                      <div className="truncate max-w-[200px]" title={d.file_name}>{d.file_name}</div>
                    </UberTd>
                    <UberTd>
                      <UberStatus status={d.status} />
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-2">
                        <a 
                          href={supabase.storage.from(d.user_type === 'vendor' ? 'vendor_documents' : 'rider_documents').getPublicUrl(d.file_path).data.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 hover:bg-neutral-100 text-neutral-600"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {d.status === "pending" && (
                          <>
                            <button 
                              onClick={() => updateStatus.mutate({ id: d.id, type: d.user_type as "vendor" | "rider", status: "approved" })}
                              className="rounded p-1.5 hover:bg-green-50 text-green-600 transition"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => updateStatus.mutate({ id: d.id, type: d.user_type as "vendor" | "rider", status: "rejected" })}
                              className="rounded p-1.5 hover:bg-red-50 text-red-600 transition"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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
