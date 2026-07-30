import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { IoAdd, IoSearch, IoStar, IoTimeOutline, IoBicycleOutline } from "react-icons/io5";
import { PiChefHatDuotone, PiStorefrontDuotone, PiBasketDuotone } from "react-icons/pi";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/useMyProfile";
import { CustomerLocationHeader, CustomerShell } from "@/components/naija/CustomerShell";
import {
  categoryPhotos,
  dishEgusi,
  dishJollof,
  dishSuya,
  groceryMarket,
  illusChef,
  restaurantDining,
} from "@/assets/landing-images";
import { useCart } from "@/hooks/useCart";
import { useCountry, hasStoredCountry } from "@/hooks/useCountry";
import { toast } from "sonner";

/**
 * Customer Home / Discover — Uber Eats-style layout.
 *
 * Structure (top to bottom):
 *  1. Search bar + country toggle
 *  2. Category icon rail (emoji circles, horizontal scroll)
 *  3. Filter chips (functional: top rated / under 30 min / free delivery)
 *  4. Promo banner carousel (horizontal scroll, snap)
 *  5. "Featured on Naija Eats" vendor rail (horizontal scroll on mobile,
 *     arrows on desktop)
 *  6. Popular food grid
 *  7. All vendors grid
 */
export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverPage,
});

type VendorType = "restaurant" | "grocery" | "chef";

type QuickFilter = "top" | "fast" | "freeDelivery" | null;

/** Resolve a category thumbnail from the food-type name (or its admin image),
 *  with graceful fallbacks so tiles never render blank. */
function photoForFoodType(name: string, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl;
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return categoryPhotos[slug] ?? categoryPhotos[slug.split("-")[0]] ?? null;
}

/**
 * Category rail thumbnail. Shows ONLY the photo when one is available (no
 * layer behind it); falls back to the emoji only if there is no photo or the
 * image fails to load.
 */
