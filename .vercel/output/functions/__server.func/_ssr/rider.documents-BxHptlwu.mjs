import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
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
import "./router-Ck7azls6.mjs";
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
const DOC_TYPES = [{
  key: "drivers_license",
  label: "Driver's license",
  required: true
}, {
  key: "id_document",
  label: "Government ID",
  required: true
}, {
  key: "vehicle_registration",
  label: "Vehicle registration",
  required: true
}, {
  key: "insurance",
  label: "Insurance",
  required: true
}, {
  key: "background_check",
  label: "Background check",
  required: false
}, {
  key: "other",
  label: "Other supporting document",
  required: false
}];
function RiderDocuments() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const qc = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = reactExports.useState(null);
  const {
    data: documents,
    isLoading
  } = useQuery({
    queryKey: ["my-rider-documents"],
    enabled: role === "rider",
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const {
        data,
        error
      } = await supabase.from("rider_documents").select("*").eq("rider_id", uid).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const handleUpload = async (docType, file) => {
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
      } = await supabase.storage.from("rider-documents").upload(path, file, {
        upsert: true,
        contentType: file.type
      });
      if (upErr) throw upErr;
      const {
        error: insErr
      } = await supabase.from("rider_documents").insert({
        rider_id: uid,
        doc_type: docType,
        file_path: path,
        file_name: file.name
      });
      if (insErr) throw insErr;
      toast.success("Document uploaded — pending review");
      qc.invalidateQueries({
        queryKey: ["my-rider-documents"]
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
    } = await supabase.storage.from("rider-documents").createSignedUrl(filePath, 60 * 5);
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
    } = await supabase.from("rider_documents").delete().eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document removed");
    qc.invalidateQueries({
      queryKey: ["my-rider-documents"]
    });
  };
  if (!roleLoading && role !== "rider") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold", children: "Verification documents" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1 text-sm", children: "Upload these so an admin can verify you and unlock delivery jobs. PDF or image, up to 10MB each." }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-8 text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid gap-3", children: DOC_TYPES.map((dt) => {
      const docsForType = (documents ?? []).filter((d) => d.doc_type === dt.key);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm", children: [
            dt.label,
            dt.required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--brand-clay)]", children: " *" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DocUploadButton, { uploading: uploadingDoc === dt.key, onPick: (f) => handleUpload(dt.key, f) })
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
  ] }) });
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
  RiderDocuments as component
};
