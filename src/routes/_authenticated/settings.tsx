import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Bell, Sun, Moon, Monitor, Globe, KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const KEY = "naijaeats.settings";
type Prefs = { notifications: boolean; language: string };
const defaults: Prefs = { notifications: true, language: "English" };

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const { mode, resolved, setMode } = useTheme();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "null");
      if (stored) setPrefs({ ...defaults, ...stored });
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  const sendReset = async () => {
    if (!user.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
  };

  const deleteAccount = () => {
    toast.message("Account deletion request sent", {
      description: "Our team will reach out within 24 hours to confirm.",
    });
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-3">Settings</h1>

        <section className="mt-6 space-y-3">
          <Row Icon={Bell} title="Push notifications" hint="Order updates and offers">
            <Switch checked={prefs.notifications} onCheckedChange={(v) => setPrefs({ ...prefs, notifications: v })} />
          </Row>

          {/* Appearance — full-width so the three options don't crowd the row */}
          <div className="rounded-2xl bg-card border border-border px-4 py-4">
            <div className="flex items-center gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground">
                {resolved === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Appearance</div>
                <div className="text-xs text-muted-foreground">
                  {mode === "system"
                    ? `Following your device (${resolved})`
                    : mode === "dark"
                      ? "Dark mode is on"
                      : "Light mode is on"}
                </div>
              </div>
            </div>
            <ThemeSegmented mode={mode} onChange={setMode} />
          </div>

          <Row Icon={Globe} title="Language" hint={prefs.language}>
            <select
              value={prefs.language}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option>English</option>
              <option>Pidgin</option>
              <option>Yoruba</option>
              <option>Igbo</option>
              <option>Hausa</option>
            </select>
          </Row>
        </section>

        <h2 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Account</h2>
        <div className="mt-3 space-y-3">
          <Button onClick={sendReset} variant="outline" className="w-full justify-start gap-3 rounded-2xl bg-card border-border h-auto py-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
              <KeyRound className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Change password</span>
          </Button>
          <Button onClick={deleteAccount} variant="outline" className="w-full justify-start gap-3 rounded-2xl bg-card border-border h-auto py-4 text-[var(--brand-clay)] hover:text-[var(--brand-clay)]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-clay)]/10">
              <Trash2 className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Request account deletion</span>
          </Button>
        </div>
      </div>
    </RoleShell>
  );
}

function Row({ Icon, title, hint, children }: { Icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ThemeSegmented({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const options: { id: ThemeMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1">
      {options.map((o) => {
        const active = o.id === mode;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              active
                ? "bg-[var(--brand-clay)] text-white shadow-md shadow-[var(--brand-clay)]/25"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <o.Icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