function CategoryThumb({ photo, emoji }: { photo?: string | null; emoji: string }) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) {
    return (
      <span aria-hidden className="text-2xl leading-none">
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={photo}
      alt=""
      loading="lazy"
      decoding="async"
      width={56}
      height={56}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function DiscoverPage() {
  const { data: profile } = useMyProfile();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState("");

  const [country, setCountry] = useCountry();
  useEffect(() => {
    if (profile?.country && !hasStoredCountry()) {
      setCountry(profile.country as "NG" | "UK");
    }
  }, [profile?.country, setCountry]);

  const [category, setCategory] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const { data: foodTypes } = useQuery({
    queryKey: ["global_food_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_food_types")
        .select("*")
        .eq("is_approved", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const CATEGORIES = useMemo(() => {
    const base: any[] = [{ id: "all", label: "All", emoji: "🍽️", photo: categoryPhotos.all }];
    const dynamic = (foodTypes ?? []).map((ft) => ({
      id: ft.id,
      label: ft.name,
      emoji: ft.emoji || "🍲",
      isFoodType: true,
      // Food types come from the DB with UUID ids, so we can't key the photo
      // map by id — resolve by the type's admin image or its name slug instead.
      photo: photoForFoodType(ft.name, ft.image_url),
    }));
    const vendors: any[] = [
      {
        id: "grocery",
        label: "Grocery",
        emoji: "🥬",
        kind: "grocery",
        photo: categoryPhotos.grocery,
      },
      { id: "chefs", label: "Chefs", emoji: "👨🏾‍🍳", kind: "chef", photo: categoryPhotos.chefs },
      {
        id: "restaurants",
        label: "Restaurants",
        emoji: "🏪",
        kind: "restaurant",
        photo: categoryPhotos.restaurants,
      },
    ];
    return [...base, ...dynamic, ...vendors];
  }, [foodTypes]);

  const activeCategory = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
  const typeFilter = activeCategory.kind ?? null;
  const isFoodType = activeCategory.isFoodType ?? false;

  // Vendors — approved only, filtered by country + optional type.
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["discover-vendors", country, typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("vendors")
        .select("*")
        .eq("status", "approved")
        .eq("country", country)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });
      if (typeFilter) q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Cross-vendor dishes for the food grid.
  const { data: featuredItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["discover-featured-items", country, isFoodType ? activeCategory.id : null],
    queryFn: async () => {
      let q = supabase
        .from("menu_items")
        .select(
          "id, name, price, image_url, is_available, is_featured, description, food_type_id, vendor:vendors!inner(id, slug, name, currency, country, status, delivery_fee, min_order)",
        )
        .eq("is_available", true)
        .order("is_featured", { ascending: false });

      if (isFoodType) {
        q = q.eq("food_type_id", activeCategory.id);
      } else {
        q = q.limit(32);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).filter(
        (it: any) => it.vendor?.country === country && it.vendor?.status === "approved",
      );
    },
  });

  // Apply quick filters + keyword to the vendor list client-side so the chips
  // feel instant like Uber Eats.
  const filteredVendors = useMemo(() => {
    let list = vendors ?? [];
    if (quickFilter === "top") list = list.filter((v: any) => Number(v.rating ?? 0) >= 4.5);
    if (quickFilter === "fast")
      list = list.filter((v: any) => Number(v.prep_time_minutes ?? 999) <= 30);
    if (quickFilter === "freeDelivery")
      list = list.filter((v: any) => Number(v.delivery_fee ?? 0) === 0);
    return list;
  }, [vendors, quickFilter]);

  const filteredItems = useMemo(() => {
    const list = featuredItems ?? [];
    return list;
  }, [featuredItems]);

  const featuredVendors = useMemo(
    () =>
      filteredVendors
        .filter((v: any) => v.is_featured)
        .concat(filteredVendors.filter((v: any) => !v.is_featured))
        .slice(0, 8),
    [filteredVendors],
  );

  const symbol = (c: string) => (c === "GBP" ? "£" : "₦");

  return (
    <CustomerShell
      topBar={<CustomerLocationHeader />}
      containerClassName="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 lg:pb-16"
    >
      <div className="space-y-10 pt-5 sm:pt-7">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[var(--brand-clay)]">
              {profile?.full_name
                ? `Welcome back, ${profile.full_name.split(" ")[0]}`
                : "Welcome to NaijaEats"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              What are you craving today?
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-right">
            Authentic meals, trusted local kitchens, and specialist groceries near you.
          </p>
        </header>
        {/* ─── 1 · Search + country (mobile only — the desktop top bar holds
            both the global search and the NG/UK switch) ─── */}
        <div className="flex items-center gap-3 lg:hidden">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({
                to: "/search",
                search: searchDraft.trim() ? { q: searchDraft.trim() } : {},
              });
            }}
          >
            <IoSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search Naija Eats"
              aria-label="Search Naija Eats"
              className="w-full rounded-lg border border-border bg-card py-3.5 pl-12 pr-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--brand-clay)]"
            />
          </form>
          <CountryToggle value={country} onChange={setCountry} />
        </div>

        {/* ─── 2 · Category icon rail ─── */}
        <section className="border-y border-border py-6">
          <RailHeader title="Explore by craving" />
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(active ? "all" : c.id)}
                  className="flex shrink-0 flex-col items-center gap-2 px-2 py-1 transition"
                  aria-pressed={active}
                >
                  <span
                    className={`relative grid h-16 w-16 place-items-center overflow-hidden rounded-full transition sm:h-[72px] sm:w-[72px] ${
                      active
                        ? "ring-2 ring-[var(--brand-clay)] ring-offset-2 ring-offset-background"
                        : "ring-1 ring-border"
                    }`}
                  >
                    <CategoryThumb photo={(c as any).photo} emoji={c.emoji} />
                  </span>
                  <span
                    className={`max-w-[84px] truncate text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["top", "Top rated"],
                ["fast", "Under 30 min"],
                ["freeDelivery", "Free delivery"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuickFilter((current) => (current === value ? null : value))}
                aria-pressed={quickFilter === value}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                  quickFilter === value
                    ? "border-[#171714] bg-[#171714] text-white"
                    : "border-border bg-card hover:border-foreground/35"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ─── 3 · Browse by vendor type ─── */}
        <section>
          <RailHeader title="Choose how you want to eat" />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
            {(
              [
                {
                  to: "/chefs",
                  label: "Chefs",
                  detail: "Home-style and private dining",
                  image: illusChef,
                  Icon: PiChefHatDuotone,
                },
                {
                  to: "/restaurants",
                  label: "Restaurants",
                  detail: "Local favourites, delivered",
                  image: restaurantDining,
                  Icon: PiStorefrontDuotone,
                },
                {
                  to: "/groceries",
                  label: "Groceries",
                  detail: "Stock the pantry",
                  image: groceryMarket,
                  Icon: PiBasketDuotone,
                },
              ] as const
            ).map((entry) => (
              <Link
                key={entry.to}
                to={entry.to}
                className="group relative flex min-h-[132px] items-end overflow-hidden rounded-lg bg-zinc-900 p-3 text-white sm:min-h-[190px] sm:p-5"
              >
                <img
                  src={entry.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="relative min-w-0">
                  <entry.Icon className="mb-2 h-5 w-5 text-[#f0bd43]" />
                  <span className="block truncate text-sm font-extrabold sm:text-lg">
                    {entry.label}
                  </span>
                  <span className="mt-1 hidden text-xs text-white/65 sm:block">{entry.detail}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 4 · Promo banner carousel ─── */}
        <PromoCarousel country={country} />

        {/* ─── 5 · Featured vendors rail ─── */}
        <VendorRail
          title="Featured on Naija Eats"
          vendors={featuredVendors}
          loading={vendorsLoading}
          symbol={symbol}
          country={country}
        />

        {/* ─── 6 · Category / Items Grid ─── */}
        <section>
          <RailHeader
            title={isFoodType ? `${activeCategory.label} near you` : "Popular near you"}
          />
          {itemsLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[280px] w-full rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={IoStar}
              title={
                isFoodType
                  ? `No ${activeCategory.label.toLowerCase()} dishes right now`
                  : "No items available right now"
              }
              hint="Try another category, or check back soon."
            />
          ) : (
            <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filteredItems.slice(0, 12).map((it: any) => (
                <HomeFoodCard
                  key={it.id}
                  vendorSlug={it.vendor.slug}
                  itemId={it.id}
                  name={it.name}
                  imageUrl={it.image_url}
                  priceLabel={`${symbol(it.vendor.currency)}${Number(it.price).toLocaleString()}`}
                  vendorName={it.vendor.name}
                  badge={it.is_featured ? "Top" : undefined}
                  onAdd={() => {
                    addItem(
                      {
                        id: it.vendor.id,
                        name: it.vendor.name,
                        slug: it.vendor.slug,
                        currency: it.vendor.currency,
                        deliveryFee: Number(it.vendor.delivery_fee || 0),
                        minOrder: Number(it.vendor.min_order || 0),
                      },
                      {
                        menuItemId: it.id,
                        name: it.name,
                        price: Number(it.price),
                        imageUrl: it.image_url,
                      },
                    );
                    toast.success(`${it.name} added to cart!`);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── 7 · All vendors Grid ─── */}
        {!isFoodType && (
          <section className="mb-20">
            <RailHeader
              title={
                typeFilter
                  ? activeCategory.label
                  : quickFilter
                    ? "Matching vendors"
                    : "All restaurants & stores"
              }
            />
            {vendorsLoading ? (
              <div className="mt-3 grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[16/10] rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <EmptyState
                title="No vendors match"
                hint={`Clear the filters, or check back soon as Naija Eats expands in ${country === "NG" ? "Nigeria" : "the UK"}.`}
              />
            ) : (
              <div className="mt-3 grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVendors.map((v: any) => (
                  <UberVendorCard key={v.id} v={v} symbol={symbol} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </CustomerShell>
  );
}

/* ─── Promo banner carousel — colourful cards like the Uber Eats strip ─── */

function HomeFoodCard({
  vendorSlug,
  itemId,
  name,
  imageUrl,
  priceLabel,
  vendorName,
  badge,
  onAdd,
}: {
  vendorSlug: string;
  itemId: string;
  name: string;
  imageUrl?: string | null;
  priceLabel: string;
  vendorName: string;
  badge?: string;
  onAdd: () => void;
}) {
  return (
    <Link
      to="/vendor/$slug/item/$itemId"
      params={{ slug: vendorSlug, itemId }}
      className="group min-w-0"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <img src={dishJollof} alt={name} className="h-full w-full object-cover opacity-70" />
        )}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 shadow-sm">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={`Add ${name} to cart`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAdd();
          }}
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--brand-clay)] shadow-lg transition hover:bg-[var(--brand-clay)] hover:text-white"
        >
          <IoAdd className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-foreground sm:text-base">{name}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{vendorName}</p>
        </div>
        <span className="shrink-0 text-sm font-extrabold text-[var(--brand-clay)]">
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}

function PromoCarousel({ country }: { country: "NG" | "UK" }) {
  const banners = [
    {
      id: "book",
      eyebrow: "Meal planning",
      title: "A full week of good food, sorted.",
      body: "Build breakfast, lunch, and dinner around your routine.",
      cta: "Plan meals",
      to: "/book",
      image: dishJollof,
      className: "text-white",
    },
    {
      id: "xora",
      eyebrow: "Xora AI",
      title: "Not sure what to eat? Ask Xora.",
      body:
        country === "NG"
          ? "Your AI foodie wey sabi the best spots."
          : "Your AI foodie that knows the best spots.",
      cta: "Ask Xora",
      to: "/xora",
      image: dishEgusi,
      className: "text-white",
    },
    {
      id: "wallet",
      eyebrow: "NaijaEats Wallet",
      title: "Pay, request, or split the bill.",
      body: "Move money instantly with a NaijaEats username.",
      cta: "Open wallet",
      to: "/wallet",
      image: dishSuya,
      className: "text-white",
    },
  ];
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <RailHeader title="Made for your day" />
        <span className="hidden text-xs font-semibold text-muted-foreground sm:block">
          Swipe to explore
        </span>
      </div>
      <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.to}
            className={`group relative flex min-h-[210px] w-[88%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-lg p-5 sm:w-[440px] sm:p-6 ${banner.className}`}
          >
            <img
              src={banner.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
            <div className="relative">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f0bd43]">
                {banner.eyebrow}
              </div>
              <div className="mt-2 max-w-sm font-display text-2xl font-semibold leading-tight">
                {banner.title}
              </div>
              <div className="mt-2 max-w-sm text-xs leading-5 text-white/70">{banner.body}</div>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold">
                {banner.cta}{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Featured vendor rail — horizontal scroll with desktop arrows ─── */

function VendorRail({
  title,
  vendors,
  loading,
  symbol,
  country,
}: {
  title: string;
  vendors: any[];
  loading: boolean;
  symbol: (c: string) => string;
  country: "NG" | "UK";
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <RailHeader title={title} />
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll back"
            className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll forward"
            className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-3 flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[280px] aspect-[16/10] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No featured vendors yet"
          hint={`Naija Eats is growing in ${country === "NG" ? "Nigeria" : "the UK"} — check back soon.`}
        />
      ) : (
        <div
          ref={railRef}
          className="mt-4 -mx-4 flex gap-4 overflow-x-auto snap-x px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {vendors.map((v: any) => (
            <div key={v.id} className="snap-start shrink-0 w-[290px] sm:w-[350px]">
              <UberVendorCard v={v} symbol={symbol} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Uber Eats-style vendor card: image, name, fee · rating · time ─── */

export function UberVendorCard({ v, symbol }: { v: any; symbol: (c: string) => string }) {
  const fee = Number(v.delivery_fee ?? 0);
  const feeLabel =
    fee === 0 ? "Free delivery" : `${symbol(v.currency)}${fee.toLocaleString()} delivery`;
  return (
    <Link to="/vendor/$slug" params={{ slug: v.slug }} className="group block">
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        {v.cover_image_url ? (
          <img
            src={v.cover_image_url}
            alt={v.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200" />
        )}
        {v.is_featured && (
          <span className="absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 shadow">
            Featured
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[15px] text-foreground leading-snug truncate group-hover:underline">
            {v.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <IoBicycleOutline className="h-3.5 w-3.5" />
              {feeLabel}
            </span>
            {v.prep_time_minutes ? (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="inline-flex items-center gap-1">
                  <IoTimeOutline className="h-3.5 w-3.5" />
                  {v.prep_time_minutes} min
                </span>
              </>
            ) : null}
          </div>
        </div>
        {typeof v.rating === "number" && v.rating > 0 && (
          <span className="shrink-0 grid place-items-center h-8 w-8 rounded-full bg-muted text-[11px] font-bold text-foreground">
            {Number(v.rating).toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}

function RailHeader({ title }: { title: string }) {
  return (
    <h2 className="font-display text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
      {title}
    </h2>
  );
}

function EmptyState({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      {Icon && <Icon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />}
      <p className="font-bold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{hint}</p>
    </div>
  );
}

function CountryToggle({
  value,
  onChange,
}: {
  value: "NG" | "UK";
  onChange: (v: "NG" | "UK") => void;
}) {
  return (
    <div className="relative inline-flex h-11 w-[100px] shrink-0 items-center rounded-full bg-muted p-1 shadow-inner">
      <div
        className={`absolute top-1 bottom-1 w-[44px] rounded-full bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${value === "UK" ? "translate-x-[48px]" : "translate-x-0"}`}
      />
      <button
        type="button"
        onClick={() => onChange("NG")}
        className={`relative z-10 flex flex-1 items-center justify-center rounded-full transition-opacity duration-300 ${value === "NG" ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
        aria-label="Switch to Nigeria"
      >
        <img
          src="https://flagcdn.com/w40/ng.png"
          alt="NG"
          className="h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5"
        />
      </button>
      <button
        type="button"
        onClick={() => onChange("UK")}
        className={`relative z-10 flex flex-1 items-center justify-center rounded-full transition-opacity duration-300 ${value === "UK" ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
        aria-label="Switch to United Kingdom"
      >
        <img
          src="https://flagcdn.com/w40/gb.png"
          alt="UK"
          className="h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5"
        />
      </button>
    </div>
  );
}
