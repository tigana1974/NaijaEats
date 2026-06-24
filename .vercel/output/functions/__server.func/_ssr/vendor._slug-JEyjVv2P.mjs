import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useMatchRoute, O as Outlet, L as Link } from "../_libs/tanstack__react-router.mjs";
import { T as notFound } from "../_libs/tanstack__router-core.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { I as IoChevronBack, a as IoCartOutline, b as IoChatbubbleEllipses, c as IoStar, d as IoLocation, e as IoTime, f as IoFlame, g as IoAdd } from "../_libs/react-icons.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { R as Route$G, u as useCart } from "./router-LlhGIoeI.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
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
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
function VendorPage() {
  const {
    slug
  } = Route$G.useParams();
  const {
    cart,
    itemCount,
    subtotal
  } = useCart();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor", slug],
    queryFn: async () => {
      const {
        data: vendor2,
        error
      } = await supabase.from("vendors").select("*").eq("slug", slug).eq("status", "approved").maybeSingle();
      if (error) throw error;
      if (!vendor2) throw notFound();
      const [{
        data: categories2
      }, {
        data: items2
      }] = await Promise.all([supabase.from("menu_categories").select("*").eq("vendor_id", vendor2.id).order("sort_order"), supabase.from("menu_items").select("*").eq("vendor_id", vendor2.id).order("is_featured", {
        ascending: false
      })]);
      return {
        vendor: vendor2,
        categories: categories2 ?? [],
        items: items2 ?? []
      };
    }
  });
  const matchRoute = useMatchRoute();
  const isItemRoute = matchRoute({
    to: "/vendor/$slug/item/$itemId",
    fuzzy: true
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-dvh bg-white grid place-items-center text-zinc-500", children: "Loading…" });
  }
  if (!data) return null;
  const {
    vendor,
    categories,
    items
  } = data;
  const fmt = (n) => `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const cartIsForThisVendor = cart?.vendorId === vendor.id;
  const grouped = categories.length ? categories.map((c) => ({
    category: c,
    items: items.filter((i) => i.category_id === c.id)
  })) : [{
    category: {
      id: "all",
      name: "Menu"
    },
    items
  }];
  if (isItemRoute) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {});
  }
  const commonProps = {
    vendor,
    grouped,
    cartIsForThisVendor,
    itemCount,
    subtotal,
    fmt
  };
  if (vendor.type === "grocery") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GroceryStoreLayout, { ...commonProps });
  } else if (vendor.type === "chef") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ChefProfileLayout, { ...commonProps });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RestaurantLayout, { ...commonProps });
}
function RestaurantLayout({
  vendor,
  grouped,
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-zinc-50/50 pb-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full h-[350px] sm:h-[400px]", children: [
      vendor.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: vendor.cover_image_url, alt: vendor.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-[var(--gradient-warm)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 inset-x-0 z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition ring-1 ring-white/10", "aria-label": "Back to discover", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChevronBack, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cart", "aria-label": "Cart", className: "relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition ring-1 ring-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoCartOutline, { className: "h-6 w-6" }),
          itemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm", children: itemCount > 99 ? "99+" : itemCount })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 inset-x-0 px-4 sm:px-6 translate-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-5xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-5 sm:p-7 shadow-2xl text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          vendor.is_featured && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block mb-3 rounded-full bg-[var(--brand-clay)] px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-white shadow-sm", children: "Featured" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm", children: vendor.name }),
          vendor.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 mt-1.5 text-sm sm:text-base max-w-xl", children: vendor.tagline }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(IoStar, { className: "h-4 w-4 text-amber-400" }),
              Number(vendor.rating || 0).toFixed(1),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/60", children: [
                "(",
                vendor.rating_count || 0,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(IoLocation, { className: "h-4 w-4" }),
              " ",
              vendor.city
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(IoTime, { className: "h-4 w-4" }),
              " ",
              vendor.prep_time_minutes ?? 30,
              " min"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 sm:flex-col sm:items-end shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-black/20 border border-white/10 px-4 py-2.5 text-center min-w-[100px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wide text-white/60 font-semibold mb-0.5", children: "Delivery" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-base", children: fmt(vendor.delivery_fee || 0) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/chats/$vendorId", params: {
            vendorId: vendor.id
          }, className: "inline-flex items-center justify-center gap-2 rounded-full bg-white text-zinc-900 px-5 py-2.5 text-sm font-bold shadow-lg hover:bg-zinc-100 transition min-w-[100px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IoChatbubbleEllipses, { className: "h-5 w-5" }),
            " Chat"
          ] })
        ] })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuSection, { grouped, vendor }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartBar, { cartIsForThisVendor, itemCount, subtotal, fmt })
  ] });
}
function GroceryStoreLayout({
  vendor,
  grouped,
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-white pb-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-emerald-800 text-white pt-safe pb-8 px-4 sm:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/groceries", className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChevronBack, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cart", className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoCartOutline, { className: "h-6 w-6" }),
          itemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm", children: itemCount })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-2xl bg-white p-1 shadow-lg shrink-0", children: vendor.logo_url || vendor.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: vendor.logo_url || vendor.cover_image_url, alt: "", className: "h-full w-full rounded-xl object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full rounded-xl bg-emerald-100" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-bold", children: vendor.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-emerald-100 text-sm mt-1", children: [
            vendor.city,
            " • Fresh Groceries"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 -mt-4 relative z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 flex items-center justify-around text-sm font-medium text-zinc-600", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-zinc-900 font-bold", children: [
          Number(vendor.rating || 0).toFixed(1),
          " ★"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-zinc-400", children: "Rating" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-8 bg-zinc-100" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-zinc-900 font-bold", children: [
          vendor.prep_time_minutes ?? 30,
          " mins"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-zinc-400", children: "Delivery" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-8 bg-zinc-100" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-zinc-900 font-bold", children: fmt(vendor.delivery_fee || 0) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-zinc-400", children: "Fee" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuSection, { grouped, vendor }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartBar, { cartIsForThisVendor, itemCount, subtotal, fmt })
  ] });
}
function ChefProfileLayout({
  vendor,
  grouped,
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-[#FAFAFA] pb-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-white border-b border-zinc-100 pt-safe px-4 sm:px-6 pb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition text-zinc-800", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChevronBack, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cart", className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition text-zinc-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoCartOutline, { className: "h-6 w-6" }),
          itemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm", children: itemCount })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 w-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-zinc-200", children: vendor.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: vendor.cover_image_url, alt: vendor.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: `https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`, alt: "", className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold mt-5 text-zinc-900", children: vendor.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-zinc-500 font-medium mt-1", children: [
          "Personal Chef • ",
          vendor.city
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xl text-sm text-zinc-500 mt-4 leading-relaxed", children: vendor.description || "Crafting personalized culinary experiences. Authentic African cuisine made with passion." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/chats/$vendorId", params: {
            vendorId: vendor.id
          }, className: "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IoChatbubbleEllipses, { className: "h-5 w-5" }),
            " Message Chef"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-2.5 rounded-full bg-zinc-100 text-sm font-bold text-zinc-800", children: [
            "★ ",
            Number(vendor.rating || 0).toFixed(1)
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuSection, { grouped, vendor }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartBar, { cartIsForThisVendor, itemCount, subtotal, fmt })
  ] });
}
function MenuSection({
  grouped,
  vendor
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-5xl px-4 sm:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-6 overflow-x-auto py-4 scrollbar-hide", children: grouped.map(({
      category
    }) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `#category-${category.id}`, className: "shrink-0 text-sm font-bold text-zinc-500 hover:text-[var(--brand-clay)] transition", onClick: (e) => {
      e.preventDefault();
      document.getElementById(`category-${category.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, children: category.name }, category.id)) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-12", children: grouped.map(({
      category,
      items
    }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: `category-${category.id}`, className: "scroll-mt-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-2xl font-bold mb-6 text-zinc-900", children: category.name }),
      items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-zinc-500 text-sm", children: "No items in this section yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-1 md:grid-cols-2", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(HorizontalFoodCard, { vendorSlug: vendor.slug, itemId: item.id, name: item.name, imageUrl: item.image_url, priceLabel: `${vendor.currency === "GBP" ? "£" : "₦"}${Number(item.price).toLocaleString()}`, description: item.description, badge: item.is_featured ? "Top" : void 0, isAvailable: item.is_available }, item.id)) })
    ] }, category.id)) })
  ] });
}
function CartBar({
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt
}) {
  if (!cartIsForThisVendor || itemCount <= 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),1rem)] px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-auto mx-auto max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cart", className: "flex items-center justify-between gap-4 rounded-full bg-[var(--brand-clay)] px-5 py-4 text-white shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 text-sm font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(IoCartOutline, { className: "h-6 w-6" }),
      " ",
      itemCount,
      " item",
      itemCount > 1 ? "s" : ""
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold", children: [
      "View cart · ",
      fmt(subtotal)
    ] })
  ] }) }) });
}
function HorizontalFoodCard({
  vendorSlug,
  itemId,
  name,
  imageUrl,
  priceLabel,
  description,
  badge,
  isAvailable
}) {
  const content = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative flex gap-5 p-4 rounded-[1.75rem] bg-white shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all duration-500 group ${isAvailable ? "hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:ring-[var(--brand-clay)]/20" : "opacity-50 grayscale"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 py-1 flex flex-col", children: [
      badge && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 w-max px-2.5 py-1 rounded-lg bg-amber-400/15 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IoFlame, { className: "h-3 w-3 text-amber-500" }),
        badge
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-zinc-900 text-[17px] leading-tight line-clamp-2 tracking-tight group-hover:text-[var(--brand-clay)] transition-colors duration-300", children: name }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed", children: description }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3.5 flex flex-wrap items-center gap-2 justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display font-extrabold text-lg text-zinc-900 tracking-tight", children: priceLabel }),
        !isAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg", children: "Unavailable" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-[120px] w-[120px] shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]", children: [
      imageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imageUrl, alt: name, className: `h-full w-full object-cover transition-transform duration-700 ease-out ${isAvailable ? "group-hover:scale-110" : ""}` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" }),
      isAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg shadow-black/10 text-[var(--brand-clay)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-75", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoAdd, { className: "h-4 w-4" }) })
    ] })
  ] });
  if (!isAvailable) return content;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/$slug/item/$itemId", params: {
    slug: vendorSlug,
    itemId
  }, className: "block", children: content });
}
export {
  VendorPage as component
};
