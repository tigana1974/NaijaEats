import { createFileRoute, Link, notFound, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  IoStar, IoTime, IoLocation, IoChevronBack, IoChatbubbleEllipses,
  IoCartOutline, IoFlame, IoAdd, IoHeartOutline, IoShareOutline,
  IoLeafOutline, IoSearch,
} from "react-icons/io5";
import {
  PiCheckCircleDuotone, PiMedalDuotone, PiCookingPotDuotone,
  PiStorefrontDuotone, PiTruckDuotone, PiSealCheckDuotone,
} from "react-icons/pi";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/vendor/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Naija Eats` },
      { name: "description", content: "Browse the menu and order on Naija Eats." },
    ],
  }),
  component: VendorPage,
  errorComponent: ({ error }) => (
    <div className="min-h-dvh grid place-items-center p-6 text-center bg-white">
      <div>
        <h1 className="font-display text-2xl">Vendor unavailable</h1>
        <p className="text-zinc-500 mt-2">{error.message}</p>
        <Link to="/discover" className="text-[var(--brand-clay)] hover:underline mt-4 inline-block">
          Back to discover
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center p-6 text-center bg-white">
      <div>
        <h1 className="font-display text-2xl">Vendor not found</h1>
        <Link to="/discover" className="text-[var(--brand-clay)] hover:underline mt-4 inline-block">
          Back to discover
        </Link>
      </div>
    </div>
  ),
});

function VendorPage() {
  const { slug } = Route.useParams();
  const { cart, itemCount, subtotal } = useCart();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", slug],
    queryFn: async () => {
      const { data: vendor, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!vendor) throw notFound();

      const [{ data: categories }, { data: items }] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("vendor_id", vendor.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("vendor_id", vendor.id).order("is_featured", { ascending: false }),
      ]);
      return { vendor, categories: categories ?? [], items: items ?? [] };
    },
  });

  const matchRoute = useMatchRoute();
  const isItemRoute = matchRoute({ to: "/vendor/$slug/item/$itemId", fuzzy: true });

  if (isLoading) return <VendorSkeleton />;
  if (!data) return null;

  const { vendor, categories, items } = data;
  const fmt = (n: number) => `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const cartIsForThisVendor = cart?.vendorId === vendor.id;

  const grouped = categories.length
    ? categories.map((c: any) => ({
        category: c,
        items: items.filter((i: any) => i.category_id === c.id),
      }))
    : [{ category: { id: "all", name: "Menu" }, items }];

  if (isItemRoute) return <Outlet />;

  const commonProps = { vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt };

  if (vendor.type === "grocery") return <GroceryStoreLayout {...commonProps} />;
  if (vendor.type === "chef") return <ChefProfileLayout {...commonProps} />;
  return <RestaurantLayout {...commonProps} />;
}

