import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, S as Search, h as ShieldCheck, g as Send } from "../_libs/lucide-react.mjs";
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
const RECENT = [{
  id: "1",
  name: "Tunde A.",
  handle: "@tunde",
  initials: "TA",
  tone: "clay"
}, {
  id: "2",
  name: "Amaka O.",
  handle: "@amaka",
  initials: "AO",
  tone: "forest"
}, {
  id: "3",
  name: "Bola K.",
  handle: "@bola",
  initials: "BK",
  tone: "gold"
}, {
  id: "4",
  name: "Chinedu",
  handle: "@chi",
  initials: "CN",
  tone: "clay"
}];
function SendPage() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [amount, setAmount] = reactExports.useState(2e3);
  const [note, setNote] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const filtered = RECENT.filter((r) => (r.name + r.handle).toLowerCase().includes(search.toLowerCase()));
  const submit = async () => {
    if (!recipient) return toast.error("Pick a recipient");
    if (!amount || amount < 100) return toast.error("Minimum send is ₦100");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Sent ${fmt(amount)} to ${recipient}`);
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold", children: "Send" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight mt-1", children: "Send to friends" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Split a bill or surprise someone with jollof." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search name, @handle or phone", className: "pl-9 h-11 rounded-2xl" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground mb-3", children: "Recent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 overflow-x-auto pb-2 -mx-1 px-1", children: filtered.map((r) => {
        const active = recipient === r.name;
        const bg = r.tone === "clay" ? "bg-[var(--brand-clay)]/15 text-[var(--brand-clay)]" : r.tone === "forest" ? "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]" : "bg-[var(--brand-gold)]/30 text-foreground";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setRecipient(r.name), className: "flex flex-col items-center gap-1.5 shrink-0 w-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-14 w-14 place-items-center rounded-full font-display text-lg font-semibold ${bg} ${active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`, children: r.initials }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium truncate w-full text-center", children: r.name.split(" ")[0] })
        ] }, r.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-5 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.75_0.15_160/0.6),transparent_55%),linear-gradient(140deg,#0d2a1f,#14463a_60%,#1f6d52)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-[0.18em] text-white/70", children: recipient ? `To ${recipient}` : "Amount" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-2xl text-white/70", children: "₦" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: amount || "", onChange: (e) => setAmount(Number(e.target.value)), className: "w-full bg-transparent font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30", placeholder: "0", inputMode: "numeric" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Note (optional)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: note, onChange: (e) => setNote(e.target.value), rows: 2, placeholder: "For the suya last night 🌶️", className: "rounded-2xl resize-none" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-[var(--brand-forest)]" }),
      " Transfers are instant and free between users."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submit, disabled: loading, className: "mt-5 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base", children: loading ? "Sending…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      "Send ",
      fmt(amount || 0),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
    ] }) })
  ] }) });
}
export {
  SendPage as component
};
