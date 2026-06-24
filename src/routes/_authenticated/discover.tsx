import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { IoFastFood, IoBasket, IoRestaurant, IoSearch } from "react-icons/io5";
import { supabase } from "@/integrations/supabase/client";
import {
  CustomerLocationHeader,
  CustomerShell,
} from "@/components/naija/CustomerShell";
import { FeaturedPromoCard, FoodCard, FoodCategoryChips, VendorCard } from "@/components/naija/customer-ui";

/**
 * Customer Home / Discover.
 *
 * Data:
 *  - vendors: same query as the previous design (approved + country + type
 *    + name search), still ordered by featured then rating.
 *  - featuredItems: cross-vendor menu_items grid for the "New on..." section,
 *    so the home page is item-led rather than vendor-led (as in the reference).
 *
 * URL params kept light: ?focus=search opens the Search section focused so
 * the bottom nav's Search tab can deep-link here without a separate route.
 */
export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverPage,
});

type VendorType = "restaurant" | "home_chef" | "grocery" | "personal_chef" | "chef";

const TYPE_OPTIONS: { key: VendorType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "restaurant", label: "Restaurants", Icon: IoFastFood },
  { key: "grocery", label: "Grocery", Icon: IoBasket },
  { key: "chef", label: "Chefs", Icon: IoRestaurant },
];

function DiscoverPage() {
  const { user } = Route.useRouteContext();
  const [country, setCountry] = useState<"NG" | "UK">("NG");
  const [typeFilter, setTypeFilter] = useState<VendorType | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  // Vendors — approved only. Type filter is optional now.
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
      
      if (typeFilter === "chef") {
        q = q.in("type", ["home_chef", "personal_chef"]);
      } else if (typeFilter) {
        q = q.eq("type", typeFilter);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Featured cross-vendor items for the "Popular near you" / "New on" grids.
  // Joins to vendors so the card can show the vendor name and slug for links.
  const { data: featuredItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["discover-featured-items", country],
    queryFn: async () => {
      let q = supabase
        .from("menu_items")
        .select(
          "id, name, price, image_url, is_available, is_featured, description, vendor:vendors!inner(id, slug, name, currency, country, status)",
        )
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .limit(24);
      const { data, error } = await q;
      if (error) throw error;
      // Filter in JS to country + approved since join filtering on those
      // fields isn't straightforward with the supabase-js builder.
      return (data ?? []).filter(
        (it: any) => it.vendor?.country === country && it.vendor?.status === "approved",
      );
    },
  });

  const promoVendor = useMemo(
    () => (vendors ?? []).find((v: any) => v.is_featured) ?? (vendors ?? [])[0],
    [vendors],
  );

  const hasAnyResults = (vendors?.length ?? 0) > 0 || (featuredItems?.length ?? 0) > 0;
  const initialLoading = vendorsLoading && itemsLoading;

  return (
    <CustomerShell
      topBar={
        <CustomerLocationHeader />
      }
    >
      <div className="pt-3 lg:grid lg:grid-cols-[1.1fr_2fr] lg:gap-8">
        {/* LEFT column on desktop, hero stack on mobile */}
        <div className="space-y-5">
          {/* Search Dummy Input with Country Toggle */}
          <div className="flex items-center gap-3">
            <Link to="/search" className="relative block flex-1">
              <IoSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <div className="w-full rounded-full bg-white shadow-sm ring-1 ring-zinc-100 pl-12 pr-4 py-3.5 text-sm font-medium text-zinc-400 flex items-center transition-shadow hover:shadow-md">
                Search anything here...
              </div>
            </Link>
            <CountryToggle value={country} onChange={setCountry} />
          </div>

          {/* Hero promo card — points to the top featured vendor's storefront */}
          {promoVendor && (
            <FeaturedPromoCard
              title={`Discover ${promoVendor.name}`}
              body={promoVendor.tagline || "Fresh, authentic dishes cooked with culture. Order now and enjoy."}
              ctaLabel="Order Now"
              ctaTo={`/vendor/${promoVendor.slug}`}
              image={promoVendor.cover_image_url}
            />
          )}

          {/* Category chips */}
          <div>
            <FoodCategoryChips
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
              allLabel="All"
            />
          </div>
        </div>

        {/* RIGHT column on desktop, stacked sections on mobile */}
        <div className="mt-7 lg:mt-0 space-y-8">
          {/* Featured items grid — primary content */}
          <section>
            <SectionHeader title="Popular Food" action={null} />
            {itemsLoading ? (
              <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : (featuredItems ?? []).length === 0 ? (
              <EmptyState
                title="No items available right now"
                hint="Vendors will list dishes soon — try a different country."
              />
            ) : (
              <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
                {(featuredItems ?? []).slice(0, 9).map((it: any) => (
                  <FoodCard
                    key={it.id}
                    vendorSlug={it.vendor.slug}
                    itemId={it.id}
                    name={it.name}
                    imageUrl={it.image_url}
                    priceLabel={`${it.vendor.currency === "GBP" ? "£" : "₦"}${Number(it.price).toLocaleString()}`}
                    vendorName={it.vendor.name}
                    badge={it.is_featured ? "Top" : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Vendors row */}
          <section>
            <SectionHeader
              title={
                typeFilter
                  ? TYPE_OPTIONS.find((t) => t.key === typeFilter)?.label ?? "Vendors"
                  : "Vendors near you"
              }
              action={null}
            />
            {vendorsLoading ? (
              <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[16/10] rounded-[2rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : (vendors ?? []).length === 0 ? (
              <EmptyState
                title={
                  typeFilter
                    ? "No vendors in this category yet"
                    : "No vendors yet"
                }
                hint={`Check back soon as Naija Eats expands in ${country === "NG" ? "Nigeria" : "the UK"}.`}
              />
            ) : (
              <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                {(vendors ?? []).slice(0, 6).map((v: any) => (
                  <VendorCard
                    key={v.id}
                    slug={v.slug}
                    name={v.name}
                    coverUrl={v.cover_image_url}
                    city={v.city}
                    rating={v.rating}
                    prepMinutes={v.prep_time_minutes}
                    deliveryLabel={`Delivery ${v.currency === "GBP" ? "£" : "₦"}${Number(v.delivery_fee || 0).toLocaleString()}`}
                    isFeatured={v.is_featured}
                  />
                ))}
              </div>
            )}
          </section>

          {!initialLoading && !hasAnyResults && (
            <EmptyState
              title="Nothing here yet"
              hint={`Naija Eats is still growing in ${country === "NG" ? "Nigeria" : "the UK"}. Try the other country, or check back soon.`}
            />
          )}
        </div>
      </div>
    </CustomerShell>
  );
}

function SectionHeader({ title, action }: { title: string; action: React.ReactNode | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[var(--brand-clay)] to-[#ff6b35]" />
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-3 rounded-[1.75rem] border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50/80 to-white p-8 text-center">
      <p className="font-bold text-zinc-700">{title}</p>
      <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{hint}</p>
      <Link
        to="/discover"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-clay)] hover:underline"
      >
        Browse all <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CountryToggle({ value, onChange }: { value: "NG" | "UK"; onChange: (v: "NG" | "UK") => void }) {
  return (
    <div className="relative inline-flex h-11 w-[100px] shrink-0 items-center rounded-full bg-zinc-100 p-1 shadow-inner">
      <div 
        className={`absolute top-1 bottom-1 w-[44px] rounded-full bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${value === "UK" ? "translate-x-[48px]" : "translate-x-0"}`}
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