function VendorSkeleton() {
  return (
    <div className="min-h-dvh bg-zinc-50 pb-16">
      <div className="h-[380px] w-full bg-gradient-to-br from-zinc-200 to-zinc-100 animate-pulse" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-16">
        <div className="rounded-3xl bg-white shadow-xl p-6 sm:p-8 animate-pulse">
          <div className="h-8 w-2/3 bg-zinc-100 rounded-full" />
          <div className="mt-3 h-4 w-1/2 bg-zinc-100 rounded-full" />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="h-16 rounded-2xl bg-zinc-100" />
            <div className="h-16 rounded-2xl bg-zinc-100" />
            <div className="h-16 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopIconButton({ to, ariaLabel, children, tone = "glass" }: { to?: string; ariaLabel: string; children: React.ReactNode; tone?: "glass" | "light" }) {
  const base =
    tone === "glass"
      ? "bg-black/25 backdrop-blur-md text-white hover:bg-black/40 ring-1 ring-white/15"
      : "bg-white/95 text-zinc-800 hover:bg-white shadow-sm ring-1 ring-black/5";
  const Cmp: any = to ? Link : "button";
  return (
    <Cmp to={to} aria-label={ariaLabel} className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${base}`}>
      {children}
    </Cmp>
  );
}

function TopBar({ backTo, itemCount, tone = "glass" }: { backTo: string; itemCount: number; tone?: "glass" | "light" }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
      <TopIconButton to={backTo} ariaLabel="Back" tone={tone}>
        <IoChevronBack className="h-6 w-6" />
      </TopIconButton>
      <div className="flex items-center gap-2">
        <TopIconButton ariaLabel="Share" tone={tone}>
          <IoShareOutline className="h-5 w-5" />
        </TopIconButton>
        <TopIconButton ariaLabel="Save" tone={tone}>
          <IoHeartOutline className="h-5 w-5" />
        </TopIconButton>
        <div className="relative">
          <TopIconButton to="/cart" ariaLabel="Cart" tone={tone}>
            <IoCartOutline className="h-6 w-6" />
          </TopIconButton>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────  RESTAURANT  ──────────────────────── */

function RestaurantLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  const isOpen = true; // placeholder — connect to hours when wired
  return (
    <div className="min-h-dvh bg-[oklch(0.985_0.002_90)] pb-32">
      {/* Cinematic Hero */}
      <div className="relative w-full h-[380px] sm:h-[440px]">
        {vendor.cover_image_url ? (
          <img src={vendor.cover_image_url} alt={vendor.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[var(--gradient-warm)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.7),transparent_65%)]" />

        <div className="absolute top-0 inset-x-0 z-20">
          <TopBar backTo="/discover" itemCount={itemCount} />
        </div>

        {/* Vendor Identity - Floating */}
        <div className="absolute bottom-0 inset-x-0 px-4 sm:px-6 pb-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center gap-2 text-white/90 text-xs font-semibold">
              {vendor.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-clay)] px-2.5 py-1 uppercase tracking-wider shadow-lg shadow-[var(--brand-clay)]/40">
                  <PiMedalDuotone className="h-3.5 w-3.5" /> Featured
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 border border-white/10">
                <PiSealCheckDuotone className="h-3.5 w-3.5 text-emerald-300" /> Verified kitchen
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full backdrop-blur-md px-2.5 py-1 border border-white/10 ${
                  isOpen ? "bg-emerald-500/20 text-emerald-100" : "bg-red-500/20 text-red-100"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {isOpen ? "Open now" : "Closed"}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[0.95] tracking-tight mt-4 text-white drop-shadow-lg">
              {vendor.name}
            </h1>
            {vendor.tagline && (
              <p className="text-white/85 mt-3 text-base sm:text-lg max-w-2xl leading-relaxed drop-shadow">
                {vendor.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-6 relative z-10">
        <div className="rounded-[2rem] bg-white shadow-[0_20px_60px_-24px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <InfoStat Icon={IoStar} tone="gold" primary={`${Number(vendor.rating || 0).toFixed(1)}`} secondary={`${vendor.rating_count || 0} reviews`} label="Rating" />
            <InfoStat Icon={IoTime} tone="clay" primary={`${vendor.prep_time_minutes ?? 30}m`} secondary="Prep time" label="Delivery" />
            <InfoStat Icon={PiTruckDuotone} tone="ink" primary={fmt(vendor.delivery_fee || 0)} secondary="Delivery fee" label="Fee" />
            <InfoStat Icon={IoLocation} tone="forest" primary={vendor.city || "—"} secondary="Local kitchen" label="Location" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/chats/$vendorId"
              params={{ vendorId: vendor.id }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-800 transition"
            >
              <IoChatbubbleEllipses className="h-4 w-4" /> Message the kitchen
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full bg-zinc-100 text-zinc-800 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition">
              <PiCookingPotDuotone className="h-4 w-4" /> About the chef
            </button>
          </div>
        </div>
      </div>

      <MenuSection grouped={grouped} vendor={vendor} />
      <CartBar cartIsForThisVendor={cartIsForThisVendor} itemCount={itemCount} subtotal={subtotal} fmt={fmt} />
    </div>
  );
}

/* ────────────────────────  GROCERY  ──────────────────────── */

function GroceryStoreLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  return (
    <div className="min-h-dvh bg-[oklch(0.985_0.005_150)] pb-32">
      {/* Fresh green hero */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-600 text-white pb-12 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-lime-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(2px_2px_at_20%_30%,white,transparent_50%),radial-gradient(2px_2px_at_80%_60%,white,transparent_50%),radial-gradient(2px_2px_at_40%_80%,white,transparent_50%)]" />

        <div className="relative">
          <TopBar backTo="/groceries" itemCount={itemCount} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-3xl bg-white p-1.5 shadow-2xl ring-1 ring-white/40 shrink-0">
              {vendor.logo_url || vendor.cover_image_url ? (
                <img src={vendor.logo_url || vendor.cover_image_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-full w-full rounded-2xl bg-emerald-100 grid place-items-center">
                  <PiStorefrontDuotone className="h-10 w-10 text-emerald-700" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                <IoLeafOutline className="h-3 w-3" /> Fresh groceries
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 tracking-tight leading-tight">{vendor.name}</h1>
              <p className="text-emerald-50/85 text-sm mt-1 flex items-center gap-1.5">
                <IoLocation className="h-4 w-4" /> {vendor.city}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              placeholder="Search yam, rice, palm oil…"
              className="w-full h-13 rounded-2xl bg-white text-zinc-900 pl-11 pr-4 py-3.5 text-sm placeholder:text-zinc-400 shadow-xl outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-6 relative z-10">
        <div className="rounded-2xl bg-white shadow-[0_16px_50px_-24px_rgba(6,78,59,0.35)] ring-1 ring-emerald-100/60 p-4 grid grid-cols-4 gap-2 text-center">
          <MiniStat label="Rating" value={`${Number(vendor.rating || 0).toFixed(1)}★`} />
          <MiniStat label="Delivery" value={`${vendor.prep_time_minutes ?? 30}m`} />
          <MiniStat label="Fee" value={fmt(vendor.delivery_fee || 0)} />
          <MiniStat label="Min order" value={fmt(vendor.min_order || 0)} />
        </div>
      </div>

      {/* Category chips */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {grouped.map(({ category }: any, i: number) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                i === 0
                  ? "bg-emerald-900 text-white border-emerald-900"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-400"
              }`}
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>

      <GroceryMenuSection grouped={grouped} vendor={vendor} />
      <CartBar cartIsForThisVendor={cartIsForThisVendor} itemCount={itemCount} subtotal={subtotal} fmt={fmt} tone="green" />
    </div>
  );
}

