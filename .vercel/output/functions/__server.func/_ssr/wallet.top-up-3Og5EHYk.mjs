import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, j as Sparkles, J as CreditCard, a9 as Building2, H as Wallet, h as ShieldCheck, k as Plus } from "../_libs/lucide-react.mjs";
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
import "../_libs/react-icons.mjs";
import "./router-LlhGIoeI.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./client-BLGsQl0B.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./Logo-Du-Zai3C.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
const fmt = (n) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(n);
const PRESETS = [5e3, 1e4, 2e4, 5e4, 1e5];
const METHODS = [{
  id: "card",
  label: "Debit card",
  sub: "Visa, Mastercard, Verve",
  Icon: CreditCard
}, {
  id: "bank",
  label: "Bank transfer",
  sub: "Instant via NIP",
  Icon: Building2
}, {
  id: "ussd",
  label: "USSD",
  sub: "Dial *737#",
  Icon: Wallet
}];
function TopUpPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = reactExports.useState(2e4);
  const [method, setMethod] = reactExports.useState("card");
  const [loading, setLoading] = reactExports.useState(false);
  const bonus = amount >= 2e4 ? Math.round(amount * 0.1) : 0;
  const submit = async () => {
    if (!amount || amount < 500) return toast.error("Minimum top-up is ₦500");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success(`Topped up ${fmt(amount)}${bonus ? ` + ${fmt(bonus)} bonus` : ""}`);
    navigate({
      to: "/wallet"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/wallet", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Wallet"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold", children: "Top up" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight mt-1", children: "Add to your wallet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Instant credit, secured by Naija Eats." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.6),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1d1d1b,#3a1a14_60%,#7c2d12)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-white/70", children: "Amount" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-2xl text-white/70", children: "₦" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: amount || "", onChange: (e) => setAmount(Number(e.target.value)), className: "w-full bg-transparent font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30", placeholder: "0", inputMode: "numeric" })
      ] }),
      bonus > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-gold)] text-foreground px-2.5 py-1 text-xs font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
        " +",
        fmt(bonus),
        " Gold bonus"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid grid-cols-3 gap-2", children: PRESETS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAmount(p), className: `rounded-2xl border py-3 text-sm font-medium transition ${amount === p ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/40"}`, children: fmt(p) }, p)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Pay with" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMethod(m.id), className: `w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${method === m.id ? "border-foreground bg-muted/40" : "border-border bg-card hover:border-foreground/30"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(m.Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: m.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: m.sub })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-4 w-4 rounded-full border-2 ${method === m.id ? "border-foreground bg-foreground" : "border-muted-foreground/40"}` })
      ] }, m.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-[var(--brand-forest)]" }),
      "256-bit encrypted · PCI-DSS compliant"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submit, disabled: loading, className: "mt-5 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base", children: loading ? "Processing…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      "Top up ",
      fmt(amount || 0),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
    ] }) })
  ] }) });
}
export {
  TopUpPage as component
};
