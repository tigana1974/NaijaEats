import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/profile")({
  component: VendorProfilePage,
});

type Form = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  type: "restaurant" | "home_chef" | "grocery" | "personal_chef";
  country: "NG" | "UK";
  city: string;
  address_line: string;
  cover_image_url: string;
  logo_url: string;
  delivery_fee: number;
  min_order: number;
};

const defaultForm: Form = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  type: "restaurant",
  country: "NG",
  city: "",
  address_line: "",
  cover_image_url: "",
  logo_url: "",
  delivery_fee: 0,
  min_order: 0,
};

const DOC_TYPES: { key: string; label: string; required: boolean }[] = [
  { key: "business_registration", label: "Business registration", required: true },
  { key: "id_document", label: "Government ID", required: true },
  { key: "health_permit", label: "Health permit", required: false },
  { key: "food_safety_certificate", label: "Food safety certificate", required: false },
  { key: "other", label: "Other supporting document", required: false },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function VendorProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const [form, setForm] = useState<Form>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "logo" | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-vendor"],
    queryFn: async () => {
      const uid = user.id;
      if (!uid) return null;
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("owner_id", uid)
        .maybeSingle();
      return data ?? null;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["my-vendor-documents", existing?.id],
    enabled: !!existing?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("vendor_id", existing!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        slug: existing.slug ?? "",
        tagline: existing.tagline ?? "",
        description: existing.description ?? "",
        type: existing.type,
        country: existing.country,
        city: existing.city ?? "",
        address_line: existing.address_line ?? "",
        cover_image_url: existing.cover_image_url ?? "",
        logo_url: existing.logo_url ?? "",
        delivery_fee: existing.delivery_fee || 0,
        min_order: existing.min_order || 0,
      });
    } else {
      // Set type based on auth metadata if available
      const vt = user.user_metadata?.vendor_type;
      if (vt === "grocery" || vt === "restaurant") {
        setForm(f => ({ ...f, type: vt }));
      }
    }
  }, [existing, user.user_metadata?.vendor_type]);

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  const isChef = form.type === "home_chef" || form.type === "personal_chef";
  const isGrocery = form.type === "grocery";

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleDocUpload = async (docType: string, file: File) => {
    if (!existing) {
      toast.error("Save your shop details first");
      return;
    }
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
        .from("vendor-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("vendor_documents").insert({
        vendor_id: existing.id,
        doc_type: docType as any,
        file_path: path,
        file_name: file.name,
      });
      if (insErr) throw insErr;
      toast.success("Document uploaded — pending review");
      qc.invalidateQueries({ queryKey: ["my-vendor-documents", existing.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  const viewDocument = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("vendor-documents").createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deleteDocument = async (docId: string) => {
    if (!window.confirm("Remove this document? You can upload a new one afterwards.")) return;
    const { error } = await supabase.from("vendor_documents").delete().eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document removed");
    qc.invalidateQueries({ queryKey: ["my-vendor-documents", existing?.id] });
  };

  const handleUpload = async (
    kind: "cover" | "logo",
    file: File,
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(kind);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vendor-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Signed URL valid for ~10 years (long-lived; bucket is private)
      const { data: signed, error: signErr } = await supabase.storage
        .from("vendor-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Could not sign URL");
      set(kind === "cover" ? "cover_image_url" : "logo_url", signed.signedUrl);
      toast.success(`${kind === "cover" ? "Cover" : "Logo"} uploaded`);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const slug = form.slug.trim() || slugify(form.name);
      const currency = form.country === "UK" ? "GBP" : "NGN";
      const payload = { ...form, slug, currency, owner_id: uid };
      if (existing) {
        const { error } = await supabase.from("vendors").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success("Shop updated");
      } else {
        const { error } = await supabase.from("vendors").insert(payload);
        if (error) throw error;
        toast.success("Shop created — pending approval");
      }
      await qc.invalidateQueries({ queryKey: ["my-vendor"] });
      await qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      navigate({ to: "/vendor/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {existing
            ? isGrocery ? "Edit store" : isChef ? "Edit kitchen" : "Edit restaurant"
            : "Create your shop"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {existing ? "Update your details below." : "Tell customers about your kitchen or store."}
        </p>
        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field label="Shop name">
              <input className="vinput" required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="URL slug" hint="lowercase, dashes only">
                <input
                  className="vinput"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder={slugify(form.name) || "my-shop"}
                />
              </Field>
              <Field label="Type">
                <select 
                  className="vinput" 
                  value={form.type} 
                  onChange={(e) => set("type", e.target.value as Form["type"])}
                  disabled={!!user.user_metadata?.vendor_type}
                >
                  {form.type === "grocery" ? (
                    <option value="grocery">Grocery store</option>
                  ) : (
                    <>
                      <option value="restaurant">Restaurant</option>
                      <option value="home_chef">Chef</option>
                    </>
                  )}
                </select>
              </Field>
            </div>
            <Field label="Tagline">
              <input className="vinput" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea
                className="vinput min-h-[100px]"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Country">
                <select className="vinput" value={form.country} onChange={(e) => set("country", e.target.value as "NG" | "UK")}>
                  <option value="NG">Nigeria</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </Field>
              <Field label="City">
                <input className="vinput" required value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
            <Field label="Street address">
              <input className="vinput" value={form.address_line} onChange={(e) => set("address_line", e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cover image">
                <ImageUpload
                  url={form.cover_image_url}
                  aspect="aspect-[16/9]"
                  uploading={uploading === "cover"}
                  onPick={(f) => handleUpload("cover", f)}
                  onClear={() => set("cover_image_url", "")}
                />
              </Field>
              <Field label="Logo">
                <ImageUpload
                  url={form.logo_url}
                  aspect="aspect-square"
                  uploading={uploading === "logo"}
                  onPick={(f) => handleUpload("logo", f)}
                  onClear={() => set("logo_url", "")}
                />
              </Field>
            </div>
            <div className={`grid gap-4 ${isGrocery ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
              <Field label="Delivery fee">
                <input
                  type="number" min={0} placeholder="0" className="vinput"
                  value={form.delivery_fee === 0 ? "" : form.delivery_fee}
                  onChange={(e) => set("delivery_fee", Number(e.target.value))}
                />
              </Field>
              <Field label="Min order">
                <input
                  type="number" min={0} placeholder="0" className="vinput"
                  value={form.min_order === 0 ? "" : form.min_order}
                  onChange={(e) => set("min_order", Number(e.target.value))}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-6 py-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : existing ? "Save changes" : "Create shop"}
            </button>
          </form>
        )}

        {existing && (
          <div className="mt-10">
            <h2 className="font-display text-xl sm:text-2xl font-semibold">Verification documents</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload these so an admin can verify your shop. PDF or image, up to 10MB each.
            </p>
            <div className="mt-5 grid gap-3">
              {DOC_TYPES.map((dt) => {
                const docsForType = (documents ?? []).filter((d: any) => d.doc_type === dt.key);
                return (
                  <div key={dt.key} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-medium text-sm">
                        {dt.label}
                        {dt.required && <span className="text-[var(--brand-clay)]"> *</span>}
                      </div>
                      <DocUploadButton
                        uploading={uploadingDoc === dt.key}
                        onPick={(f) => handleDocUpload(dt.key, f)}
                      />
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
          </div>
        )}
      </div>
      <style>{`
        .vinput { width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--card); font-size: 0.95rem; }
        .vinput:focus { outline: 2px solid var(--brand-clay); outline-offset: 1px; }
      `}</style>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">
        {label} {hint && <span className="text-muted-foreground font-normal">— {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ImageUpload({
  url,
  aspect,
  uploading,
  onPick,
  onClear,
}: {
  url: string;
  aspect: string;
  uploading: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <div
        className={`${aspect} w-full rounded-lg border border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center`}
      >
        {url ? (
          <img src={url} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50"
        >
          {uploading ? "Uploading…" : url ? "Replace" : "Upload image"}
        </button>
        {url && !uploading && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            Remove
          </button>
        )}
      </div>
    </div>
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
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`}>{status}</span>
  );
}