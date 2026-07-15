import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/hooks/useMyProfile";
import { RoleShell } from "@/components/naija/RoleShell";
import { UberVendorCard } from "./discover";
import { useCountry, hasStoredCountry } from "@/hooks/useCountry";

export const Route = createFileRoute("/_authenticated/groceries")({
  component: GroceriesPage,
});



function GroceriesPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useMyProfile();

  const [country, setCountry] = useCountry();

  // When profile loads, if user hasn't explicitly set a country, use their profile country
  useEffect(() => {
    if (profile?.country && !hasStoredCountry()) {
      setCountry(profile.country as "NG" | "UK");
    }
  }, [profile?.country]);



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

  const topStores = (vendors ?? []).slice(0, 5);
  const otherStores = (vendors ?? []).slice(5);

  const symbol = (c: string) => (c === "GBP" ? "£" : "₦");

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
          <h1 className="hidden lg:block font-display text-2xl font-bold tracking-tight">Groceries</h1>


          <section>
            <SectionHeader title="Top Stores" />
            {vendorsLoading ? (
              <div className="mt-4 flex gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[280px] aspect-[16/9] rounded-2xl bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : topStores.length === 0 ? (
              <EmptyState title="No stores yet" hint={`Check back soon as we expand in ${country === "NG" ? "Nigeria" : "the UK"}.`} />
            ) : (
              <div className="-mx-4 sm:mx-0 px-4 sm:px-0 mt-4 flex gap-4 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {topStores.map((v: any) => (
                  <div key={v.id} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
                    <UberVendorCard v={v} symbol={symbol} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {otherStores.length > 0 && (
            <section className="mt-8">
              <SectionHeader title="More Stores" />
              <div className="mt-4 grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                {otherStores.map((v: any) => (
                  <UberVendorCard key={v.id} v={v} symbol={symbol} />
                ))}
              </div>
            </section>
          )}
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
