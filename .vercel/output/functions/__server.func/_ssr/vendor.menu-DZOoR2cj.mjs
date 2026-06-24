import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { k as Plus, q as Trash2, ah as Pencil, ai as LoaderCircle, aj as Upload } from "../_libs/lucide-react.mjs";
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
function VendorMenu() {
  const qc = useQueryClient();
  const [editing, setEditing] = reactExports.useState(null);
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const [showItemForm, setShowItemForm] = reactExports.useState(false);
  const [newCat, setNewCat] = reactExports.useState("");
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor-menu"],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const {
        data: vendor
      } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      if (!vendor) return {
        vendor: null
      };
      const [{
        data: cats
      }, {
        data: items
      }] = await Promise.all([supabase.from("menu_categories").select("*").eq("vendor_id", vendor.id).order("sort_order"), supabase.from("menu_items").select("*").eq("vendor_id", vendor.id).order("created_at", {
        ascending: false
      })]);
      return {
        vendor,
        categories: cats ?? [],
        items: items ?? []
      };
    }
  });
  const refresh = () => qc.invalidateQueries({
    queryKey: ["vendor-menu"]
  });
  const addCategory = async () => {
    if (!newCat.trim() || !data?.vendor) return;
    const {
      error
    } = await supabase.from("menu_categories").insert({
      vendor_id: data.vendor.id,
      name: newCat.trim(),
      sort_order: data.categories?.length ?? 0
    });
    if (error) return toast.error(error.message);
    setNewCat("");
    toast.success("Category added");
    refresh();
  };
  const deleteCategory = async (id) => {
    if (!confirm("Delete this category? Items will be uncategorized.")) return;
    const {
      error
    } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };
  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;
    const {
      error
    } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };
  const toggleAvailable = async (it) => {
    const {
      error
    } = await supabase.from("menu_items").update({
      is_available: !it.is_available
    }).eq("id", it.id);
    if (error) return toast.error(error.message);
    refresh();
  };
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: data?.vendor?.type === "grocery" ? "Products" : "Menu" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: data?.vendor?.type === "grocery" ? "Manage your store inventory." : "Manage what customers can order." }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-muted-foreground", children: "Loading…" }) : !data?.vendor ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-muted-foreground", children: "Create your shop first." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: data?.vendor?.type === "grocery" ? "Departments" : "Categories" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: newCat, onChange: (e) => setNewCat(e.target.value), placeholder: data?.vendor?.type === "grocery" ? "e.g. Produce, Dairy, Beverages" : "e.g. Mains, Drinks", className: "flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: addCategory, className: "rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Add"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          data.categories?.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteCategory(c.id), className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }, c.id)),
          data.categories?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "No categories yet." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: data?.vendor?.type === "grocery" ? "Products" : "Items" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            setEditing(null);
            setShowItemForm(true);
          }, className: "rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " ",
            data?.vendor?.type === "grocery" ? "Add product" : "Add item"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [
          data.items?.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 flex gap-4", children: [
            it.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: it.image_url, alt: it.name, className: "h-20 w-20 rounded-lg object-cover shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-lg bg-muted shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold truncate", children: it.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-[var(--brand-clay)] shrink-0", children: [
                  it.currency === "GBP" ? "£" : "₦",
                  Number(it.price).toLocaleString()
                ] })
              ] }),
              it.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mt-1", children: it.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2 items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleAvailable(it), className: `text-xs px-2 py-0.5 rounded-full ${it.is_available ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`, children: it.is_available ? "Available" : "Hidden" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
                  setEditing(it);
                  setShowItemForm(true);
                }, className: "text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3 w-3" }),
                  " Edit"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => deleteItem(it.id), className: "text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }),
                  " Delete"
                ] })
              ] })
            ] })
          ] }, it.id)),
          data.items?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground col-span-full", children: data?.vendor?.type === "grocery" ? "No products yet. Add your first product." : "No items yet. Add your first dish." })
        ] })
      ] }),
      showItemForm && /* @__PURE__ */ jsxRuntimeExports.jsx(ItemModal, { vendor: data.vendor, categories: data.categories, item: editing, onClose: () => {
        setShowItemForm(false);
        setEditing(null);
      }, onSaved: () => {
        setShowItemForm(false);
        setEditing(null);
        refresh();
      } })
    ] })
  ] }) });
}
function ItemModal({
  vendor,
  categories,
  item,
  onClose,
  onSaved
}) {
  const isGrocery = vendor.type === "grocery";
  const isChef = vendor.type === "home_chef" || vendor.type === "personal_chef";
  const [form, setForm] = reactExports.useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: Number(item?.price ?? 0),
    category_id: item?.category_id ?? "",
    image_url: item?.image_url ?? "",
    is_available: item?.is_available ?? true,
    spice_level: item?.spice_level ?? "",
    unit: item?.unit ?? "",
    stock: item?.stock ?? 0
  });
  const [saving, setSaving] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const symbol = vendor.currency === "GBP" ? "£" : "₦";
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/menu-${Date.now()}.${ext}`;
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
      setForm((f) => ({
        ...f,
        image_url: signed.signedUrl
      }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vendor_id: vendor.id,
        currency: vendor.currency,
        name: form.name,
        description: form.description || null,
        price: form.price,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        is_available: form.is_available,
        ...isGrocery ? {
          unit: form.unit || null,
          stock: form.stock
        } : {},
        ...vendor.type === "restaurant" || isChef ? {
          spice_level: form.spice_level || null
        } : {}
      };
      if (item) {
        const {
          error
        } = await supabase.from("menu_items").update(payload).eq("id", item.id);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const {
          error
        } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
        toast.success("Item added");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-semibold mb-4", children: item ? isGrocery ? "Edit product" : "Edit item" : isGrocery ? "Add product" : "Add item" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-lg bg-muted overflow-hidden shrink-0 grid place-items-center", children: form.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: form.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "No photo" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => fileRef.current?.click(), disabled: uploading, className: "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50", children: [
            uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" }),
            form.image_url ? "Replace photo" : "Upload photo"
          ] }),
          form.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setForm({
            ...form,
            image_url: ""
          }), className: "text-xs text-muted-foreground hover:text-foreground text-left", children: "Remove" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handleUpload })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, placeholder: isGrocery ? "Product name" : "Item name", value: form.name, onChange: (e) => setForm({
        ...form,
        name: e.target.value
      }), className: "vinput" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { placeholder: "Description", value: form.description, onChange: (e) => setForm({
        ...form,
        description: e.target.value
      }), className: "vinput min-h-[80px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground", children: symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, type: "number", min: 0, step: "0.01", placeholder: "Price", value: form.price, onChange: (e) => setForm({
            ...form,
            price: Number(e.target.value)
          }), className: "vinput pl-7" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: form.category_id, onChange: (e) => setForm({
          ...form,
          category_id: e.target.value
        }), className: "vinput", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "No category" }),
          categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.id, children: c.name }, c.id))
        ] })
      ] }),
      isGrocery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Unit" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: form.unit, onChange: (e) => setForm({
            ...form,
            unit: e.target.value
          }), className: "vinput", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select unit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "kg", children: "Kilogram (kg)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "g", children: "Gram (g)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "L", children: "Litre (L)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ml", children: "Millilitre (ml)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pack", children: "Pack" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bottle", children: "Bottle" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "tin", children: "Tin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bag", children: "Bag" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "piece", children: "Piece" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "dozen", children: "Dozen" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bunch", children: "Bunch" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Stock count" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, value: form.stock, onChange: (e) => setForm({
            ...form,
            stock: Number(e.target.value)
          }), className: "vinput" })
        ] })
      ] }),
      (vendor.type === "restaurant" || isChef) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Spice level" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: form.spice_level, onChange: (e) => setForm({
          ...form,
          spice_level: e.target.value
        }), className: "vinput", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Not specified" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mild", children: "Mild" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "Medium" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hot", children: "Hot" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "extra_hot", children: "Extra hot" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.is_available, onChange: (e) => setForm({
          ...form,
          is_available: e.target.checked
        }) }),
        "Available to order"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-lg border border-border px-4 py-2 text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: saving, className: "rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold disabled:opacity-50", children: saving ? "Saving…" : "Save" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .vinput { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--background); font-size: 0.9rem; }
        ` })
  ] }) });
}
export {
  VendorMenu as component
};
