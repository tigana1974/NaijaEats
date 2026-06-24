import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { B as Button } from "./button-BC9oXVxV.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { g as Route$s } from "./router-Ck7azls6.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, k as Plus, a0 as MapPin, b as Star, q as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/react-icons.mjs";
import "./Logo-Du-Zai3C.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
function AddressesPage() {
  const {
    user
  } = Route$s.useRouteContext();
  const qc = useQueryClient();
  const {
    data: addresses,
    isLoading
  } = useQuery({
    queryKey: ["addresses", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", {
        ascending: false
      }).order("created_at", {
        ascending: false
      });
      return data ?? [];
    }
  });
  const [showForm, setShowForm] = reactExports.useState(false);
  const [label, setLabel] = reactExports.useState("");
  const [line1, setLine1] = reactExports.useState("");
  const [line2, setLine2] = reactExports.useState("");
  const [city, setCity] = reactExports.useState("");
  const [postcode, setPostcode] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const reset = () => {
    setLabel("");
    setLine1("");
    setLine2("");
    setCity("");
    setPostcode("");
  };
  const add = async (e) => {
    e.preventDefault();
    if (!line1 || !city) return toast.error("Address line and city are required");
    setSaving(true);
    const {
      data: profile
    } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
    const {
      error
    } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: label || null,
      line1,
      line2: line2 || null,
      city,
      postcode: postcode || null,
      country: profile?.country ?? "NG",
      is_default: !addresses || addresses.length === 0
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    reset();
    setShowForm(false);
    await qc.invalidateQueries({
      queryKey: ["addresses", user.id]
    });
    toast.success("Address added");
  };
  const makeDefault = async (id) => {
    await supabase.from("addresses").update({
      is_default: false
    }).eq("user_id", user.id);
    const {
      error
    } = await supabase.from("addresses").update({
      is_default: true
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({
      queryKey: ["addresses", user.id]
    });
    toast.success("Default address updated");
  };
  const remove = async (id) => {
    const {
      error
    } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({
      queryKey: ["addresses", user.id]
    });
    toast.success("Address removed");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/account", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
      " Back"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold", children: "Addresses" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => setShowForm((v) => !v), className: "rounded-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " ",
        showForm ? "Cancel" : "Add"
      ] })
    ] }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: add, className: "mt-4 space-y-3 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Label" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: label, onChange: (e) => setLabel(e.target.value), placeholder: "Home, Office…" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Address line 1*" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: line1, onChange: (e) => setLine1(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Address line 2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: line2, onChange: (e) => setLine2(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "City*" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: city, onChange: (e) => setCity(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Postcode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: postcode, onChange: (e) => setPostcode(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: saving, className: "w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90", children: saving ? "Saving…" : "Save address" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-6 space-y-3", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-sm text-muted-foreground", children: "Loading…" }) : addresses && addresses.length > 0 ? addresses.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "rounded-2xl border border-border bg-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: a.label || "Address" }),
          a.is_default && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider font-semibold bg-[var(--brand-gold)]/20 text-[var(--brand-clay)] rounded-full px-2 py-0.5", children: "Default" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5 truncate", children: [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
          !a.is_default && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => makeDefault(a.id), className: "rounded-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5" }),
            " Make default"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => remove(a.id), className: "rounded-full text-[var(--brand-clay)] hover:text-[var(--brand-clay)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
            " Remove"
          ] })
        ] })
      ] })
    ] }) }, a.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "No addresses yet. Add one to speed up checkout." }) })
  ] }) });
}
export {
  AddressesPage as component
};
