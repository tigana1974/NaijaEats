import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { C as CustomerShell } from "./CustomerShell-Z8l-rfuQ.mjs";
import { F as FoodCard, V as VendorCard } from "./customer-ui-mFvR0Vpm.mjs";
import { e as Route$w } from "./router-LlhGIoeI.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { X as Leaf, Y as Apple, Z as Coffee, _ as Milk } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__react-router.mjs";
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
import "./Logo-Du-Zai3C.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
const GROCERY_CATEGORIES = [{
  id: "produce",
  label: "Produce",
  Icon: Leaf
}, {
  id: "pantry",
  label: "Pantry",
  Icon: Apple
}, {
  id: "beverages",
  label: "Drinks",
  Icon: Coffee
}, {
  id: "dairy",
  label: "Dairy",
  Icon: Milk
}];
function GroceriesPage() {
  const {
    user
  } = Route$w.useRouteContext();
  const [country, setCountry] = reactExports.useState("NG");
  const [activeCategory, setActiveCategory] = reactExports.useState(null);
  const {
    data: profile
  } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).maybeSingle();
      return data ?? null;
    }
  });
  const {
    data: vendors,
    isLoading: vendorsLoading
  } = useQuery({
    queryKey: ["groceries-vendors", country],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("vendors").select("*").eq("status", "approved").eq("country", country).eq("type", "grocery").order("is_featured", {
        ascending: false
      }).order("rating", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: items,
    isLoading: itemsLoading
  } = useQuery({
    queryKey: ["groceries-items", country, activeCategory],
    queryFn: async () => {
      let q = supabase.from("menu_items").select("id, name, price, image_url, is_available, is_featured, vendor:vendors!inner(id, slug, name, currency, country, status, type)").eq("is_available", true).order("is_featured", {
        ascending: false
      }).limit(24);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return (data ?? []).filter((it) => it.vendor?.country === country && it.vendor?.status === "approved" && it.vendor?.type === "grocery");
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 py-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold truncate text-zinc-900", children: "Groceries" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CountryToggle, { value: country, onChange: setCountry })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3 lg:grid lg:grid-cols-[1fr] lg:gap-8 max-w-3xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0", children: GROCERY_CATEGORIES.map((cat) => {
      const Icon = cat.Icon;
      const active = activeCategory === cat.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveCategory(active ? null : cat.id), className: `flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${active ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/25 -translate-y-0.5" : "bg-white ring-1 ring-zinc-200/80 text-zinc-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
        " ",
        cat.label
      ] }, cat.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { title: activeCategory ? "Category Results" : "Fresh Daily" }),
      itemsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3", children: Array.from({
        length: 4
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/5] rounded-[1.75rem] bg-zinc-100 animate-pulse" }, i)) }) : (items ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "No items available right now", hint: "Vendors will list groceries soon." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3", children: (items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsx(FoodCard, { vendorSlug: it.vendor.slug, itemId: it.id, name: it.name, imageUrl: it.image_url, priceLabel: `${it.vendor.currency === "GBP" ? "£" : "₦"}${Number(it.price).toLocaleString()}`, vendorName: it.vendor.name, badge: it.is_featured ? "Top" : void 0 }, it.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { title: "Top Stores" }),
      vendorsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2", children: Array.from({
        length: 2
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[16/10] rounded-[2rem] bg-zinc-100 animate-pulse" }, i)) }) : (vendors ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "No stores yet", hint: `Check back soon as we expand in ${country === "NG" ? "Nigeria" : "the UK"}.` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2", children: (vendors ?? []).map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VendorCard, { slug: v.slug, name: v.name, coverUrl: v.cover_image_url, city: v.city, rating: v.rating, prepMinutes: v.prep_time_minutes, deliveryLabel: `Delivery ${v.currency === "GBP" ? "£" : "₦"}${Number(v.delivery_fee || 0).toLocaleString()}`, isFeatured: v.is_featured }, v.id)) })
    ] })
  ] }) }) });
}
function SectionHeader({
  title
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-1 rounded-full bg-gradient-to-b from-[var(--brand-clay)] to-[#ff6b35]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-bold text-zinc-900 tracking-tight", children: title })
  ] });
}
function EmptyState({
  title,
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-[1.75rem] border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50/80 to-white p-8 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-zinc-700", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-sm text-zinc-500 leading-relaxed", children: hint })
  ] });
}
function CountryToggle({
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-flex h-11 w-[100px] shrink-0 items-center rounded-full bg-zinc-100 p-1 shadow-inner", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-1 bottom-1 w-[44px] rounded-full bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${value === "UK" ? "translate-x-[48px]" : "translate-x-0"}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange("NG"), className: `relative z-10 flex flex-1 items-center justify-center rounded-full transition-opacity duration-300 ${value === "NG" ? "opacity-100" : "opacity-50 hover:opacity-80"}`, "aria-label": "Switch to Nigeria", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "https://flagcdn.com/w40/ng.png", alt: "NG", className: "h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange("UK"), className: `relative z-10 flex flex-1 items-center justify-center rounded-full transition-opacity duration-300 ${value === "UK" ? "opacity-100" : "opacity-50 hover:opacity-80"}`, "aria-label": "Switch to United Kingdom", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "https://flagcdn.com/w40/gb.png", alt: "UK", className: "h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5" }) })
  ] });
}
export {
  GroceriesPage as component
};
