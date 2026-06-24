import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rider/documents")({
  component: RiderDocuments,
});

const DOC_TYPES: { key: string; label: string; required: boolean }[] = [
  { key: "drivers_license", label: "Driver's license", required: true },
  { key: "id_document", label: "Government ID", required: true },
  { key: "vehicle_registration", label: "Vehicle registration", required: true },
  { key: "insurance", label: "Insurance", required: true },
  { key: "background_check", label: "Background check", required: false },
  { key: "other", label: "Other supporting document", required: false },
];

function RiderDocuments() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const qc = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["my-rider-documents"],
    enabled: role === "rider",
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("rider_documents")
        .select("*")
        .eq("rider_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleUpload = async (docType: string, file: File) => {
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast.error("Please upload a PDF or image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploadingDoc(docType);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${uid}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("rider-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("rider_documents").insert({
        rider_id: uid,
        doc_type: docType as any,
        file_path: path,
        file_name: file.name,
      });
      if (insErr) throw insErr;
      toast.success("Document uploaded — pending review");
      qc.invalidateQueries({ queryKey: ["my-rider-documents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  const viewDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("rider-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deleteDocument = async (docId: string) => {
    if (!window.confirm("Remove this document? You can upload a new one afterwards.")) return;
    const { error } = await supabase.from("rider_documents").delete().eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document removed");
    qc.invalidateQueries({ queryKey: ["my-rider-documents"] });
  };

  if (!roleLoading && role !== "rider") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Verification documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload these so an admin can verify you and unlock delivery jobs. PDF or image, up to 10MB each.
        </p>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 grid gap-3">
            {DOC_TYPES.map((dt) => {
              const docsForType = (documents ?? []).filter((d: any) => d.doc_type === dt.key);
              return (
                <div key={dt.key} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="font-medium text-sm">
                      {dt.label}
                      {dt.required && <span className="text-[var(--brand-clay)]"> *</span>}
                    </div>
                    <DocUploadButton uploading={uploadingDoc === dt.key} onPick={(f) => handleUpload(dt.key, f)} />
                  </div>
                  {docsForType.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-2">Not uploaded yet.</p>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {docsForType.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{doc.file_name}</div>
                            {doc.status === "rejected" && doc.rejection_reason && (
                              <div className="text-xs text-red-700 mt-0.5">Reason: {doc.rejection_reason}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <DocStatusBadge status={doc.status} />
                            <button
                              type="button"
                              onClick={() => viewDocument(doc.file_path)}
                              className="text-xs rounded-md border border-border px-2.5 py-1 hover:bg-muted"
                            >
                              View
                            </button>
                            {doc.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => deleteDocument(doc.id)}
                                className="text-xs rounded-md border border-border px-2.5 py-1 hover:bg-muted"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DocUploadButton({ uploading, onPick }: { uploading: boolean; onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    verified: "bg-green-100 text-green-900",
    rejected: "bg-red-100 text-red-900",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
