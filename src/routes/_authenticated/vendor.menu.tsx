import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Upload, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/menu")({
  component: VendorMenu,
});

function VendorMenu() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const { data: role, isLoading: roleLoading } = useMyRole();
  const [showItemForm, setShowItemForm] = useState(false);
  const [newCat, setNewCat] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-menu"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      if (!vendor) return { vendor: null };
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("vendor_id", vendor.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false }),
      ]);
      return { vendor, categories: cats ?? [], items: items ?? [] };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["vendor-menu"] });

  const addCategory = async () => {
    if (!newCat.trim() || !data?.vendor) return;
    const { error } = await supabase
      .from("menu_categories")
      .insert({ vendor_id: data.vendor.id, name: newCat.trim(), sort_order: (data.categories?.length ?? 0) });
    if (error) return toast.error(error.message);
    setNewCat("");
    toast.success("Category added");
    refresh();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Items will be uncategorized.")) return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const toggleAvailable = async (it: any) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !it.is_available }).eq("id", it.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {data?.vendor?.type === "grocery" ? "Products" : "Menu"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {data?.vendor?.type === "grocery" ? "Manage your store inventory." : "Manage what customers can order."}
        </p>

        {isLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : !data?.vendor ? (
          <p className="mt-6 text-muted-foreground">Create your shop first.</p>
        ) : (
          <>
            {/* Categories */}
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">
                {data?.vendor?.type === "grocery" ? "Departments" : "Categories"}
              </h2>
              <div className="mt-3 flex gap-2">
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder={data?.vendor?.type === "grocery" ? "e.g. Produce, Dairy, Beverages" : "e.g. Mains, Drinks"}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
                <button onClick={addCategory} className="rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold inline-flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.categories?.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm">
                    <span>{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {data.categories?.length === 0 && (
                  <span className="text-sm text-muted-foreground">No categories yet.</span>
                )}
              </div>
            </section>

            {/* Items */}
            <section className="mt-10">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-xl font-semibold">
                  {data?.vendor?.type === "grocery" ? "Products" : "Items"}
                </h2>
                <button
                  onClick={() => { setEditing(null); setShowItemForm(true); }}
                  className="rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> {data?.vendor?.type === "grocery" ? "Add product" : "Add item"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.items?.map((it: any) => (
                  <div key={it.id} className="rounded-xl border border-border bg-card p-4 flex gap-4">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="h-20 w-20 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{it.name}</h3>
                        <span className="text-sm font-semibold text-[var(--brand-clay)] shrink-0">
                          {it.currency === "GBP" ? "£" : "₦"}{Number(it.price).toLocaleString()}
                        </span>
                      </div>
                      {it.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.description}</p>}
                      <div className="mt-2 flex gap-2 items-center">
                        <button onClick={() => toggleAvailable(it)} className={`text-xs px-2 py-0.5 rounded-full ${it.is_available ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                          {it.is_available ? "Available" : "Hidden"}
                        </button>
                        <button onClick={() => { setEditing(it); setShowItemForm(true); }} className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => deleteItem(it.id)} className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {data.items?.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">
                    {data?.vendor?.type === "grocery" ? "No products yet. Add your first product." : "No items yet. Add your first dish."}
                  </p>
                )}
              </div>
            </section>

            {showItemForm && (
              <ItemModal
                vendor={data.vendor}
                categories={data.categories}
                item={editing}
                onClose={() => { setShowItemForm(false); setEditing(null); }}
                onSaved={() => { setShowItemForm(false); setEditing(null); refresh(); }}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ItemModal({ vendor, categories, item, onClose, onSaved }: { vendor: any; categories: any[]; item: any | null; onClose: () => void; onSaved: () => void }) {
  const isGrocery = vendor.type === "grocery";
  const isChef = vendor.type === "home_chef" || vendor.type === "personal_chef";
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: Number(item?.price ?? 0),
    category_id: item?.category_id ?? "",
    image_url: item?.image_url ?? "",
    is_available: item?.is_available ?? true,
    spice_level: item?.spice_level ?? "",
    unit: item?.unit ?? "",
    stock: item?.stock ?? 0,
    prep_time_minutes: item?.prep_time_minutes ?? 15,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const symbol = vendor.currency === "GBP" ? "£" : "₦";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/menu-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vendor-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("vendor-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Could not sign URL");
      setForm((f) => ({ ...f, image_url: signed.signedUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        vendor_id: vendor.id,
        currency: vendor.currency,
        name: form.name,
        description: form.description || null,
        price: form.price,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        is_available: form.is_available,
        ...(isGrocery ? { unit: form.unit || null, stock: form.stock } : {}),
        ...((vendor.type === "restaurant" || isChef) ? { 
          spice_level: form.spice_level || null,
          prep_time_minutes: form.prep_time_minutes || null,
        } : {}),
      };
      if (item) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", item.id);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-semibold mb-4">
          {item ? (isGrocery ? "Edit product" : "Edit item") : (isGrocery ? "Add product" : "Add item")}
        </h3>
        <form onSubmit={save} className="space-y-3">
          {/* Image uploader */}
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden shrink-0 grid place-items-center">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">No photo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {form.image_url ? "Replace photo" : "Upload photo"}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground text-left"
                >
                  Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          <input required placeholder={isGrocery ? "Product name" : "Item name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="vinput" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="vinput min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
              <input required type="number" min={0} step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="vinput !pl-8" />
            </div>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="vinput">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Type-specific fields */}
          {isGrocery && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="vinput">
                  <option value="">Select unit</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="L">Litre (L)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="pack">Pack</option>
                  <option value="bottle">Bottle</option>
                  <option value="tin">Tin</option>
                  <option value="bag">Bag</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="bunch">Bunch</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock count</label>
                <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="vinput" />
              </div>
            </div>
          )}
          {(vendor.type === "restaurant" || isChef) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Spice level</label>
                <select value={form.spice_level} onChange={(e) => setForm({ ...form, spice_level: e.target.value })} className="vinput">
                  <option value="">Not specified</option>
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra_hot">Extra hot</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prep time (min)</label>
                <input 
                  type="number" min={1} className="vinput"
                  value={form.prep_time_minutes}
                  onChange={(e) => setForm({ ...form, prep_time_minutes: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Available to order
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
        <style>{`
          .vinput { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--background); font-size: 0.9rem; }
        `}</style>
      </div>
    </div>
  );
}