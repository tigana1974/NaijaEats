import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { A as AppShell } from "./AppShell-CCvDqzSG.mjs";
import { u as useMyRole } from "./useMyRole-CYqyKbbQ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
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
import "../_libs/lucide-react.mjs";
const defaultForm = {
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
  prep_time_minutes: 30,
  cuisine: []
};
const CUISINE_OPTIONS = ["Nigerian", "Ghanaian", "West African", "East African", "South African", "Chinese", "Indian", "Italian", "Japanese", "Mexican", "Thai", "Mediterranean", "Middle Eastern", "British", "American", "Caribbean", "French", "Korean", "Vietnamese", "Ethiopian"];
const DOC_TYPES = [{
  key: "business_registration",
  label: "Business registration",
  required: true
}, {
  key: "id_document",
  label: "Government ID",
  required: true
}, {
  key: "health_permit",
  label: "Health permit",
  required: false
}, {
  key: "food_safety_certificate",
  label: "Food safety certificate",
  required: false
}, {
  key: "other",
  label: "Other supporting document",
  required: false
}];
function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function VendorProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const [form, setForm] = reactExports.useState(defaultForm);
  const [saving, setSaving] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(null);
  const [uploadingDoc, setUploadingDoc] = reactExports.useState(null);
  const {
    data: existing,
    isLoading
  } = useQuery({
    queryKey: ["my-vendor"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const {
        data
      } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      return data ?? null;
    }
  });
  const {
    data: documents
  } = useQuery({
    queryKey: ["my-vendor-documents", existing?.id],
    enabled: !!existing?.id,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("vendor_documents").select("*").eq("vendor_id", existing.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  reactExports.useEffect(() => {
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
        delivery_fee: Number(existing.delivery_fee ?? 0),
        min_order: Number(existing.min_order ?? 0),
        prep_time_minutes: Number(existing.prep_time_minutes ?? 30),
        cuisine: existing.cuisine ?? []
      });
    }
  }, [existing]);
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  const isChef = form.type === "home_chef" || form.type === "personal_chef";
  const isGrocery = form.type === "grocery";
  const set = (k, v) => setForm((f) => ({
    ...f,
    [k]: v
  }));
  const handleDocUpload = async (docType, file) => {
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
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${uid}/${docType}-${Date.now()}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("vendor-documents").upload(path, file, {
        upsert: true,
        contentType: file.type
      });
      if (upErr) throw upErr;
      const {
        error: insErr
      } = await supabase.from("vendor_documents").insert({
        vendor_id: existing.id,
        doc_type: docType,
        file_path: path,
        file_name: file.name
      });
      if (insErr) throw insErr;
      toast.success("Document uploaded — pending review");
      qc.invalidateQueries({
        queryKey: ["my-vendor-documents", existing.id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };
  const viewDocument = async (filePath) => {
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
  const deleteDocument = async (docId) => {
    if (!window.confirm("Remove this document? You can upload a new one afterwards.")) return;
    const {
      error
    } = await supabase.from("vendor_documents").delete().eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document removed");
    qc.invalidateQueries({
      queryKey: ["my-vendor-documents", existing?.id]
    });
  };
  const handleUpload = async (kind, file) => {
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
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("vendor-assets").upload(path, file, {
        upsert: true,
        contentType: file.type
      });
      if (upErr) throw upErr;
      const {
        data: signed,
        error: signErr
      } = await supabase.storage.from("vendor-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Could not sign URL");
      set(kind === "cover" ? "cover_image_url" : "logo_url", signed.signedUrl);
      toast.success(`${kind === "cover" ? "Cover" : "Logo"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const slug = form.slug.trim() || slugify(form.name);
      const currency = form.country === "UK" ? "GBP" : "NGN";
      const payload = {
        ...form,
        slug,
        currency,
        owner_id: uid
      };
      if (existing) {
        const {
          error
        } = await supabase.from("vendors").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success("Shop updated");
      } else {
        const {
          error
        } = await supabase.from("vendors").insert(payload);
        if (error) throw error;
        toast.success("Shop created — pending approval");
      }
      await qc.invalidateQueries({
        queryKey: ["my-vendor"]
      });
      await qc.invalidateQueries({
        queryKey: ["vendor-dashboard"]
      });
      navigate({
        to: "/vendor/dashboard"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: existing ? isGrocery ? "Edit store" : isChef ? "Edit kitchen" : "Edit restaurant" : "Create your shop" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: existing ? "Update your details below." : "Tell customers about your kitchen or store." }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-8 text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "mt-8 space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Shop name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "vinput", required: true, value: form.name, onChange: (e) => set("name", e.target.value) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "URL slug", hint: "lowercase, dashes only", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "vinput", value: form.slug, onChange: (e) => set("slug", e.target.value), placeholder: slugify(form.name) || "my-shop" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Type", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "vinput", value: form.type, onChange: (e) => set("type", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "restaurant", children: "Restaurant" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "home_chef", children: "Chef" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "grocery", children: "Grocery store" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tagline", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "vinput", value: form.tagline, onChange: (e) => set("tagline", e.target.value) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Description", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "vinput min-h-[100px]", value: form.description, onChange: (e) => set("description", e.target.value) }) }),
        !isGrocery && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: isChef ? "Specialties" : "Cuisine", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mt-1", children: CUISINE_OPTIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          const next = form.cuisine.includes(c) ? form.cuisine.filter((x) => x !== c) : [...form.cuisine, c];
          set("cuisine", next);
        }, className: `text-xs px-3 py-1.5 rounded-full border transition ${form.cuisine.includes(c) ? "bg-[var(--brand-clay)] text-white border-[var(--brand-clay)]" : "border-border hover:bg-muted"}`, children: c }, c)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Country", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "vinput", value: form.country, onChange: (e) => set("country", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "NG", children: "Nigeria" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "UK", children: "United Kingdom" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "City", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "vinput", required: true, value: form.city, onChange: (e) => set("city", e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Street address", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "vinput", value: form.address_line, onChange: (e) => set("address_line", e.target.value) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cover image", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImageUpload, { url: form.cover_image_url, aspect: "aspect-[16/9]", uploading: uploading === "cover", onPick: (f) => handleUpload("cover", f), onClear: () => set("cover_image_url", "") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Logo", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImageUpload, { url: form.logo_url, aspect: "aspect-square", uploading: uploading === "logo", onPick: (f) => handleUpload("logo", f), onClear: () => set("logo_url", "") }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `grid gap-4 ${isGrocery ? "sm:grid-cols-2" : "sm:grid-cols-3"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Delivery fee", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, className: "vinput", value: form.delivery_fee, onChange: (e) => set("delivery_fee", Number(e.target.value)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Min order", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, className: "vinput", value: form.min_order, onChange: (e) => set("min_order", Number(e.target.value)) }) }),
          !isGrocery && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: isChef ? "Average cook time (min)" : "Prep time (min)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, className: "vinput", value: form.prep_time_minutes, onChange: (e) => set("prep_time_minutes", Number(e.target.value)) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: saving, className: "w-full sm:w-auto rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-6 py-3 font-semibold disabled:opacity-50", children: saving ? "Saving…" : existing ? "Save changes" : "Create shop" })
      ] }),
      existing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl sm:text-2xl font-semibold", children: "Verification documents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1 text-sm", children: "Upload these so an admin can verify your shop. PDF or image, up to 10MB each." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid gap-3", children: DOC_TYPES.map((dt) => {
          const docsForType = (documents ?? []).filter((d) => d.doc_type === dt.key);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm", children: [
                dt.label,
                dt.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--brand-clay)]", children: " *" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DocUploadButton, { uploading: uploadingDoc === dt.key, onPick: (f) => handleDocUpload(dt.key, f) })
            ] }),
            docsForType.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Not uploaded yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2", children: docsForType.map((doc) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium truncate", children: doc.file_name }),
                doc.status === "rejected" && doc.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-red-700 mt-0.5", children: [
                  "Reason: ",
                  doc.rejection_reason
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DocStatusBadge, { status: doc.status }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => viewDocument(doc.file_path), className: "text-xs rounded-md border border-border px-2.5 py-1 hover:bg-muted", children: "View" }),
                doc.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => deleteDocument(doc.id), className: "text-xs rounded-md border border-border px-2.5 py-1 hover:bg-muted", children: "Remove" })
              ] })
            ] }, doc.id)) })
          ] }, dt.key);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .vinput { width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--card); font-size: 0.95rem; }
        .vinput:focus { outline: 2px solid var(--brand-clay); outline-offset: 1px; }
      ` })
  ] });
}
function Field({
  label,
  hint,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium block mb-1.5", children: [
      label,
      " ",
      hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-normal", children: [
        "— ",
        hint
      ] })
    ] }),
    children
  ] });
}
function ImageUpload({
  url,
  aspect,
  uploading,
  onPick,
  onClear
}) {
  const ref = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${aspect} w-full rounded-lg border border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center`, children: url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: url, alt: "Preview", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "No image" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
      const f = e.target.files?.[0];
      if (f) onPick(f);
      e.target.value = "";
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => ref.current?.click(), disabled: uploading, className: "text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50", children: uploading ? "Uploading…" : url ? "Replace" : "Upload image" }),
      url && !uploading && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClear, className: "text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted", children: "Remove" })
    ] })
  ] });
}
function DocUploadButton({
  uploading,
  onPick
}) {
  const ref = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref, type: "file", accept: "application/pdf,image/*", className: "hidden", onChange: (e) => {
      const f = e.target.files?.[0];
      if (f) onPick(f);
      e.target.value = "";
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => ref.current?.click(), disabled: uploading, className: "text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-50", children: uploading ? "Uploading…" : "Upload" })
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`, children: status });
}
export {
  VendorProfilePage as component
};
