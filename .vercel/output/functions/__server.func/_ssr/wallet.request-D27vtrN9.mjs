import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, l as ArrowDownLeft, t as Copy, u as Share2 } from "../_libs/lucide-react.mjs";
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
import "./router-Ck7azls6.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./client-DVFnSlur.mjs";
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
function RequestPage() {
  const navigate = useNavigate();
  const [from, setFrom] = reactExports.useState("");
  const [amount, setAmount] = reactExports.useState(5e3);
  const [reason, setReason] = reactExports.useState("Split bill — pepper soup night");
  const [link, setLink] = reactExports.useState(null);
  const generate = () => {
    if (!amount || amount < 100) return toast.error("Minimum request is ₦100");
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setLink(`https://naijaeats.app/pay/${code}`);
    toast.success("Payment link ready");
  };
  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };
  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({
        title: "Payment request",
        text: `Please send ${fmt(amount)} — ${reason}`,
        url: link
      });
    } else {
      copy();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/wallet", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Wallet"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold", children: "Request" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight mt-1", children: "Ask to be paid" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Generate a one-time link to collect from anyone." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_100%,oklch(0.75_0.18_55/0.55),transparent_55%),linear-gradient(140deg,#1a1208,#3a230d_60%,#8a5a1f)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[var(--brand-gold)]/30 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-white/70", children: "Requesting" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-2xl text-white/70", children: "₦" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: amount || "", onChange: (e) => {
          setAmount(Number(e.target.value));
          setLink(null);
        }, className: "w-full bg-transparent font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30", placeholder: "0", inputMode: "numeric" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground mb-1.5", children: "From (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: from, onChange: (e) => setFrom(e.target.value), placeholder: "Name, @handle or phone", className: "h-11 rounded-2xl" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground mb-1.5", children: "What for?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: reason, onChange: (e) => setReason(e.target.value), rows: 2, className: "rounded-2xl resize-none" })
      ] })
    ] }),
    !link ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: generate, className: "mt-6 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base", children: [
      "Generate request link ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { className: "h-4 w-4" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider text-muted-foreground", children: "Share this link" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-sm break-all", children: link })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: copy, variant: "outline", className: "h-12 rounded-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }),
          " Copy"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: share, className: "h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }),
          " Share"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "w-full", onClick: () => navigate({
        to: "/wallet"
      }), children: "Done" })
    ] })
  ] }) });
}
export {
  RequestPage as component
};
