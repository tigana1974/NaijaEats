import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  ShoppingBag,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronRight,
  Camera,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { AvatarCropDialog } from "@/components/naija/AvatarCropDialog";
import { PremiumAccountBanner } from "@/components/naija/PremiumUpsellDialog";
import { clearAllLocalUsernames, loadLocalUsername } from "@/lib/username";

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
    localStorage.removeItem("vendor-store");
    clearAllLocalUsernames();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Your account";
  // Prefer the Supabase-persisted username, fall back to the per-user local
  // cache (which is scoped by auth uid so no cross-account leakage).
  const username = (profile as any)?.username as string | undefined | null;
  const usernameHandle = username || loadLocalUsername(user.id) || null;
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
    {
      label: "Personal Information",
      Icon: User,
      to: "/personal-info",
      hint: user.email ?? undefined,
    },
    { label: "My Orders", Icon: ShoppingBag, to: "/orders" },
    { label: "Addresses", Icon: MapPin, to: "/addresses" },
    { label: "Payment Methods", Icon: CreditCard, to: "/payment-methods" },
    {
      label: "Naija One",
      Icon: Sparkles,
      to: "/subscription",
      hint: "Free delivery, cashback, VIP",
    },
    { label: "Settings", Icon: Settings, to: "/settings" },
    { label: "Help & Support", Icon: HelpCircle, to: "/help" },
  ];

  return (
    <RoleShell containerClassName="mx-auto w-full max-w-7xl px-4 pb-28 pt-7 sm:px-6 lg:pb-16">
      <div>
        <header className="mb-7 border-b border-border pb-6">
          <div className="text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand-clay)]">
            Your NaijaEats
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-normal sm:text-4xl">
            Account and preferences.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Manage your profile, delivery details, payments, membership, and support from one place.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <section className="rounded-lg bg-[#171714] p-6 text-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.8)] sm:p-8 lg:sticky lg:top-24 lg:col-span-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-28 w-28 ring-4 ring-white/10 shadow-md">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-white/10 text-2xl font-semibold text-white">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-[#f0bd43] ring-4 ring-[#171714] flex items-center justify-center text-[#171714] hover:opacity-90 disabled:opacity-60 transition"
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
                  className="text-sm font-medium text-[#f0bd43] hover:underline disabled:opacity-60"
                >
                  Change photo
                </button>
                {profile?.avatar_url && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={uploading}
                      className="text-sm font-medium text-red-300 hover:underline disabled:opacity-60"
                    >
                      Remove photo
                    </button>
                  </>
                )}
              </div>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-normal">
                {displayName}
              </h2>
              {usernameHandle ? (
                <Link
                  to="/personal-info"
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-[#f0bd43] transition hover:bg-white/15"
                >
                  @{usernameHandle}
                </Link>
              ) : (
                <Link
                  to="/personal-info"
                  className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1 text-xs font-semibold text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  + Set username
                </Link>
              )}
              {uploading && <p className="mt-1 text-xs text-white/50">Uploading photo...</p>}
              <span className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-white/55">
                {roleList}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10 text-left">
              <div className="bg-white/[0.04] p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Email
                </div>
                <div className="mt-1 truncate text-sm font-semibold">
                  {user.email ?? "Not added"}
                </div>
              </div>
              <div className="bg-white/[0.04] p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Wallet ID
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-[#f0bd43]">
                  @{usernameHandle || "username"}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6 lg:col-span-7">
            <div>
              <PremiumAccountBanner />
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {menuItems.map(({ label, Icon, to, hint }) => {
                const isPremium = to === "/subscription";
                const inner = (
                  <div
                    className={`flex h-full items-center gap-4 rounded-lg border px-4 py-4 transition ${
                      isPremium
                        ? "bg-gradient-to-br from-[oklch(0.98_0.02_25)] to-white border-[var(--brand-clay)]/30 hover:border-[var(--brand-clay)]/60"
                        : "bg-card border-border hover:border-[var(--brand-clay)]/40"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isPremium ? "bg-[var(--brand-clay)] text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className={`flex-1 text-left min-w-0 ${isPremium ? "text-black" : ""}`}>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {label}
                        {isPremium && (
                          <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                            New
                          </span>
                        )}
                      </div>
                      {hint ? (
                        <div
                          className={`text-xs truncate ${isPremium ? "text-black/60" : "text-muted-foreground"}`}
                        >
                          {hint}
                        </div>
                      ) : null}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 ${isPremium ? "text-black/40" : "text-muted-foreground"}`}
                    />
                  </div>
                );
                return (
                  <li key={label}>
                    <Link to={to}>{inner}</Link>
                  </li>
                );
              })}
            </ul>

            <div>
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full justify-start gap-4 rounded-lg border-border bg-card px-4 py-6 h-auto text-foreground hover:bg-muted"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                  <LogOut className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">Logout</span>
              </Button>
            </div>
          </div>
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
