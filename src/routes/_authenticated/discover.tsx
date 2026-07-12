import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IoSearch, IoStar, IoTimeOutline, IoBicycleOutline } from "react-icons/io5";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/useMyProfile";
import {
  CustomerLocationHeader,
  CustomerShell,
} from "@/components/naija/CustomerShell";
import { FoodCard } from "@/components/naija/customer-ui";
import { categoryPhotos } from "@/assets/landing-images";
import { useCart } from "@/hooks/useCart";
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

/** Emoji category rail — mirrors the Uber Eats icon row. "kind" filters vendor
 * type; "keyword" filters dishes client-side by name/description match. */
const CATEGORIES: {
  id: string;
  label: string;
  emoji: string;
  kind?: VendorType;
  keyword?: string;
}[] = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "jollof", label: "Jollof", emoji: "🍚", keyword: "jollof" },
  { id: "suya", label: "Suya", emoji: "🍢", keyword: "suya" },
  { id: "soups", label: "Soups", emoji: "🍲", keyword: "soup" },
  { id: "swallow", label: "Swallow", emoji: "🥘", keyword: "pounded" },
  { id: "rice", label: "Rice", emoji: "🍛", keyword: "rice" },
  { id: "grills", label: "Grills", emoji: "🍗", keyword: "grill" },
  { id: "snacks", label: "Snacks", emoji: "🍩", keyword: "puff" },
  { id: "drinks", label: "Drinks", emoji: "🧋", keyword: "drink" },
  { id: "grocery", label: "Grocery", emoji: "🥬", kind: "grocery" },
  { id: "chefs", label: "Chefs", emoji: "👨🏾‍🍳", kind: "chef" },
  { id: "restaurants", label: "Restaurants", emoji: "🏪", kind: "restaurant" },
];

type QuickFilter = "top" | "fast" | "freeDelivery" | null;

