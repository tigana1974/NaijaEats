import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/personal-info")({
  component: PersonalInfoPage,
});

function PersonalInfoPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.default_city ?? "");
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, phone: phone || null, default_city: city || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    await qc.invalidateQueries({ queryKey: ["me-header"] });
    toast.success("Profile updated");
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-3">Personal Information</h1>
        <p className="text-sm text-muted-foreground">Manage your name and contact details.</p>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Default city</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos" disabled={isLoading} />
          </div>
          <Button type="submit" disabled={saving || isLoading} className="w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </RoleShell>
  );
}
