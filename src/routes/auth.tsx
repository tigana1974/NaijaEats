import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { homeForRole, type AppRole } from "@/hooks/useMyRole";
import { Logo } from "@/components/naija/Logo";
import authHero from "@/assets/auth-hero.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode; role?: SignupRole } => {
    return {
      mode: search.mode as Mode | undefined,
      role: search.role as SignupRole | undefined,
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — Naija Eats" },
      { name: "description", content: "Sign in or create your Naija Eats account." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";
type SignupRole = "customer" | "chef" | "grocery" | "rider";

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode: initialMode, role: initialRole } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode || "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<SignupRole>(initialRole || "customer");
  const [country, setCountry] = useState<"NG" | "UK">("NG");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect when session appears, sending users to their role's home
  useEffect(() => {
    const redirectByRole = async (uid: string) => {
      // Drop any stale role/profile data cached from a previous session.
      queryClient.removeQueries({ queryKey: ["my-role"] });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const roles = (data ?? []).map((r: any) => r.role as AppRole);
      const role: AppRole = roles.includes("admin")
        ? "admin"
        : roles.includes("vendor")
        ? "vendor"
        : roles.includes("rider")
        ? "rider"
        : "customer";
      // Seed the cache so AppShell renders the correct nav immediately.
      queryClient.setQueryData(["my-role"], role);
      navigate({ to: homeForRole(role), replace: true });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        redirectByRole(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const dbRole = role === "chef" || role === "grocery" ? "vendor" : role;
        const vendor_type = role === "grocery" ? "grocery" : role === "chef" ? "chef" : null;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role: dbRole, vendor_type, country },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created — welcome!");
        } else {
          toast.success("Registration successful! Please check your email for a confirmation link.");
          setMode("signin"); // switch to signin tab for when they come back
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background image */}
        <img
          src={authHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlays for depth + legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(29,29,27,0.55) 0%, rgba(29,29,27,0.35) 40%, rgba(29,29,27,0.95) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-60"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 100%, #ff4d4d 0%, transparent 55%), radial-gradient(80% 60% at 100% 0%, #facc15 0%, transparent 50%)",
          }}
        />

        {/* Top brand row */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 self-start">
            <Logo className="h-11 w-11 ring-2 ring-white/30 rounded-full" />
            <span className="text-white text-2xl tracking-tight font-display">
              NaijaEats
            </span>
          </Link>

          {/* Bottom editorial block */}
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
              Trusted by 12,000+ food lovers
            </span>
            <h1
              className="mt-5 text-white text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Taste the{" "}
              <span
                className="italic"
                style={{ fontFamily: "'Instrument Serif', serif", color: "#facc15" }}
              >
                culture.
              </span>
              <br />
              Delivered hot.
            </h1>
            <p className="mt-5 text-white/75 text-lg leading-relaxed max-w-md">
              Order from chefs, restaurants and grocers across Nigeria and the UK —
              all on one platform built for African food culture.
            </p>

            {/* Trust row */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[
                  "from-[#ff4d4d] to-[#facc15]",
                  "from-[#84cc16] to-[#facc15]",
                  "from-[#facc15] to-[#ff4d4d]",
                ].map((g, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#1d1d1b]`}
                  />
                ))}
              </div>
              <div className="text-sm text-white/70">
                <div className="flex items-center gap-1 text-[#facc15]">
                  {"★★★★★"}
                </div>
                <div>4.9 · 3,200+ reviews</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
            <Logo className="h-10 w-10" />
            <span className="font-display text-xl font-semibold">Naija Eats</span>
          </Link>

          <h2 className="font-display text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to continue your order." : "Start ordering, selling, or delivering."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-medium hover:bg-muted transition"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wider">
            <div className="h-px flex-1 bg-border" />
            <span>or with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Full name">
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder="Amaka Obi"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="I am a">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as SignupRole)}
                      className="input"
                    >
                      <option value="customer">Customer</option>
                      <option value="chef">Chef</option>
                      <option value="grocery">Groceries Market</option>
                      <option value="rider">Delivery rider</option>
                    </select>
                  </Field>
                  <Field label="Country">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value as "NG" | "UK")}
                      className="input"
                    >
                      <option value="NG">Nigeria</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                  </Field>
                </div>
              </>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-3 font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {mode === "signin" ? "New to Naija Eats?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-[var(--brand-clay)] hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 0.95rem;
        }
        .input:focus { outline: 2px solid var(--brand-clay); outline-offset: 1px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.58 6.58 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