function DiscoverPage() {
  const { data: profile } = useMyProfile();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState("");

  const [country, setCountryState] = useState<"NG" | "UK">(
    () => (typeof window !== "undefined" && (localStorage.getItem("ui_country") as "NG" | "UK")) || "NG",
  );
  const setCountry = (c: "NG" | "UK") => {
    setCountryState(c);
    localStorage.setItem("ui_country", c);
  };
  useEffect(() => {
    if (profile?.country && !localStorage.getItem("ui_country")) {
      setCountry(profile.country as "NG" | "UK");
    }
  }, [profile?.country]);

  const [category, setCategory] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
  const typeFilter = activeCategory.kind ?? null;
  const keyword = activeCategory.keyword ?? null;

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
    queryKey: ["discover-featured-items", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select(
          "id, name, price, image_url, is_available, is_featured, description, vendor:vendors!inner(id, slug, name, currency, country, status, delivery_fee, min_order)",
        )
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .limit(32);
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
    if (quickFilter === "fast") list = list.filter((v: any) => Number(v.prep_time_minutes ?? 999) <= 30);
    if (quickFilter === "freeDelivery") list = list.filter((v: any) => Number(v.delivery_fee ?? 0) === 0);
    return list;
  }, [vendors, quickFilter]);

  const filteredItems = useMemo(() => {
    let list = featuredItems ?? [];
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter((it: any) =>
        `${it.name} ${it.description ?? ""}`.toLowerCase().includes(k),
      );
    }
    return list;
  }, [featuredItems, keyword]);

  const featuredVendors = useMemo(
    () => filteredVendors.filter((v: any) => v.is_featured).concat(filteredVendors.filter((v: any) => !v.is_featured)).slice(0, 8),
    [filteredVendors],
  );

  const symbol = (c: string) => (c === "GBP" ? "£" : "₦");

  return (
    <CustomerShell
      topBar={<CustomerLocationHeader />}
      containerClassName="mx-auto w-full max-w-6xl px-3 sm:px-5 pb-28 lg:pb-12"
    >
      <div className="pt-2 space-y-6">
        {/* ─── 1 · Search + country ───
            The typeable search box only shows on mobile; on desktop the shell's
            top bar already provides global search, so here we just right-align
            the country toggle. */}
        <div className="flex items-center gap-3 lg:justify-end">
          <form
            className="relative flex-1 lg:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: searchDraft.trim() ? { q: searchDraft.trim() } : {} });
            }}
          >
            <IoSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search Naija Eats"
              aria-label="Search Naija Eats"
              className="w-full rounded-full bg-muted/60 ring-1 ring-border pl-12 pr-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[var(--brand-clay)]/40 focus:bg-card transition"
            />
          </form>
          <CountryToggle value={country} onChange={setCountry} />
        </div>

        {/* ─── 2 · Category icon rail ─── */}
        <div className="-mx-3 sm:-mx-5 px-3 sm:px-5 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(active ? "all" : c.id)}
                className={`flex flex-col items-center gap-1.5 shrink-0 px-3 py-2 rounded-2xl transition ${
                  active ? "bg-foreground/5" : "hover:bg-muted/60"
                }`}
                aria-pressed={active}
              >
                <span
                  className={`relative grid place-items-center h-14 w-14 rounded-full overflow-hidden transition ${
                    active ? "ring-2 ring-[var(--brand-clay)] ring-offset-2 ring-offset-background" : "ring-1 ring-border"
                  }`}
                >
                  <img
                    src={categoryPhotos[c.id]}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      // Photo unavailable → fall back to the emoji tile
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-[24px]">{c.emoji}</span>
                </span>
                <span className={`text-[11px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── 3 · Filter chips ─── */}
        <div className="-mx-3 sm:-mx-5 px-3 sm:px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: "top", label: "⭐ Highest rated" },
              { id: "fast", label: "⏱ Under 30 min" },
              { id: "freeDelivery", label: "🚴 Free delivery" },
            ] as { id: Exclude<QuickFilter, null>; label: string }[]
          ).map((f) => {
            const active = quickFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(active ? null : f.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted/70 text-foreground hover:bg-muted"
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            );
          })}
        </div>

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

        {/* ─── 6 · Popular food grid ─── */}
        <section>
          <RailHeader title={keyword ? `${activeCategory.label} near you` : "Popular near you"} />
          {itemsLoading ? (
            <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={keyword ? `No ${activeCategory.label.toLowerCase()} dishes right now` : "No items available right now"}
              hint="Try another category, or check back soon."
            />
          ) : (
            <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filteredItems.slice(0, 12).map((it: any) => (
                <FoodCard
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

        {/* ─── 7 · All vendors ─── */}
        <section>
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
                <div key={i} className="aspect-[16/10] rounded-2xl bg-muted animate-pulse" />
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
      </div>
    </CustomerShell>
  );
}

/* ─── Promo banner carousel — colourful cards like the Uber Eats strip ─── */

function PromoCarousel({ country }: { country: "NG" | "UK" }) {
  const banners = [
    {
      id: "book",
      title: "Plan your whole week of meals",
      body: "Breakfast, lunch and dinner booked in one go.",
      cta: "Book now",
      to: "/book",
      bg: "linear-gradient(120deg, oklch(0.9 0.09 85), oklch(0.85 0.12 70))",
      fg: "#3a2a08",
    },
    {
      id: "xora",
      title: "Ask Xora what to eat",
      body: country === "NG" ? "Your AI foodie wey sabi the best spots." : "Your AI foodie that knows the best spots.",
      cta: "Chat with Xora",
      to: "/xora",
      bg: "linear-gradient(120deg, oklch(0.62 0.19 25), oklch(0.5 0.2 30))",
      fg: "#ffffff",
    },
    {
      id: "wallet",
      title: "Pay friends with your wallet",
      body: "Send and receive funds by username.",
      cta: "Open wallet",
      to: "/wallet",
      bg: "linear-gradient(120deg, oklch(0.55 0.13 150), oklch(0.42 0.12 160))",
      fg: "#ffffff",
    },
  ];
  return (
    <div className="-mx-3 sm:-mx-5 px-3 sm:px-5 flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {banners.map((b) => (
        <Link
          key={b.id}
          to={b.to}
          className="snap-start shrink-0 w-[85%] sm:w-[420px] rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[150px] transition hover:opacity-95"
          style={{ background: b.bg, color: b.fg }}
        >
          <div>
            <div className="font-display text-lg sm:text-xl font-bold leading-tight">{b.title}</div>
            <div className="mt-1 text-[13px] opacity-80">{b.body}</div>
          </div>
          <span
            className="mt-4 inline-flex w-fit items-center rounded-full px-4 py-1.5 text-[12px] font-bold"
            style={{ background: b.fg, color: b.fg === "#ffffff" ? "#1a1a1a" : "#fff" }}
          >
            {b.cta}
          </span>
        </Link>
      ))}
    </div>
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
            <div key={i} className="shrink-0 w-[280px] aspect-[16/10] rounded-2xl bg-muted animate-pulse" />
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
          className="mt-3 -mx-3 sm:-mx-5 px-3 sm:px-5 flex gap-4 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {vendors.map((v: any) => (
            <div key={v.id} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
              <UberVendorCard v={v} symbol={symbol} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Uber Eats-style vendor card: image, name, fee · rating · time ─── */

function UberVendorCard({ v, symbol }: { v: any; symbol: (c: string) => string }) {
  const fee = Number(v.delivery_fee ?? 0);
  const feeLabel = fee === 0 ? "Free delivery" : `${symbol(v.currency)}${fee.toLocaleString()} delivery`;
  return (
    <Link
      to="/vendor/$slug"
      params={{ slug: v.slug }}
      className="group block"
    >
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
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
          <span className="absolute top-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 shadow">
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
  return <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>;
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <p className="font-bold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{hint}</p>
    </div>
  );
}

function CountryToggle({ value, onChange }: { value: "NG" | "UK"; onChange: (v: "NG" | "UK") => void }) {
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
        <img src="https://flagcdn.com/w40/ng.png" alt="NG" className="h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("UK")}
        className={`relative z-10 flex flex-1 items-center justify-center rounded-full transition-opacity duration-300 ${value === "UK" ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
        aria-label="Switch to United Kingdom"
      >
        <img src="https://flagcdn.com/w40/gb.png" alt="UK" className="h-[18px] w-[26px] rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
      </button>
    </div>
  );
}
