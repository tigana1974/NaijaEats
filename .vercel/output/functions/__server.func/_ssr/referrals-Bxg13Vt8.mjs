import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { C as ComingSoonBanner } from "./ComingSoonBanner-D-xj4pKS.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, j as Sparkles, G as Gift, t as Copy, u as Share2, v as Users, w as Check, x as Trophy, y as UtensilsCrossed, z as MessageCircle, M as Mail, k as Plus, D as Clock } from "../_libs/lucide-react.mjs";
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
const STORAGE_KEY = "naijaeats.referrals";
const CODE_KEY = "naijaeats.referralCode";
const GOAL = 5;
const fmt = (n) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(n);
function loadCode() {
  if (typeof window === "undefined") return "JOLLOF24";
  let c = localStorage.getItem(CODE_KEY);
  if (!c) {
    c = "EAT" + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem(CODE_KEY, c);
  }
  return c;
}
function ReferralsPage() {
  const [referrals, setReferrals] = reactExports.useState([]);
  const [name, setName] = reactExports.useState("");
  const [contact, setContact] = reactExports.useState("");
  const [code, setCode] = reactExports.useState("JOLLOF24");
  reactExports.useEffect(() => {
    setCode(loadCode());
    try {
      setReferrals(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      setReferrals([]);
    }
  }, []);
  const persist = (next) => {
    setReferrals(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const link = `https://naijaeats.app/join?ref=${code}`;
  const stats = reactExports.useMemo(() => {
    const ordered = referrals.filter((r) => r.status === "ordered");
    const joined = referrals.filter((r) => r.status !== "invited").length;
    const reward = ordered.reduce((sum, r) => sum + Math.min(r.orderTotal ?? 0, 8e3), 0);
    return {
      ordered: ordered.length,
      joined,
      reward
    };
  }, [referrals]);
  const progress = Math.min(stats.ordered / GOAL, 1);
  const unlocked = stats.ordered >= GOAL;
  const invite = () => {
    if (!name.trim() || !contact.trim()) return toast.error("Add a name and contact");
    const r = {
      id: crypto.randomUUID(),
      name: name.trim(),
      contact: contact.trim(),
      status: "invited",
      invitedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    persist([r, ...referrals]);
    setName("");
    setContact("");
    toast.success(`Invite sent to ${r.name}`);
  };
  const advance = (id) => {
    persist(referrals.map((r) => {
      if (r.id !== id) return r;
      if (r.status === "invited") return {
        ...r,
        status: "joined"
      };
      if (r.status === "joined") return {
        ...r,
        status: "ordered",
        orderTotal: 5500 + Math.floor(Math.random() * 4e3)
      };
      return r;
    }));
  };
  const copy = async (text, label = "Copied") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };
  const share = async () => {
    const text = `I'm loving Naija Eats — heritage meals from real Buka chefs. Join with my code ${code} and we both eat free 🍲`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Naija Eats",
          text,
          url: link
        });
      } catch {
      }
    } else {
      copy(`${text} ${link}`, "Invite copied — paste anywhere");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-16", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/wallet", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Wallet"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ComingSoonBanner, { feature: "Referrals" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-4 overflow-hidden rounded-[32px] p-7 sm:p-9 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(110%_110%_at_0%_0%,oklch(0.85_0.17_90/0.55),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(150deg,#1a1108,#3a1a14_55%,#7c2d12)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[var(--brand-gold)]/30 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] font-semibold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 text-[var(--brand-gold)]" }),
          " Refer & feast"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-3xl sm:text-5xl font-semibold tracking-tight mt-3 leading-[1.05]", children: [
          "Invite 5 friends.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "Eat on us."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm sm:text-base text-white/80 mt-3 max-w-md", children: "For every friend who orders, we credit your wallet up to ₦8,000 toward your next meal. Hit 5 and unlock a full feast on the house." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-white/70", children: "Progress" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-display text-sm tabular-nums", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-semibold", children: stats.ordered }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/60", children: [
                " / ",
                GOAL
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 rounded-full bg-white/15 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-[var(--brand-gold)] to-white transition-all duration-700", style: {
            width: `${progress * 100}%`
          } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between text-xs text-white/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: unlocked ? "🎉 Free feast unlocked!" : `${GOAL - stats.ordered} more to a free feast` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-3 w-3" }),
              " ",
              fmt(stats.reward),
              " earned"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 backdrop-blur p-2 pl-4 border border-white/15", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.18em] text-white/60", children: "Your code" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-lg font-semibold tracking-[0.2em] truncate", children: code })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => copy(code, "Code copied"), className: "h-10 px-3 rounded-xl bg-white/15 hover:bg-white/25 transition inline-flex items-center gap-1.5 text-sm font-medium shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }),
              " Copy"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: share, className: "h-10 px-3 rounded-xl bg-[var(--brand-gold)] text-foreground hover:opacity-90 transition inline-flex items-center gap-1.5 text-sm font-semibold shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4" }),
              " Share"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { Icon: Users, label: "Invited", value: referrals.length, tone: "clay" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { Icon: Check, label: "Joined", value: stats.joined, tone: "forest" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { Icon: Trophy, label: "Ordered", value: stats.ordered, tone: "gold" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "How it works" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid sm:grid-cols-3 gap-3", children: [{
        Icon: Share2,
        title: "Share your code",
        body: "Send it to family on WhatsApp or socials."
      }, {
        Icon: UtensilsCrossed,
        title: "They order",
        body: "Friend gets ₦2,000 off their first meal."
      }, {
        Icon: Gift,
        title: "You get rewarded",
        body: "Up to ₦8,000 in wallet credit per friend."
      }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium mt-3", children: s.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-1", children: s.body })
      ] }, s.title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 rounded-3xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-semibold", children: "Invite directly" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "We'll text or email them your code." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-xl bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-xl bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid sm:grid-cols-[1fr_1fr_auto] gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Friend's name", className: "h-11 rounded-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: contact, onChange: (e) => setContact(e.target.value), placeholder: "Phone or email", className: "h-11 rounded-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: invite, className: "h-11 rounded-2xl bg-foreground text-background hover:bg-foreground/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Invite"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "Your invites" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          referrals.length,
          " total"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-3xl border border-border bg-card overflow-hidden", children: referrals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-gold)]/30 text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-medium", children: "No invites yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Share your code to start earning free meals." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: referrals.map((r) => {
        const tone = r.status === "ordered" ? "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]" : r.status === "joined" ? "bg-[var(--brand-gold)]/30 text-foreground" : "bg-muted text-muted-foreground";
        const Icon = r.status === "ordered" ? Trophy : r.status === "joined" ? Check : Clock;
        const reward = r.status === "ordered" ? Math.min(r.orderTotal ?? 0, 8e3) : 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 px-4 sm:px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: r.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
              r.contact,
              " · ",
              r.status === "ordered" ? `Ordered ${fmt(r.orderTotal ?? 0)}` : r.status === "joined" ? "Joined — yet to order" : "Invite pending"
            ] })
          ] }),
          reward > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-sm font-semibold text-[var(--brand-forest)] tabular-nums", children: [
            "+",
            fmt(reward)
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => advance(r.id), className: "text-[var(--brand-clay)]", children: r.status === "invited" ? "Mark joined" : "Mark ordered" })
        ] }, r.id);
      }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-[11px] text-muted-foreground text-center max-w-md mx-auto", children: "Rewards credit to your Naija Eats wallet within 24 hours of your friend's first order. Max ₦8,000 per friend." })
  ] }) });
}
function StatCard({
  Icon,
  label,
  value,
  tone
}) {
  const bg = tone === "clay" ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : tone === "gold" ? "bg-[var(--brand-gold)]/30 text-foreground" : "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-9 w-9 place-items-center rounded-xl ${bg}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-2xl font-semibold tabular-nums mt-3", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5", children: label })
  ] });
}
export {
  ReferralsPage as component
};
