import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShoppingBag, MapPin, CreditCard, Settings, HelpCircle, ChevronRight, Camera, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { AvatarCropDialog } from "@/components/naija/AvatarCropDialog";
import { PremiumAccountBanner } from "@/components/naija/PremiumUpsellDialog";
import { clearAllLocalUsernames } from "@/lib/username";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });
  const { data: roles } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return data ?? [];
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearAllLocalUsernames();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Your account";
  const initials = (profile?.full_name || user.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");
  const roleList = roles?.map((r: any) => r.role).join(", ") || "customer";

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setPendingFile(file);
  };

  const handleCropped = async (blob: Blob) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("Could not sign URL");
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: signed.signedUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!profile?.avatar_url) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  const menuItems: Array<{ label: string; Icon: typeof User; to: string; hint?: string }> = [
    { label: "Personal Information", Icon: User, to: "/personal-info", hint: user.email ?? undefined },
    { label: "My Orders", Icon: ShoppingBag, to: "/orders" },
    { label: "Addresses", Icon: MapPin, to: "/addresses" },
    { label: "Payment Methods", Icon: CreditCard, to: "/payment-methods" },
    { label: "Naija Eats Premium", Icon: Sparkles, to: "/subscription", hint: "Free delivery, cashback, VIP" },
    { label: "Settings", Icon: Settings, to: "/settings" },
    { label: "Help & Support", Icon: HelpCircle, to: "/help" },
  ];

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-[var(--brand-cream)] shadow-md">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-2xl font-semibold bg-muted">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[var(--brand-clay)] ring-4 ring-background flex items-center justify-center text-[var(--brand-cream)] hover:opacity-90 disabled:opacity-60 transition"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFilePicked}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-[var(--brand-clay)] hover:underline disabled:opacity-60"
            >
              Change photo
            </button>
            {profile?.avatar_url && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={uploading}
                  className="text-sm font-medium text-destructive hover:underline disabled:opacity-60"
                >
                  Remove photo
                </button>
              </>
            )}
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">{displayName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {uploading && (
            <p className="mt-1 text-xs text-muted-foreground">Uploading photo…</p>
          )}
          <span className="mt-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
            {roleList}
          </span>
        </div>

        <div className="mt-8">
          <PremiumAccountBanner />
        </div>

        <ul className="mt-6 space-y-3">
          {menuItems.map(({ label, Icon, to, hint }) => {
            const isPremium = to === "/subscription";
            const inner = (
              <div className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition ${
                isPremium
                  ? "bg-gradient-to-br from-[oklch(0.98_0.02_25)] to-white border-[var(--brand-clay)]/30 hover:border-[var(--brand-clay)]/60"
                  : "bg-card border-border hover:border-[var(--brand-clay)]/40"
              }`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isPremium
                    ? "bg-gradient-to-br from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/25"
                    : "bg-muted text-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    {label}
                    {isPremium && (
                      <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                        New
                      </span>
                    )}
                  </div>
                  {hint ? <div className="text-xs text-muted-foreground truncate">{hint}</div> : null}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            );
            return (
              <li key={label}>
                <Link to={to}>{inner}</Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full justify-start gap-4 rounded-2xl border-border bg-card px-4 py-6 h-auto text-foreground hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
              <LogOut className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </div>
      <AvatarCropDialog
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onCropped={handleCropped}
      />
    </RoleShell>
  );
}
