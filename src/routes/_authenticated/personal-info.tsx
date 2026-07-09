import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Check, X, AtSign, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  loadLocalUsername,
  setLocalUsername,
  normalizeUsername,
  validateUsername,
  usernameTakenBySomeoneElse,
  persistUsername,
} from "@/lib/username";

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
      return data as any;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [taken, setTaken] = useState<null | boolean>(null);
  const [saving, setSaving] = useState(false);

  // Hydrate from Supabase / localStorage
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.default_city ?? "");
      const dbUsername = (profile as any).username as string | null | undefined;
      // Local cache is scoped to THIS user's auth id so switching accounts
      // never surfaces another account's handle.
      const localUsername = loadLocalUsername(user.id);
      const initial = dbUsername ?? localUsername ?? "";
      setUsername(initial);
      setSavedUsername(initial || null);
    }
  }, [profile]);

  // Debounced live availability check
  const normalized = useMemo(() => normalizeUsername(username), [username]);
  const validation = useMemo(() => validateUsername(username), [username]);

  useEffect(() => {
    // Skip check while typing something invalid or while it still matches the saved value
    if (!validation.ok) {
      setTaken(null);
      return;
    }
    if (savedUsername && normalized === savedUsername) {
      setTaken(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const t = window.setTimeout(async () => {
      const isTaken = await usernameTakenBySomeoneElse(normalized, user.id);
      if (!cancelled) {
        setTaken(isTaken);
        setChecking(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [normalized, validation.ok, savedUsername, user.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && !validation.ok) return toast.error(validation.reason);
    if (username && taken) return toast.error("That username is already taken");

    setSaving(true);
    const finalUsername = normalized || null;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        default_city: city || null,
      })
      .eq("id", user.id);

    // Try to persist the username too (won't crash if the column is missing)
    if (finalUsername) {
      await persistUsername(user.id, finalUsername);
      setLocalUsername(user.id, finalUsername);
    } else {
      setLocalUsername(user.id, null);
    }

    setSaving(false);
    if (error) return toast.error(error.message);

    setSavedUsername(finalUsername);
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    await qc.invalidateQueries({ queryKey: ["me-header"] });
    toast.success("Profile updated");
  };

  const usernameChanged = savedUsername !== (normalized || null);
  const usernameOk = username === "" || (validation.ok && taken === false);
  const showAvailability = username !== "" && validation.ok && (savedUsername ?? "") !== normalized;

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6 sm:py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-3">Personal Information</h1>
        <p className="text-sm text-muted-foreground">Manage your name, contact details, and Naija Eats handle.</p>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ""} disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="username">Username</Label>
              {savedUsername && !usernameChanged && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <Check className="h-3 w-3" strokeWidth={3} /> Saved
                </span>
              )}
            </div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourhandle"
                disabled={isLoading}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`pl-8 pr-10 lowercase ${
                  showAvailability
                    ? taken
                      ? "border-red-400 focus-visible:ring-red-400/30"
                      : taken === false
                        ? "border-emerald-500 focus-visible:ring-emerald-500/30"
                        : ""
                    : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {showAvailability && checking ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : showAvailability && taken === false ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : showAvailability && taken ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white">
                    <X className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {username && !validation.ok
                ? validation.reason
                : showAvailability && taken
                  ? "Already taken — try another"
                  : showAvailability && taken === false
                    ? "Available! Friends can send you money at @" + normalized
                    : "Friends can find you and send money using this handle."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">Default city</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lagos"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={saving || isLoading || !usernameOk}
            className="w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </RoleShell>
  );
}
