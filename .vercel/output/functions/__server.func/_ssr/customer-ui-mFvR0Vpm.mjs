import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as IoStar, d as IoLocation, e as IoTime, f as IoFlame, g as IoAdd, l as IoRemove } from "../_libs/react-icons.mjs";
function FoodCategoryChips({
  options,
  value,
  onChange,
  allLabel = "See all"
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4", style: { scrollbarWidth: "none" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(null),
        "data-active": value === null,
        className: "shrink-0 rounded-2xl border border-zinc-200/80 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm\n          data-[active=true]:border-transparent data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-clay)] data-[active=true]:to-[#ff6b35]\n          data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--brand-clay)]/25\n          transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        children: allLabel
      }
    ),
    options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => onChange(opt.key),
        "data-active": value === opt.key,
        className: "flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm\n            data-[active=true]:border-transparent data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-clay)] data-[active=true]:to-[#ff6b35]\n            data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--brand-clay)]/25\n            transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(opt.Icon, { className: "h-4 w-4" }),
          opt.label
        ]
      },
      opt.key
    ))
  ] });
}
function FeaturedPromoCard({
  title,
  body,
  ctaLabel,
  ctaTo,
  image
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: ctaTo,
      className: "group relative block overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--brand-clay)] via-[#ff6b35] to-[#e84520] p-7 sm:p-8 text-white shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-500 hover:-translate-y-1",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/[0.07] blur-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/[0.05]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 max-w-[65%]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider font-bold mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IoFlame, { className: "h-3 w-3" }),
            " Trending"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-white/85 line-clamp-2 leading-relaxed", children: body }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[var(--brand-clay)] shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300", children: [
            ctaLabel,
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 7l5 5m0 0l-5 5m5-5H6" }) })
          ] })
        ] }),
        image && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-0 h-full w-[45%] pointer-events-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[var(--brand-clay)] via-[var(--brand-clay)]/60 to-transparent z-10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: image,
              alt: "",
              "aria-hidden": "true",
              className: "h-full w-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out"
            }
          )
        ] })
      ]
    }
  );
}
function FoodCard({
  vendorSlug,
  itemId,
  name,
  imageUrl,
  priceLabel,
  vendorName,
  rating,
  badge
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/vendor/$slug/item/$itemId",
      params: { slug: vendorSlug, itemId },
      className: "group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-1.5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[4/3] w-full overflow-hidden bg-zinc-100", children: [
          imageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: imageUrl,
              alt: name,
              className: "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 right-3 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 text-sm font-extrabold text-zinc-900 shadow-lg shadow-black/10 ring-1 ring-black/[0.04]", children: priceLabel }) }),
          badge && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-xl bg-amber-400/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IoFlame, { className: "h-3 w-3" }),
            badge
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-3 right-3 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xl shadow-black/15 text-[var(--brand-clay)] ring-1 ring-black/[0.04] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--brand-clay)] group-hover:text-white group-hover:shadow-[var(--brand-clay)]/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoAdd, { className: "h-5 w-5" }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[15px] text-zinc-900 leading-snug line-clamp-2 tracking-tight", children: name }),
          vendorName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2 text-xs text-zinc-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium", children: vendorName }),
            rating && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1 w-1 rounded-full bg-zinc-300 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-amber-600 font-bold shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IoStar, { className: "h-3 w-3 text-amber-500" }),
                rating.toFixed(1)
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function VendorCard({
  slug,
  name,
  coverUrl,
  city,
  rating,
  prepMinutes,
  deliveryLabel,
  isFeatured
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Link,
    {
      to: "/vendor/$slug",
      params: { slug },
      className: "group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-2",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-[16/10] w-full overflow-hidden bg-zinc-100", children: [
        coverUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: coverUrl,
            alt: name,
            className: "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" }),
        isFeatured && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/25", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(IoStar, { className: "h-3 w-3" }),
          "Featured"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 inset-x-0 z-10 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold text-white leading-tight tracking-tight drop-shadow-sm line-clamp-1", children: name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2.5 flex-wrap", children: [
              typeof rating === "number" && rating > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IoStar, { className: "h-3 w-3 text-amber-400" }),
                rating.toFixed(1)
              ] }),
              city && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IoLocation, { className: "h-3 w-3" }),
                city
              ] }),
              typeof prepMinutes === "number" && prepMinutes > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IoTime, { className: "h-3 w-3" }),
                prepMinutes,
                "m"
              ] })
            ] })
          ] }),
          deliveryLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-extrabold text-zinc-900 shadow-lg shadow-black/10", children: deliveryLabel })
        ] }) })
      ] })
    }
  );
}
function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "lg"
}) {
  const containerSize = size === "lg" ? "h-12 px-2" : "h-8 px-1";
  const btnSize = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `inline-flex items-center justify-between gap-3 rounded-2xl bg-zinc-100/80 ring-1 ring-zinc-200/50 ${containerSize}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        "aria-label": "Decrease quantity",
        onClick: () => onChange(Math.max(min, value - 1)),
        disabled: value <= min,
        className: `${btnSize} rounded-xl grid place-items-center bg-white shadow-sm text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 transition-all active:scale-90`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoRemove, { className: iconSize })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-center font-extrabold text-zinc-900 tabular-nums ${size === "lg" ? "text-base min-w-[24px]" : "text-sm min-w-[16px]"}`, children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        "aria-label": "Increase quantity",
        onClick: () => onChange(Math.min(max, value + 1)),
        disabled: value >= max,
        className: `${btnSize} rounded-xl grid place-items-center bg-white shadow-sm text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 transition-all active:scale-90`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoAdd, { className: iconSize })
      }
    )
  ] });
}
export {
  FoodCard as F,
  QuantityStepper as Q,
  VendorCard as V,
  FeaturedPromoCard as a,
  FoodCategoryChips as b
};
