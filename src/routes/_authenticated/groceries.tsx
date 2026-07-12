import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Leaf, Apple, Coffee, Milk } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/useMyProfile";
import { RoleShell } from "@/components/naija/RoleShell";
import { FoodCard, VendorCard } from "@/components/naija/customer-ui";

export const Route = createFileRoute("/_authenticated/groceries")({
  component: GroceriesPage,
});

const GROCERY_CATEGORIES = [
  { id: "produce", label: "Produce", Icon: Leaf },
  { id: "pantry", label: "Pantry", Icon: Apple },
  { id: "beverages", label: "Drinks", Icon: Coffee },
  { id: "dairy", label: "Dairy", Icon: Milk },
];

function GroceriesPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useMyProfile();

  const [country, setCountryState] = useState<"NG" | "UK">(
    () => (typeof window !== "undefined" && localStorage.getItem("ui_country") as "NG" | "UK") || "NG"
  );
  
  // Update local storage whenever country changes
  const setCountry = (c: "NG" | "UK") => {
    setCountryState(c);
    localStorage.setItem("ui_country", c);
  };

  // When profile loads, if user hasn't explicitly set a country in localStorage, use their profile country
  useEffect(() => {
    if (profile?.country && !localStorage.getItem("ui_country")) {
      setCountry(profile.country as "NG" | "UK");
    }
  }, [profile?.country]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["groceries-vendors", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "approved")
        .eq("country", country)
        .eq("type", "grocery")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["groceries-items", country, activeCategory],
    queryFn: async () => {
      let q = supabase
        .from("menu_items")
        .select("id, name, price, image_url, is_available, is_featured, vendor:vendors!inner(id, slug, name, currency, country, status, type)")
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .limit(24);
      
      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).filter(
        (it: any) => it.vendor?.country === country && it.vendor?.status === "approved" && it.vendor?.type === "grocery"
      );
    },
  });

  return (
    <RoleShell
      topBar={
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3 shrink-0">
            <div className="min-w-0">
              <div className="text-xl font-bold truncate text-zinc-900">Groceries</div>
            </div>
          </div>
          <CountryToggle value={country} onChange={setCountry} />
        </div>
      }
    >
      <div className="pt-3 w-full max-w-2xl lg:max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="hidden lg:flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold tracking-tight">Groceries</h1>
            <CountryToggle value={country} onChange={setCountry} />
          </div>
          {/* Quick Categories */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {GROCERY_CATEGORIES.map((cat) => {
              const Icon = cat.Icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/25 -translate-y-0.5"
                      : "bg-white ring-1 ring-zinc-200/80 text-zinc-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {cat.label}
                </button>
              );
            })}
          </div>

          <section>
            <SectionHeader title={activeCategory ? "Category Results" : "Fresh Daily"} />
            {itemsLoading ? (
              <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : (items ?? []).length === 0 ? (
              <EmptyState title="No items available right now" hint="Vendors will list groceries soon." />
            ) : (
              <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {(items ?? []).map((it: any) => (
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

          <section>
            <SectionHeader title="Top Stores" />
            {vendorsLoading ? (
              <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-[16/10] rounded-[2rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : (vendors ?? []).length === 0 ? (
              <EmptyState title="No stores yet" hint={`Check back soon as we expand in ${country === "NG" ? "Nigeria" : "the UK"}.`} />
            ) : (
              <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(vendors ?? []).map((v: any) => (
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
        </div>
      </div>
    </RoleShell>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[var(--brand-clay)] to-[#ff6b35]" />
      <h2 className="font-display text-xl font-bold text-zinc-900 tracking-tight">{title}</h2>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-4 rounded-[1.75rem] border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50/80 to-white p-8 text-center">
      <p className="font-bold text-zinc-700">{title}</p>
      <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{hint}</p>
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
