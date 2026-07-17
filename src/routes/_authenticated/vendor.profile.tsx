import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useVendorStore } from "@/hooks/useVendorStore";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/profile")({
  component: VendorProfilePage,
});

type Form = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  type: "restaurant" | "chef" | "grocery";
  country: "NG" | "UK";
  city: string;
  address_line: string;
  cover_image_url: string;
  logo_url: string;
  offers_free_delivery: boolean;
  min_order: number;
  hourly_rate: number;
  event_services: string;
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
  offers_free_delivery: false,
  min_order: 0,
  hourly_rate: 0,
  event_services: "",
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

function normalizeVendorType(type: unknown): Form["type"] {
  if (type === "grocery" || type === "restaurant" || type === "chef") return type;
  return "restaurant";
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

  const { activeShopId, setActiveShopId } = useVendorStore();

  const { data: vendorMeta } = useQuery({
    queryKey: ["vendor-meta", user.id],
    queryFn: async () => {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("vendors").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
      ]);
      return { plan: (profile as any)?.vendor_plan || "basic", count: count || 0 };
    },
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-vendor", activeShopId],
    enabled: !!activeShopId,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", activeShopId!)
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
        type: normalizeVendorType(existing.type),
        country: existing.country,
        city: existing.city ?? "",
        address_line: existing.address_line ?? "",
        cover_image_url: existing.cover_image_url ?? "",
        logo_url: existing.logo_url ?? "",
        offers_free_delivery: existing.offers_free_delivery || false,
        min_order: existing.min_order || 0,
        hourly_rate: Number(existing.hourly_rate) || 0,
        event_services: existing.event_services ?? "",
      });
    } else {
      // Set type based on auth metadata if available
      const vt = user.user_metadata?.vendor_type;
      if (vt) {
        setForm(f => ({ ...f, type: normalizeVendorType(vt) }));
      }
    }
  }, [existing, user.user_metadata?.vendor_type]);

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  const isChef = form.type === "chef";
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
      const payload = {
        ...form,
        slug,
        currency,
        owner_id: uid,
        hourly_rate: form.hourly_rate > 0 ? form.hourly_rate : null,
        event_services: form.event_services.trim() || null,
      };
      if (existing) {
        const { error } = await supabase.from("vendors").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success("Shop updated");
      } else {
        const plan = vendorMeta?.plan || "basic";
        const maxShops = plan === "enterprise" ? Infinity : plan === "pro" ? 15 : plan === "premium" ? 5 : 1;
        if ((vendorMeta?.count || 0) >= maxShops) {
          throw new Error(`You have reached the maximum of ${maxShops === Infinity ? "unlimited" : maxShops} shops on the ${plan} plan. Please upgrade to create more.`);
        }
        const { data: inserted, error } = await supabase.from("vendors").insert(payload).select().single();
        if (error) throw error;
        toast.success("Shop created — pending approval");
        setActiveShopId(inserted.id);
      }
      await qc.invalidateQueries({ queryKey: ["my-vendor"] });
      await qc.invalidateQueries({ queryKey: ["my-shops"] });
      await qc.invalidateQueries({ queryKey: ["vendor-meta"] });
      await qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      navigate({ to: "/vendor/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || err?.details || "Save failed");
      console.error("Vendor save error:", err);
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
                      <option value="chef">Chef</option>
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
              <Field label="Offer free delivery?">
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.offers_free_delivery}
                      onChange={(e) => set("offers_free_delivery", e.target.checked)}
                    />
                    <div className={`block h-6 w-11 rounded-full transition-colors ${form.offers_free_delivery ? 'bg-[var(--brand-clay)]' : 'bg-muted-foreground/30'}`}></div>
                    <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${form.offers_free_delivery ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-sm font-medium">Yes, subsidize rider fees</span>
                </label>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  We will cover the rider's delivery fee for your customers out of your order subtotal to help you attract more sales.
                </p>
              </Field>
              <Field label="Min order">
                <input
                  type="number" min={0} step="any" placeholder="0" className="vinput"
                  value={form.min_order === 0 ? "" : form.min_order}
                  onChange={(e) => set("min_order", Number(e.target.value))}
                />
              </Field>
            </div>

            {isChef && (
              <div className="rounded-2xl border border-[var(--brand-clay)]/25 bg-[oklch(0.98_0.01_25)] p-5">
                <h3 className="font-display text-lg font-semibold">Event cooking</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  Customers can book you for parties and occasions from the Book a Chef page. Set your
                  per-hour rate — without it your kitchen won't appear there.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={`Rate per hour (${form.country === "UK" ? "£" : "₦"})`}>
                    <input
                      type="number" min={0} step="any" placeholder="e.g. 15000" className="vinput"
                      value={form.hourly_rate === 0 ? "" : form.hourly_rate}
                      onChange={(e) => set("hourly_rate", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="What you offer" hint="shown on your booking card">
                    <input
                      className="vinput"
                      placeholder="e.g. Live jollof station, small chops, owambe catering"
                      value={form.event_services}
                      onChange={(e) => set("event_services", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-6 py-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : existing ? "Save changes" : "Create shop"}
            </button>
          </form>
        )}

        {existing && isChef && (
          <ChefBookingsSection vendorId={existing.id} currency={existing.currency} />
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

/** Incoming event bookings for a chef, with accept / decline actions. */
function ChefBookingsSection({ vendorId, currency }: { vendorId: string; currency: string }) {
  const qc = useQueryClient();
  const symbol = currency === "GBP" ? "£" : "₦";

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["chef-bookings", vendorId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_bookings")
        .select("*")
        .eq("chef_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data ?? [];
      const customerIds = [...new Set(rows.map((b) => b.customer_id))];
      let names = new Map<string, string>();
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", customerIds);
        names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Customer"]));
      }
      return rows.map((b) => ({ ...b, customerName: names.get(b.customer_id) ?? "Customer" }));
    },
  });

  const respond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("chef_bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Booking accepted — it's a date!" : "Booking declined");
    qc.invalidateQueries({ queryKey: ["chef-bookings", vendorId] });
  };

  // Which booking is showing the counter-offer input, and the typed amount.
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

  const sendCounter = async (id: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return toast.error("Enter your counter-offer amount");
    const { error } = await supabase
      .from("chef_bookings")
      .update({ status: "countered", counter_total: amount })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Counter-offer sent to the customer");
    setCounteringId(null);
    setCounterAmount("");
    qc.invalidateQueries({ queryKey: ["chef-bookings", vendorId] });
  };

  const statusCls: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    countered: "bg-purple-100 text-purple-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl sm:text-2xl font-semibold">Event bookings</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Requests from customers who want you to cook at their event.
      </p>
      <div className="mt-5 grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (bookings ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No booking requests yet. Set your hourly rate above so customers can find you.
          </div>
        )}
        {(bookings ?? []).map((b: any) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-semibold">{b.customerName}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {new Date(b.event_date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  {b.start_time ? ` · from ${b.start_time}` : ""} · {Number(b.hours)} hr{Number(b.hours) > 1 ? "s" : ""}
                  {b.guests ? ` · ~${b.guests} guests` : ""}
                </div>
                {b.note && <div className="text-sm mt-1.5 break-words">"{b.note}"</div>}
                {b.offer_total != null && (
                  <div className="mt-1.5 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                    Customer's offer — your rate would be {symbol}{(Number(b.hours) * Number(b.hourly_rate)).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg font-bold">{symbol}{Number(b.total).toLocaleString()}</div>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusCls[b.status] ?? "bg-muted"}`}>
                  {b.status}
                </span>
              </div>
            </div>
            {b.status === "countered" && b.counter_total != null && (
              <div className="mt-2 text-xs text-muted-foreground">
                You countered with {symbol}{Number(b.counter_total).toLocaleString()} — waiting for the customer.
              </div>
            )}
            {b.status === "pending" && (
              <>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(b.id, "accepted")}
                    className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white"
                  >
                    Accept
                  </button>
                  {b.offer_total != null && (
                    <button
                      type="button"
                      onClick={() => {
                        setCounteringId(counteringId === b.id ? null : b.id);
                        setCounterAmount(String(Number(b.hours) * Number(b.hourly_rate)));
                      }}
                      className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white"
                    >
                      Counter
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => respond(b.id, "declined")}
                    className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-muted"
                  >
                    Decline
                  </button>
                </div>
                {counteringId === b.id && (
                  <div className="mt-2.5 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
                      <input
                        type="number"
                        min={1}
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        placeholder="Your counter-offer"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-8 pr-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => sendCounter(b.id)}
                      className="rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white"
                    >
                      Send
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
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
