import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { c as createLovableAuth } from "../_libs/lovable.dev__cloud-auth-js.mjs";
import { u as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { h as homeForRole } from "./useMyRole-CK88GRqg.mjs";
import { L as Logo } from "./Logo-Du-Zai3C.mjs";
import { E as EyeOff, a as Eye } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
const lovableAuth = createLovableAuth();
const lovable = {
  auth: {
    signInWithOAuth: async (provider, opts) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams
        }
      });
      if (result.redirected) {
        return result;
      }
      if (result.error) {
        return result;
      }
      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
const authHero = "/assets/auth-hero-DtbSQAXT.jpg";
function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [fullName, setFullName] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("customer");
  const [country, setCountry] = reactExports.useState("NG");
  const [loading, setLoading] = reactExports.useState(false);
  const [showPassword, setShowPassword] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const redirectByRole = async (uid) => {
      queryClient.removeQueries({
        queryKey: ["my-role"]
      });
      const {
        data
      } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const roles = (data ?? []).map((r) => r.role);
      const role2 = roles.includes("admin") ? "admin" : roles.includes("vendor") ? "vendor" : roles.includes("rider") ? "rider" : "customer";
      queryClient.setQueryData(["my-role"], role2);
      navigate({
        to: homeForRole(role2),
        replace: true
      });
    };
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        redirectByRole(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, queryClient]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              role,
              country
            }
          }
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created — welcome!");
        } else {
          const {
            error: signInError
          } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) throw signInError;
          toast.success("Account created — welcome!");
        }
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin
    });
    if (result.error) toast.error("Google sign-in failed");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground flex", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden lg:flex flex-1 relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: authHero, alt: "", "aria-hidden": "true", className: "absolute inset-0 h-full w-full object-cover" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0", style: {
        background: "linear-gradient(180deg, rgba(29,29,27,0.55) 0%, rgba(29,29,27,0.35) 40%, rgba(29,29,27,0.95) 100%)"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 mix-blend-overlay opacity-60", style: {
        background: "radial-gradient(120% 80% at 0% 100%, #ff4d4d 0%, transparent 55%), radial-gradient(80% 60% at 100% 0%, #facc15 0%, transparent 50%)"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex flex-col justify-between p-12 w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-3 self-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-11 w-11 ring-2 ring-white/30 rounded-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-2xl tracking-tight font-display", children: "NaijaEats" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-[#84cc16]" }),
            "Trusted by 12,000+ food lovers"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-5 text-white text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight", style: {
            fontFamily: "'Space Grotesk', sans-serif"
          }, children: [
            "Taste the",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic", style: {
              fontFamily: "'Instrument Serif', serif",
              color: "#facc15"
            }, children: "culture." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "Delivered hot."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-white/75 text-lg leading-relaxed max-w-md", children: "Order from home chefs, restaurants and grocers across Nigeria and the UK — all on one platform built for African food culture." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex items-center gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex -space-x-3", children: ["from-[#ff4d4d] to-[#facc15]", "from-[#84cc16] to-[#facc15]", "from-[#facc15] to-[#ff4d4d]"].map((g, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-9 w-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#1d1d1b]` }, i)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-white/70", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 text-[#facc15]", children: "★★★★★" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "4.9 · 3,200+ reviews" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex lg:hidden items-center gap-2 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-10 w-10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-xl font-semibold", children: "Naija Eats" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl font-semibold", children: mode === "signin" ? "Welcome back" : "Create your account" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: mode === "signin" ? "Sign in to continue your order." : "Start ordering, selling, or delivering." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: handleGoogle, className: "mt-6 w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-medium hover:bg-muted transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleIcon, {}),
        "Continue with Google"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-6 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wider", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "or with email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: fullName, onChange: (e) => setFullName(e.target.value), className: "input", placeholder: "Amaka Obi" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "I am a", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), className: "input", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "customer", children: "Customer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "vendor", children: "Vendor / Chef" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rider", children: "Delivery rider" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Country", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: country, onChange: (e) => setCountry(e.target.value), className: "input", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "NG", children: "Nigeria" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "UK", children: "United Kingdom" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "input", placeholder: "you@example.com" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: showPassword ? "text" : "password", required: true, minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), className: "input pr-10", placeholder: "••••••••" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPassword((s) => !s), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition", "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-3 font-semibold hover:opacity-90 transition disabled:opacity-50", children: loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center mt-6 text-sm text-muted-foreground", children: [
        mode === "signin" ? "New to Naija Eats?" : "Already have an account?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode(mode === "signin" ? "signup" : "signin"), className: "font-semibold text-[var(--brand-clay)] hover:underline", children: mode === "signin" ? "Create an account" : "Sign in" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 0.95rem;
        }
        .input:focus { outline: 2px solid var(--brand-clay); outline-offset: 1px; }
      ` })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-foreground mb-1.5 block", children: label }),
    children
  ] });
}
function GoogleIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#FBBC05", d: "M5.84 14.1A6.58 6.58 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" })
  ] });
}
export {
  AuthPage as component
};
