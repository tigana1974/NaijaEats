import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, ArrowLeft, Utensils, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { FoodCard, VendorCard } from "@/components/naija/customer-ui";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

const POPULAR_SEARCHES = ["Jollof Rice", "Suya", "Plantain", "Shawarma", "Burger"];
const ITEM_SEARCH_SELECT =
  "id, name, description, tags, price, image_url, is_available, is_featured, category:menu_categories(name), vendor:vendors!inner(id, slug, name, city, currency, country, status)";

type SearchVendor = {
  id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  city: string | null;
  rating: number | null;
  prep_time_minutes: number | null;
  delivery_fee: number | null;
  currency: string;
  is_featured: boolean | null;
};

type SearchItem = {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  price: number;
  image_url: string | null;
  is_featured: boolean;
  category: { name: string | null } | null;
  vendor: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    currency: string;
    country: string;
    status: string;
  } | null;
};

type SearchItemWithVendor = SearchItem & { vendor: NonNullable<SearchItem["vendor"]> };

function normalizeSearchValue(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function makeIlikePattern(value: string) {
  return `%${value.trim().replace(/[%_,()]/g, "")}%`;
}

function itemMatchesSearch(item: SearchItem, searchTerm: string) {
  const words = normalizeSearchValue(searchTerm).split(" ").filter(Boolean);
  if (words.length === 0) return false;

  const searchableText = normalizeSearchValue(
    [
      item.name,
      item.description,
      item.category?.name,
      item.vendor?.name,
      item.vendor?.city,
      ...(Array.isArray(item.tags) ? item.tags : []),
    ].join(" "),
  );

  return words.every((word) => searchableText.includes(word));
}

function hasApprovedVendor(item: SearchItem): item is SearchItemWithVendor {
  return item.vendor?.status === "approved";
}

function SearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const { data: vendors, isLoading: vendorsLoading } = useQuery<SearchVendor[]>({
    queryKey: ["search-vendors", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const like = makeIlikePattern(search);
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "approved")
        .or(`name.ilike.${like},tagline.ilike.${like},city.ilike.${like}`)
        .order("rating", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: search.trim().length > 1,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<SearchItemWithVendor[]>({
    queryKey: ["search-items", search],
    queryFn: async () => {
      const term = search.trim();
      if (!term) return [];
      const like = makeIlikePattern(term);
      const [textMatches, candidateMatches] = await Promise.all([
        supabase
          .from("menu_items")
          .select(ITEM_SEARCH_SELECT)
          .eq("is_available", true)
          .or(`name.ilike.${like},description.ilike.${like}`)
          .limit(100),
        supabase
          .from("menu_items")
          .select(ITEM_SEARCH_SELECT)
          .eq("is_available", true)
          .order("is_featured", { ascending: false })
          .limit(200),
      ]);
      if (textMatches.error) throw textMatches.error;
      if (candidateMatches.error) throw candidateMatches.error;

      const mergedItems = new Map<string, SearchItem>();
      [...(textMatches.data ?? []), ...(candidateMatches.data ?? [])].forEach((it) => {
        mergedItems.set(it.id, it as SearchItem);
      });

      return Array.from(mergedItems.values())
        .filter(
          (it): it is SearchItemWithVendor => hasApprovedVendor(it) && itemMatchesSearch(it, term),
        )
        .slice(0, 20);
    },
    enabled: search.trim().length > 1,
  });

  const hasResults = (vendors?.length ?? 0) > 0 || (items?.length ?? 0) > 0;
  const isSearching = search.trim().length > 1;

  return (
    <CustomerShell
      topBar={
        <div className="flex items-center gap-3 w-full py-1">
          <button
            onClick={() => navigate({ to: "/discover" })}
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-700" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--brand-clay)]" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for dishes or stores..."
              className="w-full rounded-full bg-zinc-50 border-transparent ring-1 ring-zinc-200 pl-10 pr-4 py-2.5 text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] transition"
            />
          </div>
        </div>
      }
    >
      <div className="pt-6 lg:max-w-3xl lg:mx-auto space-y-8">
        {!isSearching ? (
          <section>
            <h2 className="font-display text-lg font-bold text-zinc-900 mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearch(term)}
                  className="px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* Vendors Results */}
            {(vendorsLoading || (vendors && vendors.length > 0)) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Store className="h-5 w-5 text-zinc-400" />
                  <h2 className="font-display text-lg font-bold text-zinc-900">Stores</h2>
                </div>
                {vendorsLoading ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="aspect-[5/3] rounded-3xl bg-zinc-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {(vendors ?? []).map((v) => (
                      <VendorCard
                        key={v.id}
                        slug={v.slug}
                        name={v.name}
                        coverUrl={v.cover_image_url}
                        city={v.city}
                        rating={v.rating}
                        prepMinutes={v.prep_time_minutes}
                        deliveryLabel={`Delivery ${v.currency === "GBP" ? "£" : "₦"}${Number(v.delivery_fee || 0).toLocaleString()}`}
                        isFeatured={Boolean(v.is_featured)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Dishes Results */}
            {(itemsLoading || (items && items.length > 0)) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5 text-zinc-400" />
                  <h2 className="font-display text-lg font-bold text-zinc-900">Dishes</h2>
                </div>
                {itemsLoading ? (
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="aspect-[4/5] rounded-3xl bg-zinc-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                    {(items ?? []).map((it) => (
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
            )}

            {!vendorsLoading && !itemsLoading && !hasResults && (
              <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                <SearchIcon className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="font-semibold text-zinc-700">No results found</p>
                <p className="mt-1 text-sm text-zinc-500">
                  We couldn't find anything matching "{search}". Try searching for something else.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerShell>
  );
}
