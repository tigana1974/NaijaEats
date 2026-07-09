import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { IoStar, IoTime, IoLocation, IoRemove, IoAdd, IoFlame } from "react-icons/io5";

/* ─── Category Chips ─────────────────────────────────────────────── */

export function FoodCategoryChips<T extends string>({
  options,
  value,
  onChange,
  allLabel = "See all",
}: {
  options: { key: T; label: string; Icon: React.ComponentType<{ className?: string }> }[];
  value: T | null;
  onChange: (v: T | null) => void;
  allLabel?: string;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
      <button
        type="button"
        onClick={() => onChange(null)}
        data-active={value === null}
        className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm
          data-[active=true]:border-transparent data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-clay)] data-[active=true]:to-[#ff6b35]
          data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--brand-clay)]/25
          transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          data-active={value === opt.key}
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm
            data-[active=true]:border-transparent data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-clay)] data-[active=true]:to-[#ff6b35]
            data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--brand-clay)]/25
            transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        >
          <opt.Icon className="h-4 w-4" />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Featured Promo Card ────────────────────────────────────────── */

export function FeaturedPromoCard({
  title,
  body,
  ctaLabel,
  ctaTo,
  image,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
  image?: string | null;
}) {
  return (
    <Link
      to={ctaTo}
      className="group relative block overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--brand-clay)] via-[#ff6b35] to-[#e84520] p-7 sm:p-8 text-white shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-500 hover:-translate-y-1"
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/[0.07] blur-sm" />
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/[0.05]" />

      <div className="relative z-10 max-w-[65%]">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider font-bold mb-4">
          <IoFlame className="h-3 w-3" /> Trending
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight">{title}</h2>
        <p className="mt-3 text-sm text-white/85 line-clamp-2 leading-relaxed">{body}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[var(--brand-clay)] shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300">
          {ctaLabel}
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </span>
      </div>
      {image && (
        <div className="absolute right-0 top-0 h-full w-[45%] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-clay)] via-[var(--brand-clay)]/60 to-transparent z-10" />
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        </div>
      )}
    </Link>
  );
}

/* ─── Product / Food Card ────────────────────────────────────────── */

export function FoodCard({
  vendorSlug,
  itemId,
  name,
  imageUrl,
  priceLabel,
  vendorName,
  rating,
  badge,
  onAdd,
}: {
  vendorSlug: string;
  itemId: string;
  name: string;
  imageUrl?: string | null;
  priceLabel: string;
  vendorName?: string;
  rating?: number;
  badge?: string;
  onAdd?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      to="/vendor/$slug/item/$itemId"
      params={{ slug: vendorSlug, itemId }}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-1.5"
    >
      {/* Image section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" />
        )}
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Price pill — top right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-block rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 text-sm font-extrabold text-zinc-900 shadow-lg shadow-black/10 ring-1 ring-black/[0.04]">
            {priceLabel}
          </span>
        </div>

        {/* Badge — top left */}
        {badge && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-xl bg-amber-400/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/20">
            <IoFlame className="h-3 w-3" />
            {badge}
          </span>
        )}

        {/* Floating add button */}
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={(e) => {
              if (onAdd) {
                e.preventDefault();
                e.stopPropagation();
                onAdd(e);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xl shadow-black/15 text-[var(--brand-clay)] ring-1 ring-black/[0.04] transition-all duration-300 hover:scale-110 hover:bg-[var(--brand-clay)] hover:text-white hover:shadow-[var(--brand-clay)]/30"
          >
            <IoAdd className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-[15px] text-zinc-900 leading-snug line-clamp-2 tracking-tight">{name}</h3>
        {vendorName && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="truncate font-medium">{vendorName}</span>
            {rating && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-300 shrink-0" />
                <span className="inline-flex items-center gap-1 text-amber-600 font-bold shrink-0">
                  <IoStar className="h-3 w-3 text-amber-500" />
                  {rating.toFixed(1)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Vendor / Chef Card ─────────────────────────────────────────── */

export function VendorCard({
  slug,
  name,
  coverUrl,
  city,
  rating,
  prepMinutes,
  deliveryLabel,
  isFeatured,
}: {
  slug: string;
  name: string;
  coverUrl?: string | null;
  city?: string | null;
  rating?: number | null;
  prepMinutes?: number | null;
  deliveryLabel?: string;
  isFeatured?: boolean;
}) {
  return (
    <Link
      to="/vendor/$slug"
      params={{ slug }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-2"
    >
      {/* Hero image with cinematic overlay */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200" />
        )}
        {/* Cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Featured badge */}
        {isFeatured && (
          <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/25">
            <IoStar className="h-3 w-3" />
            Featured
          </span>
        )}

        {/* Glassmorphism info strip */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold text-white leading-tight tracking-tight drop-shadow-sm line-clamp-1">{name}</h3>
              <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                {typeof rating === "number" && rating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                    <IoStar className="h-3 w-3 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {city && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                    <IoLocation className="h-3 w-3" />
                    {city}
                  </span>
                )}
                {typeof prepMinutes === "number" && prepMinutes > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                    <IoTime className="h-3 w-3" />
                    {prepMinutes}m
                  </span>
                )}
              </div>
            </div>
            {deliveryLabel && (
              <span className="shrink-0 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-extrabold text-zinc-900 shadow-lg shadow-black/10">
                {deliveryLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Quantity Stepper ────────────────────────────────────────────── */

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "lg",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "lg";
}) {
  const containerSize = size === "lg" ? "h-12 px-2" : "h-8 px-1";
  const btnSize = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  
  return (
    <div className={`inline-flex items-center justify-between gap-3 rounded-2xl bg-zinc-100/80 ring-1 ring-zinc-200/50 ${containerSize}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`${btnSize} rounded-xl grid place-items-center bg-white shadow-sm text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 transition-all active:scale-90`}
      >
        <IoRemove className={iconSize} />
      </button>
      <span className={`text-center font-extrabold text-zinc-900 tabular-nums ${size === "lg" ? "text-base min-w-[24px]" : "text-sm min-w-[16px]"}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${btnSize} rounded-xl grid place-items-center bg-white shadow-sm text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 transition-all active:scale-90`}
      >
        <IoAdd className={iconSize} />
      </button>
    </div>
  );
}
