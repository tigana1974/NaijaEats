import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as IoSearch, i as IoFastFood, j as IoBasket, k as IoRestaurant } from "../_libs/react-icons.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { C as CustomerShell, a as CustomerLocationHeader } from "./CustomerShell-DwqKtSA4.mjs";
import { a as FeaturedPromoCard, b as FoodCategoryChips, F as FoodCard, V as VendorCard } from "./customer-ui-mFvR0Vpm.mjs";
import { f as Route$v } from "./router-Ck7azls6.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { f as ChevronRight } from "../_libs/lucide-react.mjs";
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
import "./Logo-Du-Zai3C.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
const TYPE_OPTIONS = [{
  key: "restaurant",
  label: "Restaurants",
  Icon: IoFastFood
}, {
  key: "grocery",
  label: "Grocery",
  Icon: IoBasket
}, {
  key: "chef",
  label: "Chefs",
  Icon: IoRestaurant
}];
function DiscoverPage() {
  const {
    user
  } = Route$v.useRouteContext();
  const [country, setCountry] = reactExports.useState("NG");
  const [typeFilter, setTypeFilter] = reactExports.useState(null);
  const {
    data: profile
  } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).maybeSingle();
      return data;
    }
  });
  const {
    data: vendors,
    isLoading: vendorsLoading
  } = useQuery({
    queryKey: ["discover-vendors", country, typeFilter],
    queryFn: async () => {
      let q = supabase.from("vendors").select("*").eq("status", "approved").eq("country", country).order("is_featured", {
        ascending: false
      }).order("rating", {
        ascending: false
      });
      if (typeFilter === "chef") {
        q = q.in("type", ["home_chef", "personal_chef"]);
      } else if (typeFilter) {
        q = q.eq("type", typeFilter);
      }
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: featuredItems,
    isLoading: itemsLoading
  } = useQuery({
    queryKey: ["discover-featured-items", country],
    queryFn: async () => {
      let q = supabase.from("menu_items").select("id, name, price, image_url, is_available, is_featured, description, vendor:vendors!inner(id, slug, name, currency, country, status)").eq("is_available", true).order("is_featured", {
        ascending: false
      }).limit(24);
      const {
        data,
        error
      } = await q;
      if (error) throw error;
      return (data ?? []).filter((it) => it.vendor?.country === country && it.vendor?.status === "approved");
    }
  });
  const promoVendor = reactExports.useMemo(() => (vendors ?? []).find((v) => v.is_featured) ?? (vendors ?? [])[0], [vendors]);
  const hasAnyResults = (vendors?.length ?? 0) > 0 || (featuredItems?.length ?? 0) > 0;
  const initialLoading = vendorsLoading && itemsLoading;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerLocationHeader, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3 lg:grid lg:grid-cols-[1.1fr_2fr] lg:gap-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/search", className: "relative block flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoSearch, { className: "pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full rounded-full bg-white shadow-sm ring-1 ring-zinc-100 pl-12 pr-4 py-3.5 text-sm font-medium text-zinc-400 flex items-center transition-shadow hover:shadow-md", children: "Search anything here..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CountryToggle, { value: country, onChange: setCountry })
      ] }),
      promoVendor && /* @__PURE__ */ jsxRuntimeExports.jsx(FeaturedPromoCard, { title: `Discover ${promoVendor.name}`, body: promoVendor.tagline || "Fresh, authentic dishes cooked with culture. Order now and enjoy.", ctaLabel: "Order Now", ctaTo: `/vendor/${promoVendor.slug}`, image: promoVendor.cover_image_url }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(FoodCategoryChips, { options: TYPE_OPTIONS, value: typeFilter, onChange: setTypeFilter, allLabel: "All" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 lg:mt-0 space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { title: "Popular Food", action: null }),
        itemsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3", children: Array.from({
          length: 4
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/5] rounded-[1.75rem] bg-zinc-100 animate-pulse" }, i)) }) : (featuredItems ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "No items available right now", hint: "Vendors will list dishes soon — try a different country." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3", children: (featuredItems ?? []).slice(0, 9).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsx(FoodCard, { vendorSlug: it.vendor.slug, itemId: it.id, name: it.name, imageUrl: it.image_url, priceLabel: `${it.vendor.currency === "GBP" ? "£" : "₦"}${Number(it.price).toLocaleString()}`, vendorName: it.vendor.name, badge: it.is_featured ? "Top" : void 0 }, it.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { title: typeFilter ? TYPE_OPTIONS.find((t) => t.key === typeFilter)?.label ?? "Vendors" : "Vendors near you", action: null }),
        vendorsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2", children: Array.from({
          length: 4
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[16/10] rounded-[2rem] bg-zinc-100 animate-pulse" }, i)) }) : (vendors ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: typeFilter ? "No vendors in this category yet" : "No vendors yet", hint: `Check back soon as Naija Eats expands in ${country === "NG" ? "Nigeria" : "the UK"}.` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2", children: (vendors ?? []).slice(0, 6).map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VendorCard, { slug: v.slug, name: v.name, coverUrl: v.cover_image_url, city: v.city, rating: v.rating, prepMinutes: v.prep_time_minutes, deliveryLabel: `Delivery ${v.currency === "GBP" ? "£" : "₦"}${Number(v.delivery_fee || 0).toLocaleString()}`, isFeatured: v.is_featured }, v.id)) })
      ] }),
      !initialLoading && !hasAnyResults && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "Nothing here yet", hint: `Naija Eats is still growing in ${country === "NG" ? "Nigeria" : "the UK"}. Try the other country, or check back soon.` })
    ] })
  ] }) });
}
function SectionHeader({
  title,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-1 rounded-full bg-gradient-to-b from-[var(--brand-clay)] to-[#ff6b35]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold tracking-tight", children: title })
    ] }),
    action
  ] });
}
function EmptyState({
  title,
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-[1.75rem] border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50/80 to-white p-8 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-zinc-700", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-sm text-zinc-500 leading-relaxed", children: hint }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-clay)] hover:underline", children: [
      "Browse all ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" })
    ] })
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
  DiscoverPage as component
};
