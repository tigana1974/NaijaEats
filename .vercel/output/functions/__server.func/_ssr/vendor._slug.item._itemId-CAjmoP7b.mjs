import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { T as notFound } from "../_libs/tanstack__router-core.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { I as IoChevronBack, w as IoHeart, x as IoEllipsisVertical, l as IoRemove, g as IoAdd, c as IoStar, y as IoTimeOutline, z as IoFlameOutline, A as IoCallOutline, B as IoChatbubbleEllipsesOutline } from "../_libs/react-icons.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { k as Route$1, u as useCart } from "./router-Ck7azls6.mjs";
import { t as toast } from "../_libs/sonner.mjs";
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
function MenuItemPage() {
  const {
    slug,
    itemId
  } = Route$1.useParams();
  const navigate = useNavigate();
  const {
    cart,
    addItem,
    confirmSwitchVendor
  } = useCart();
  const [qty, setQty] = reactExports.useState(1);
  const [adding, setAdding] = reactExports.useState(false);
  const [isFavorite, setIsFavorite] = reactExports.useState(false);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["menu-item", slug, itemId],
    queryFn: async () => {
      const {
        data: vendor2,
        error: vErr
      } = await supabase.from("vendors").select("*").eq("slug", slug).eq("status", "approved").maybeSingle();
      if (vErr) throw vErr;
      if (!vendor2) throw notFound();
      const {
        data: item2,
        error: iErr
      } = await supabase.from("menu_items").select("*").eq("id", itemId).eq("vendor_id", vendor2.id).maybeSingle();
      if (iErr) throw iErr;
      if (!item2) throw notFound();
      return {
        vendor: vendor2,
        item: item2
      };
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-dvh bg-[#fdfaf5] grid place-items-center text-zinc-500", children: "Loading…" });
  }
  if (!data) return null;
  const {
    vendor,
    item
  } = data;
  const fmt = (n) => `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const handleAddToCart = async () => {
    if (!item.is_available) return;
    setAdding(true);
    try {
      const vendorArg = {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: Number(vendor.delivery_fee || 0),
        minOrder: Number(vendor.min_order || 0)
      };
      const itemArg = {
        menuItemId: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.image_url
      };
      let switched = false;
      for (let i = 0; i < qty; i++) {
        const result = addItem(vendorArg, itemArg);
        if (result === "different_vendor") {
          if (switched) break;
          const ok = window.confirm(`Your cart has items from ${cart?.vendorName}. Start a new cart with ${vendor.name} instead?`);
          if (!ok) return;
          confirmSwitchVendor(vendorArg, itemArg);
          switched = true;
          for (let j = 1; j < qty; j++) addItem(vendorArg, itemArg);
          break;
        }
      }
      toast.success(`Added ${qty}× ${item.name} to cart`);
      navigate({
        to: "/cart"
      });
    } finally {
      setAdding(false);
    }
  };
  const commonProps = {
    slug,
    vendor,
    item,
    qty,
    setQty,
    adding,
    isFavorite,
    setIsFavorite,
    handleAddToCart,
    fmt
  };
  if (vendor.type === "grocery") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GroceryItemLayout, { ...commonProps });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(FoodItemLayout, { ...commonProps });
}
function FoodItemLayout({
  slug,
  vendor,
  item,
  qty,
  setQty,
  adding,
  isFavorite,
  setIsFavorite,
  handleAddToCart,
  fmt
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-gradient-to-br from-[#d4cdbd] via-[#faede6] to-[#eae5da] pb-[100px] font-sans relative overflow-x-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 inset-x-0 z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-5 py-5 flex items-center justify-between pt-safe", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/$slug", params: {
        slug
      }, className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:scale-105", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChevronBack, { className: "h-5 w-5 ml-0.5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-medium text-[17px] tracking-tight text-zinc-900", children: "Details" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:scale-105", "aria-label": "More options", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoEllipsisVertical, { className: "h-5 w-5" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mx-auto max-w-md pt-20 pb-2", children: item.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full h-[360px] flex justify-center items-center px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image_url, alt: item.name, className: "w-full h-full object-contain drop-shadow-2xl mix-blend-multiply" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-80 bg-black/5 mix-blend-multiply" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-6 relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-[22px] font-medium leading-snug text-zinc-900 tracking-tight", children: item.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-500 font-medium text-[13px] mr-1.5", children: "Price:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-zinc-900 text-lg", children: fmt(Number(item.price)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsFavorite(!isFavorite), className: "shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:scale-105 transition-transform mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoHeart, { className: `h-5 w-5 ${isFavorite ? "text-[#ff4d4d]" : "text-[#ff4d4d]"}` }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-5 pt-4 text-[12px] font-medium text-zinc-500 border-t border-zinc-400/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoStar, { className: "h-3.5 w-3.5 text-zinc-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            vendor.rating ? Number(vendor.rating).toFixed(1) : "4.6",
            " Rating"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-3 bg-zinc-300/60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoTimeOutline, { className: "h-4 w-4 text-zinc-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: vendor.prep_time_minutes ? `${vendor.prep_time_minutes} Min` : "25-30 Min" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-3 bg-zinc-300/60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoFlameOutline, { className: "h-4 w-4 text-zinc-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "110 Kcal" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: vendor.cover_image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`, alt: vendor.name, className: "h-10 w-10 rounded-full object-cover bg-zinc-200 ring-1 ring-white/50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-[13px] text-zinc-900", children: vendor.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-zinc-500 font-medium tracking-wide capitalize", children: [
              "Id: ",
              vendor.id.split("-")[0]
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-zinc-600 hover:bg-zinc-50 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoCallOutline, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-zinc-600 hover:bg-zinc-50 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChatbubbleEllipsesOutline, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[15px] font-medium text-zinc-900 mb-2", children: "Description" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[12px] text-zinc-500 leading-relaxed font-normal", children: [
          item.description || "This looks like a rich, indulgent dish built for serious flavor. Fresh ingredients and expert preparation bring irresistible taste to every bite.",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "font-medium text-zinc-900 ml-1 capitalize hover:underline", children: "Read more..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid grid-cols-4 gap-2.5", children: [{
        label: "Protein",
        val: "35 Gram"
      }, {
        label: "Carbs",
        val: "80 Gram"
      }, {
        label: "Fiber",
        val: "25 Gram"
      }, {
        label: "Fat",
        val: "15 Gram"
      }].map((macro) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl px-1 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-zinc-400 font-normal tracking-wide mb-1.5 capitalize", children: macro.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-[11px] text-zinc-900 capitalize", children: macro.val })
      ] }, macro.label)) }),
      !item.is_available && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-2xl bg-red-50/80 px-4 py-3 ring-1 ring-red-100 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-red-800", children: "Currently unavailable" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-2 px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-white rounded-full p-1 shadow-[0_4px_14px_rgba(0,0,0,0.05)] w-[115px] shrink-0 border border-zinc-100/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQty(Math.max(1, qty - 1)), className: "h-10 w-10 flex items-center justify-center rounded-full text-zinc-800 font-medium hover:bg-zinc-50 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoRemove, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[15px] text-zinc-900", children: qty }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQty(qty + 1), className: "h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff7070] to-[#ff4d4d] text-white shadow-md shadow-red-500/30 hover:scale-105 transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoAdd, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleAddToCart, disabled: !item.is_available || adding, className: "flex-1 h-[48px] rounded-full bg-gradient-to-r from-[#ff7070] to-[#ff4d4d] text-white font-medium shadow-lg shadow-red-500/25 disabled:opacity-50 hover:scale-[1.02] transition-transform text-sm tracking-wide capitalize", children: adding ? "Adding…" : "Add to cart" })
    ] }) })
  ] });
}
function GroceryItemLayout({
  slug,
  vendor,
  item,
  qty,
  setQty,
  adding,
  isFavorite,
  setIsFavorite,
  handleAddToCart,
  fmt
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-white pb-[100px] font-sans relative overflow-x-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 inset-x-0 z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-5 py-5 flex items-center justify-between pt-safe", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/$slug", params: {
        slug
      }, className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoChevronBack, { className: "h-5 w-5 ml-0.5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsFavorite(!isFavorite), className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoHeart, { className: `h-5 w-5 ${isFavorite ? "text-[#ff4d4d]" : "text-zinc-400"}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105", "aria-label": "More options", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoEllipsisVertical, { className: "h-5 w-5" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mx-auto max-w-md bg-zinc-50 rounded-b-[2.5rem] pt-24 pb-8 px-8 shadow-sm", children: item.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full h-[280px] flex justify-center items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image_url, alt: item.name, className: "w-full h-full object-contain drop-shadow-xl" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-[280px] bg-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400", children: "No Image" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-6 pt-6 relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold tracking-wide text-zinc-500 uppercase", children: vendor.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1 w-1 rounded-full bg-zinc-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full", children: "In Stock" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-[24px] font-semibold leading-tight text-zinc-900 tracking-tight", children: item.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-zinc-900 text-3xl tracking-tight", children: fmt(Number(item.price)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-400 font-medium text-sm mb-1 line-through", children: fmt(Number(item.price) * 1.2) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px w-full bg-zinc-100 my-6" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[15px] font-medium text-zinc-900 mb-2", children: "Product Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-zinc-500 leading-relaxed font-normal", children: item.description || "Fresh, high-quality groceries directly sourced for your daily needs. Store in a cool, dry place." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2 border-b border-zinc-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] text-zinc-500", children: "Weight/Volume" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] font-medium text-zinc-900", children: "500g" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2 border-b border-zinc-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] text-zinc-500", children: "Origin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] font-medium text-zinc-900 capitalize", children: vendor.city })
        ] })
      ] }),
      !item.is_available && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-2xl bg-red-50 px-4 py-3 border border-red-100 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IoInformationCircleOutline, { className: "h-5 w-5 text-red-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-red-800", children: "Currently out of stock" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 px-6 bg-white border-t border-zinc-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-zinc-50 rounded-2xl p-1 w-[120px] shrink-0 border border-zinc-200/60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQty(Math.max(1, qty - 1)), className: "h-10 w-10 flex items-center justify-center rounded-xl text-zinc-800 font-medium hover:bg-white hover:shadow-sm transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoRemove, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[15px] text-zinc-900", children: qty }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQty(qty + 1), className: "h-10 w-10 flex items-center justify-center rounded-xl text-zinc-800 font-medium hover:bg-white hover:shadow-sm transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoAdd, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleAddToCart, disabled: !item.is_available || adding, className: "flex-1 h-[48px] rounded-2xl bg-zinc-900 text-white font-medium shadow-md shadow-zinc-900/20 disabled:opacity-50 hover:bg-zinc-800 hover:scale-[1.02] transition-all text-sm tracking-wide capitalize", children: adding ? "Adding…" : "Add to cart" })
    ] }) })
  ] });
}
export {
  MenuItemPage as component
};
