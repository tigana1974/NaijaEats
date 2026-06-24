import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { V as VendorCard, F as FoodCard } from "./customer-ui-mFvR0Vpm.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { r as Store, U as Utensils, S as Search, s as ArrowLeft } from "../_libs/lucide-react.mjs";
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
import "./router-Ck7azls6.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./Logo-Du-Zai3C.mjs";
const POPULAR_SEARCHES = ["Jollof Rice", "Suya", "Plantain", "Shawarma", "Burger"];
function SearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = reactExports.useState("");
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);
  const {
    data: vendors,
    isLoading: vendorsLoading
  } = useQuery({
    queryKey: ["search-vendors", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const {
        data,
        error
      } = await supabase.from("vendors").select("*").eq("status", "approved").ilike("name", `%${search.trim()}%`).order("rating", {
        ascending: false
      }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: search.trim().length > 1
  });
  const {
    data: items,
    isLoading: itemsLoading
  } = useQuery({
    queryKey: ["search-items", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const {
        data,
        error
      } = await supabase.from("menu_items").select("id, name, price, image_url, is_available, is_featured, vendor:vendors!inner(id, slug, name, currency, country, status)").eq("is_available", true).ilike("name", `%${search.trim()}%`).limit(20);
      if (error) throw error;
      return (data ?? []).filter((it) => it.vendor?.status === "approved");
    },
    enabled: search.trim().length > 1
  });
  const hasResults = (vendors?.length ?? 0) > 0 || (items?.length ?? 0) > 0;
  const isSearching = search.trim().length > 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 w-full py-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate({
      to: "/discover"
    }), className: "shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5 text-zinc-700" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--brand-clay)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: inputRef, value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search for dishes or stores...", className: "w-full rounded-full bg-zinc-50 border-transparent ring-1 ring-zinc-200 pl-10 pr-4 py-2.5 text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] transition" })
    ] })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-6 lg:max-w-3xl lg:mx-auto space-y-8", children: !isSearching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold text-zinc-900 mb-4", children: "Popular Searches" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: POPULAR_SEARCHES.map((term) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSearch(term), className: "px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition", children: term }, term)) })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    (vendorsLoading || vendors && vendors.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-5 w-5 text-zinc-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold text-zinc-900", children: "Stores" })
      ] }),
      vendorsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2", children: Array.from({
        length: 2
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[5/3] rounded-3xl bg-zinc-100 animate-pulse" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2", children: (vendors ?? []).map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VendorCard, { slug: v.slug, name: v.name, coverUrl: v.cover_image_url, city: v.city, rating: v.rating, prepMinutes: v.prep_time_minutes, deliveryLabel: `Delivery ${v.currency === "GBP" ? "£" : "₦"}${Number(v.delivery_fee || 0).toLocaleString()}`, isFeatured: v.is_featured }, v.id)) })
    ] }),
    (itemsLoading || items && items.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Utensils, { className: "h-5 w-5 text-zinc-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold text-zinc-900", children: "Dishes" })
      ] }),
      itemsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-2 sm:grid-cols-3", children: Array.from({
        length: 3
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/5] rounded-3xl bg-zinc-100 animate-pulse" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-2 sm:grid-cols-3", children: (items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsx(FoodCard, { vendorSlug: it.vendor.slug, itemId: it.id, name: it.name, imageUrl: it.image_url, priceLabel: `${it.vendor.currency === "GBP" ? "£" : "₦"}${Number(it.price).toLocaleString()}`, vendorName: it.vendor.name, badge: it.is_featured ? "Top" : void 0 }, it.id)) })
    ] }),
    !vendorsLoading && !itemsLoading && !hasResults && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-8 w-8 text-zinc-300 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-zinc-700", children: "No results found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-zinc-500", children: [
        `We couldn't find anything matching "`,
        search,
        '". Try searching for something else.'
      ] })
    ] })
  ] }) }) });
}
export {
  SearchPage as component
};
