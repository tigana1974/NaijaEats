import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setLabel(""); setLine1(""); setLine2(""); setCity(""); setPostcode("");
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1 || !city) return toast.error("Address line and city are required");
    setSaving(true);
    const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: label || null,
      line1,
      line2: line2 || null,
      city,
      postcode: postcode || null,
      country: (profile?.country ?? "NG") as any,
      is_default: !addresses || addresses.length === 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    reset();
    setShowForm(false);
    await qc.invalidateQueries({ queryKey: ["addresses", user.id] });
    toast.success("Address added");
  };

  const makeDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["addresses", user.id] });
    toast.success("Default address updated");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["addresses", user.id] });
    toast.success("Address removed");
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Addresses</h1>
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="rounded-full">
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={add} className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Office…" />
            </div>
            <div className="space-y-1.5">
              <Label>Address line 1*</Label>
              <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address line 2</Label>
              <Input value={line2} onChange={(e) => setLine2(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City*</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90">
              {saving ? "Saving…" : "Save address"}
            </Button>
          </form>
        )}

        <ul className="mt-6 space-y-3">
          {isLoading ? (
            <li className="text-sm text-muted-foreground">Loading…</li>
          ) : addresses && addresses.length > 0 ? (
            addresses.map((a: any) => (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground shrink-0">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">{a.label || "Address"}</div>
                      {a.is_default && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-[var(--brand-gold)]/20 text-[var(--brand-clay)] rounded-full px-2 py-0.5">Default</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {[a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ")}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {!a.is_default && (
                        <Button variant="outline" size="sm" onClick={() => makeDefault(a.id)} className="rounded-full">
                          <Star className="h-3.5 w-3.5" /> Make default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="rounded-full text-[var(--brand-clay)] hover:text-[var(--brand-clay)]">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No addresses yet. Add one to speed up checkout.
            </li>
          )}
        </ul>
      </div>
    </RoleShell>
  );
}
