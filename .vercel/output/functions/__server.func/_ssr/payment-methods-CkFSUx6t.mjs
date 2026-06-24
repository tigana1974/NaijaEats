import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, k as Plus, H as Wallet, J as CreditCard, q as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
const STORAGE_KEY = "naijaeats.paymentMethods";
function PaymentMethodsPage() {
  const [cards, setCards] = reactExports.useState([]);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [holder, setHolder] = reactExports.useState("");
  const [number, setNumber] = reactExports.useState("");
  const [exp, setExp] = reactExports.useState("");
  reactExports.useEffect(() => {
    try {
      setCards(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      setCards([]);
    }
  }, []);
  const persist = (next) => {
    setCards(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const detectBrand = (n) => {
    const d = n.replace(/\D/g, "");
    if (/^4/.test(d)) return "Visa";
    if (/^5[1-5]/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (/^5061|^5078|^6500/.test(d)) return "Verve";
    return "Card";
  };
  const add = (e) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length < 12) return toast.error("Enter a valid card number");
    if (!/^\d{2}\/\d{2}$/.test(exp)) return toast.error("Expiry must be MM/YY");
    const card = {
      id: crypto.randomUUID(),
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      exp,
      holder: holder || "Cardholder"
    };
    persist([card, ...cards]);
    setHolder("");
    setNumber("");
    setExp("");
    setShowForm(false);
    toast.success("Card saved");
  };
  const remove = (id) => {
    persist(cards.filter((c) => c.id !== id));
    toast.success("Card removed");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/account", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Back"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold", children: "Payment Methods" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => setShowForm((v) => !v), className: "rounded-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " ",
        showForm ? "Cancel" : "Add"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/wallet", className: "mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-[var(--brand-clay)]/40 transition", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Naija Eats Wallet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Top up and pay instantly" })
      ] })
    ] }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: add, className: "mt-4 space-y-3 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Cardholder name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: holder, onChange: (e) => setHolder(e.target.value), placeholder: "Name on card" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Card number" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: number, onChange: (e) => setNumber(e.target.value), placeholder: "1234 5678 9012 3456", inputMode: "numeric" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Expiry (MM/YY)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: exp, onChange: (e) => setExp(e.target.value), placeholder: "04/28" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "Cards are stored locally on this device for demo purposes." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90", children: "Save card" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-6 space-y-3", children: cards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "No saved cards yet." }) : cards.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium", children: [
          c.brand,
          " •• ",
          c.last4
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          c.holder,
          " · Exp ",
          c.exp
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => remove(c.id), className: "text-[var(--brand-clay)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
    ] }, c.id)) })
  ] }) });
}
export {
  PaymentMethodsPage as component
};