/* ────────────────────────  CHEF  ──────────────────────── */

function ChefProfileLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  return (
    <div className="min-h-dvh bg-[oklch(0.99_0.003_90)] pb-32">
      {/* Editorial hero */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[340px] overflow-hidden">
          {vendor.cover_image_url ? (
            <img src={vendor.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[var(--gradient-warm)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[oklch(0.99_0.003_90)]" />
        </div>

        <div className="relative z-10">
          <TopBar backTo="/discover" itemCount={itemCount} />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pt-24 sm:pt-32">
          <div className="rounded-[2.5rem] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.04] p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-zinc-200">
                  {vendor.logo_url || vendor.cover_image_url ? (
                    <img src={vendor.logo_url || vendor.cover_image_url} alt={vendor.name} className="h-full w-full object-cover" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-clay)] text-white shadow-lg ring-4 ring-white">
                  <PiCookingPotDuotone className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-clay)]/8 text-[var(--brand-clay)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                <PiMedalDuotone className="h-3.5 w-3.5" /> Chef
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-zinc-900 tracking-tight leading-[1.05]">
                {vendor.name}
              </h1>
              <p className="text-zinc-500 font-medium mt-1 text-sm">{vendor.city}</p>
              {(vendor.description || vendor.tagline) && (
                <p className="max-w-xl text-[15px] text-zinc-600 mt-5 leading-relaxed">
                  {vendor.description || vendor.tagline}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-bold">
                  <IoStar className="h-3.5 w-3.5" /> {Number(vendor.rating || 0).toFixed(1)} · {vendor.rating_count || 0}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 text-zinc-800 px-3 py-1.5 text-xs font-bold">
                  <IoTime className="h-3.5 w-3.5" /> {vendor.prep_time_minutes ?? 30} min
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-bold">
                  <PiSealCheckDuotone className="h-3.5 w-3.5" /> ID verified
                </span>
              </div>

              <div className="mt-7 flex items-center justify-center gap-3">
                <Link
                  to="/chats/$vendorId"
                  params={{ vendorId: vendor.id }}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-6 py-3 text-sm font-bold shadow-lg shadow-[var(--brand-clay)]/25 hover:scale-105 transition"
                >
                  <IoChatbubbleEllipses className="h-4 w-4" /> Message chef
                </Link>
                <a
                  href="#category-all"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`category-${grouped[0]?.category?.id}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-200 transition"
                >
                  See menu
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MenuSection grouped={grouped} vendor={vendor} />
      <CartBar cartIsForThisVendor={cartIsForThisVendor} itemCount={itemCount} subtotal={subtotal} fmt={fmt} />
    </div>
  );
}

/* ────────────────────────  Shared bits  ──────────────────────── */

function InfoStat({ Icon, tone, primary, secondary, label }: any) {
  const toneMap: Record<string, string> = {
    gold: "bg-amber-50 text-amber-700",
    clay: "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]",
    ink: "bg-zinc-100 text-zinc-800",
    forest: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneMap[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{label}</div>
        <div className="text-[15px] font-extrabold text-zinc-900 leading-tight truncate">{primary}</div>
        <div className="text-[11px] text-zinc-500 truncate">{secondary}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-extrabold text-zinc-900 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5">{label}</div>
    </div>
  );
}

function MenuSection({ grouped, vendor }: any) {
  const [tab, setTab] = useState<"menu" | "new" | "trending">("menu");

  // Flatten all items for the New / Trending filters
  const allItems: any[] = grouped.flatMap(({ items }: any) => items);

  // "New" = created in the last 30 days; fallback to the newest 12 items
  const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const sortedByNew = [...allItems].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
  const newItems = sortedByNew.filter(
    (i) => i.created_at && now - new Date(i.created_at).getTime() < NEW_WINDOW_MS,
  );
  const newFallback = sortedByNew.slice(0, 12);

  // "Trending" = flagged featured; fallback to first 12
  const trendingItems = allItems.filter((i) => i.is_featured);

  const pills = [
    { id: "menu" as const, label: "Menu", count: allItems.length },
    { id: "new" as const, label: "New", count: (newItems.length || newFallback.length) },
    { id: "trending" as const, label: "Trending", count: trendingItems.length },
  ];

  const fmtPrice = (n: number) =>
    `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;

  return (
    <>
      {/* Filter pill row — no top/bottom borders, brand-clay active */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {pills.map((p) => {
              const isActive = tab === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTab(p.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 sm:px-5 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-[var(--brand-clay)] text-white shadow-lg shadow-[var(--brand-clay)]/30 scale-[1.02]"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p.label}
                  {p.count > 0 && (
                    <span
                      className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-white text-zinc-500"
                      }`}
                    >
                      {p.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-6 space-y-14">
        {tab === "menu" ? (
          // Full menu grouped by category
          grouped.map(({ category, items }: any) => (
            <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
              <div className="flex items-end justify-between gap-3 mb-6">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  {category.name}
                </h3>
                <span className="text-xs font-semibold text-zinc-400">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </div>
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center text-zinc-400 text-sm">
                  Nothing in this section yet.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {items.map((item: any) => (
                    <HorizontalFoodCard
                      key={item.id}
                      vendorSlug={vendor.slug}
                      itemId={item.id}
                      name={item.name}
                      imageUrl={item.image_url}
                      priceLabel={fmtPrice(item.price)}
                      description={item.description}
                      badge={item.is_featured ? "Top" : undefined}
                      isAvailable={item.is_available}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        ) : (
          // New / Trending flat list
          <FilteredList
            title={tab === "new" ? "Fresh on the menu" : "Trending right now"}
            subtitle={
              tab === "new"
                ? "Just added by the kitchen"
                : "What everyone's ordering this week"
            }
            items={
              tab === "new"
                ? (newItems.length > 0 ? newItems : newFallback)
                : trendingItems
            }
            vendorSlug={vendor.slug}
            fmtPrice={fmtPrice}
            emptyMsg={
              tab === "new"
                ? "No new items yet — check back soon."
                : "Nothing trending right now."
            }
          />
        )}
      </div>
    </>
  );
}

function GroceryMenuSection({ grouped, vendor }: any) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-12">
      {grouped.map(({ category, items }: any) => (
        <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
          <div className="flex items-end justify-between mb-5">
            <h3 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">{category.name}</h3>
            <span className="text-xs font-semibold text-zinc-400">{items.length} item{items.length === 1 ? "" : "s"}</span>
          </div>
          {items.length === 0 ? (
            <p className="text-zinc-400 text-sm">Nothing in this section yet.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item: any) => (
                <GroceryCard
                  key={item.id}
                  vendorSlug={vendor.slug}
                  itemId={item.id}
                  name={item.name}
                  imageUrl={item.image_url}
                  priceLabel={`${vendor.currency === "GBP" ? "£" : "₦"}${Number(item.price).toLocaleString()}`}
                  isAvailable={item.is_available}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function FilteredList({
  title,
  subtitle,
  items,
  vendorSlug,
  fmtPrice,
  emptyMsg,
}: {
  title: string;
  subtitle: string;
  items: any[];
  vendorSlug: string;
  fmtPrice: (n: number) => string;
  emptyMsg: string;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-zinc-400 shrink-0">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center text-zinc-400 text-sm">
          {emptyMsg}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {items.map((item: any) => (
            <HorizontalFoodCard
              key={item.id}
              vendorSlug={vendorSlug}
              itemId={item.id}
              name={item.name}
              imageUrl={item.image_url}
              priceLabel={fmtPrice(item.price)}
              description={item.description}
              badge={item.is_featured ? "Top" : undefined}
              isAvailable={item.is_available}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CartBar({ cartIsForThisVendor, itemCount, subtotal, fmt, tone = "clay" }: any) {
  if (!cartIsForThisVendor || itemCount <= 0) return null;
  const gradient =
    tone === "green"
      ? "bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-emerald-500/25"
      : "bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] shadow-[var(--brand-clay)]/30";
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),1rem)] px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md">
        <Link
          to="/cart"
          className={`flex items-center justify-between gap-4 rounded-2xl ${gradient} px-5 py-4 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-transform`}
        >
          <span className="inline-flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <IoCartOutline className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-widest text-white/70">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
              <span className="text-sm font-extrabold">View basket</span>
            </span>
          </span>
          <span className="text-base font-extrabold tabular-nums">{fmt(subtotal)}</span>
        </Link>
      </div>
    </div>
  );
}

function HorizontalFoodCard({ vendorSlug, itemId, name, imageUrl, priceLabel, description, badge, isAvailable }: any) {
  const content = (
    <div
      className={`relative flex gap-5 p-4 rounded-[1.75rem] bg-white shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all duration-500 group ${
        isAvailable
          ? "hover:shadow-[0_16px_44px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-1 hover:ring-[var(--brand-clay)]/25"
          : "opacity-55 grayscale"
      }`}
    >
      <div className="flex-1 min-w-0 py-1 flex flex-col">
        {badge && (
          <span className="inline-flex items-center gap-1 w-max px-2.5 py-1 rounded-lg bg-amber-400/15 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-2.5">
            <IoFlame className="h-3 w-3 text-amber-500" />
            {badge} pick
          </span>
        )}
        <h4 className="font-bold text-zinc-900 text-[17px] leading-tight line-clamp-2 tracking-tight group-hover:text-[var(--brand-clay)] transition-colors duration-300">
          {name}
        </h4>
        {description && (
          <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed">{description}</p>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 justify-between">
          <div className="font-display font-extrabold text-lg text-zinc-900 tracking-tight">{priceLabel}</div>
          {!isAvailable && (
            <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg">
              Sold out
            </p>
          )}
        </div>
      </div>
      <div className="relative h-[128px] w-[128px] shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.05]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out ${isAvailable ? "group-hover:scale-110" : ""}`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" />
        )}
        {isAvailable && (
          <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg shadow-black/15 text-[var(--brand-clay)] scale-90 group-hover:scale-100 transition-all duration-300">
            <IoAdd className="h-5 w-5" strokeWidth={3} />
          </div>
        )}
      </div>
    </div>
  );
  if (!isAvailable) return content;
  return (
    <Link to="/vendor/$slug/item/$itemId" params={{ slug: vendorSlug, itemId }} className="block">
      {content}
    </Link>
  );
}

function GroceryCard({ vendorSlug, itemId, name, imageUrl, priceLabel, isAvailable }: any) {
  const content = (
    <div
      className={`group relative rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 ${
        isAvailable ? "hover:shadow-[0_12px_30px_-10px_rgba(6,78,59,0.25)] hover:-translate-y-0.5 hover:ring-emerald-400/40" : "opacity-55 grayscale"
      }`}
    >
      <div className="relative aspect-square bg-emerald-50 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className={`h-full w-full object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-110" : ""}`} />
        ) : (
          <div className="h-full w-full grid place-items-center text-emerald-300">
            <IoLeafOutline className="h-10 w-10" />
          </div>
        )}
        {isAvailable && (
          <button
            aria-label="Add"
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-700 transition"
          >
            <IoAdd className="h-5 w-5" strokeWidth={3} />
          </button>
        )}
        {!isAvailable && (
          <span className="absolute top-2 left-2 rounded-md bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
            Sold out
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2">{name}</h4>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="font-display text-base font-extrabold text-zinc-900">{priceLabel}</span>
        </div>
      </div>
    </div>
  );
  if (!isAvailable) return content;
  return (
    <Link to="/vendor/$slug/item/$itemId" params={{ slug: vendorSlug, itemId }} className="block">
      {content}
    </Link>
  );
}
