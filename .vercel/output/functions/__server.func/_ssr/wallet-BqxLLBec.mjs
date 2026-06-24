import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { C as ComingSoonBanner } from "./ComingSoonBanner-D-xj4pKS.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { h as ShieldCheck, a as Eye, E as EyeOff, i as TrendingUp, W as Wifi, j as Sparkles, k as Plus, g as Send, l as ArrowDownLeft, G as Gift, f as ChevronRight, R as Receipt, m as Repeat, n as ArrowUpRight } from "../_libs/lucide-react.mjs";
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
const txns = [{
  id: 1,
  title: "Mama Put Buka",
  sub: "Order #NE-2843",
  amount: -4500,
  when: "Today · 1:24pm",
  kind: "out",
  Icon: Receipt
}, {
  id: 2,
  title: "Wallet top-up",
  sub: "GTBank •• 4421",
  amount: 25e3,
  when: "Today · 9:02am",
  kind: "in",
  Icon: Plus
}, {
  id: 3,
  title: "Refund — Suya Spot",
  sub: "Order cancelled",
  amount: 3200,
  when: "Yesterday",
  kind: "in",
  Icon: Repeat
}, {
  id: 4,
  title: "Sent to Tunde",
  sub: "Split bill · pepper soup",
  amount: -2e3,
  when: "Yesterday",
  kind: "out",
  Icon: Send
}, {
  id: 5,
  title: "Cashback reward",
  sub: "Loyalty tier · Gold",
  amount: 850,
  when: "Mon",
  kind: "in",
  Icon: Gift
}];
const fmt = (n) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(n);
function WalletPage() {
  const [hidden, setHidden] = reactExports.useState(false);
  const balance = 184250;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 pb-16", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ComingSoonBanner, { feature: "Wallet" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold", children: "Wallet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1", children: "Your balance" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-[var(--brand-forest)]" }),
        " Secured"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -inset-x-2 -bottom-2 h-24 rounded-3xl bg-[var(--brand-gold)]/30 blur-2xl -z-10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.6),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1d1d1b,#3a1a14_60%,#7c2d12)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-white/70", children: "Available balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-end gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-4xl sm:text-5xl font-semibold tabular-nums", children: hidden ? "•••••••" : fmt(balance) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setHidden((v) => !v), className: "mb-2 grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25 transition", "aria-label": "Toggle balance", children: hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1.5 text-xs text-white/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3.5 w-3.5 text-[var(--brand-gold)]" }),
              "+12% spent on heritage meals this month"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-6 w-6 rotate-90 text-white/70" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex items-end justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.18em] text-white/60", children: "Naija Eats · Wallet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-mono text-sm tracking-[0.25em] text-white/90", children: hidden ? "•••• •••• •••• 4421" : "4924 ·· 8810 ·· 4421" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.18em] text-white/60", children: "Tier" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold)] text-foreground px-2.5 py-1 text-xs font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
              " Gold"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid grid-cols-4 gap-2 sm:gap-3", children: [{
      label: "Top up",
      Icon: Plus,
      to: "/wallet/top-up"
    }, {
      label: "Send",
      Icon: Send,
      to: "/wallet/send"
    }, {
      label: "Request",
      Icon: ArrowDownLeft,
      to: "/wallet/request"
    }, {
      label: "Rewards",
      Icon: Gift,
      to: "/referrals"
    }].map(({
      label,
      Icon,
      to
    }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "group flex flex-col items-center gap-2 rounded-2xl bg-card border border-border py-4 hover:border-foreground/40 hover:shadow-sm transition", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-11 w-11 place-items-center rounded-2xl bg-foreground text-background group-hover:bg-[var(--brand-clay)] transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: label })
    ] }, label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Spent this month", value: fmt(48200), hint: "Across 14 orders", tone: "clay" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Saved with rewards", value: fmt(6450), hint: "Gold tier · 5% back", tone: "gold" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Pending refunds", value: fmt(3200), hint: "Arrives in 2 days", tone: "forest" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl sm:text-2xl font-semibold tracking-tight", children: "Recent activity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "text-sm font-medium text-foreground/70 hover:text-foreground inline-flex items-center gap-1", children: [
        "All ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-3xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: txns.map((t) => {
      const out = t.kind === "out";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-muted/40 transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${out ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]"}`, children: out ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(t.Icon, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm truncate", children: t.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            t.sub,
            " · ",
            t.when
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `shrink-0 text-right font-semibold tabular-nums text-sm ${out ? "text-foreground" : "text-[var(--brand-forest)]"}`, children: [
          out ? "−" : "+",
          fmt(Math.abs(t.amount))
        ] })
      ] }, t.id);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-[linear-gradient(135deg,oklch(0.85_0.17_90/0.35),oklch(0.66_0.245_25/0.18))] border border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-[var(--brand-clay)]/20 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative grid sm:grid-cols-[1fr_auto] items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold", children: "Gold tier perks" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl sm:text-2xl font-semibold mt-1", children: "Top up ₦20k, get ₦2k free." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1 max-w-md", children: "Boost your wallet this week and unlock chef booking discounts up to 15%." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "h-11 rounded-2xl bg-foreground text-background hover:bg-foreground/90", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/wallet/top-up", children: [
          "Top up now ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" })
        ] }) })
      ] })
    ] })
  ] }) });
}
function StatCard({
  label,
  value,
  hint,
  tone
}) {
  const dot = tone === "clay" ? "bg-[var(--brand-clay)]" : tone === "gold" ? "bg-[var(--brand-gold)]" : "bg-[var(--brand-forest)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${dot}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium", children: label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-xl sm:text-2xl font-semibold mt-2 tabular-nums", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: hint })
  ] });
}
export {
  WalletPage as component
};
