import { createFileRoute, Link, notFound, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  IoStar,
  IoTime,
  IoLocation,
  IoChevronBack,
  IoChatbubbleEllipses,
  IoCartOutline,
  IoFlame,
  IoAdd,
  IoHeart,
  IoHeartOutline,
  IoShareOutline,
  IoLeafOutline,
  IoSearch,
} from "react-icons/io5";
import {
  PiCheckCircleDuotone,
  PiMedalDuotone,
  PiCookingPotDuotone,
  PiStorefrontDuotone,
  PiTruckDuotone,
  PiSealCheckDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { chefPortrait, groceryMarket, restaurantDining } from "@/assets/landing-images";

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
  const { carts, itemCount } = useCart();

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
        supabase
          .from("menu_items")
          .select("*")
          .eq("vendor_id", vendor.id)
          .order("is_featured", { ascending: false }),
      ]);
      return { vendor, categories: categories ?? [], items: items ?? [] };
    },
  });

  const matchRoute = useMatchRoute();
  const isItemRoute = matchRoute({ to: "/vendor/$slug/item/$itemId", fuzzy: true });

  if (isLoading) return <VendorSkeleton />;
  if (!data) return null;

  const { vendor, categories, items } = data;
  const fmt = (n: number) =>
    `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;

  const vendorCart = carts[vendor.id];
  const subtotal = vendorCart?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const cartIsForThisVendor = !!vendorCart && vendorCart.items.length > 0;

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

function TopIconButton({
  to,
  ariaLabel,
  onClick,
  children,
  tone = "glass",
}: {
  to?: string;
  ariaLabel: string;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "glass" | "light";
}) {
  const base =
    tone === "glass"
      ? "bg-black/25 backdrop-blur-md text-white hover:bg-black/40 ring-1 ring-white/15"
      : "bg-white/95 text-zinc-800 hover:bg-white shadow-sm ring-1 ring-black/5";
  const Cmp: any = to ? Link : "button";
  return (
    <Cmp
      to={to}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${base}`}
    >
      {children}
    </Cmp>
  );
}

function TopBar({
  backTo,
  itemCount,
  vendor,
  tone = "glass",
}: {
  backTo: string;
  itemCount: number;
  vendor?: any;
  tone?: "glass" | "light";
}) {
  const [saved, setSaved] = useState(() => (vendor ? isFavorite(vendor.id) : false));

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = vendor?.name ? `${vendor.name} on Naija Eats` : "Naija Eats";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const save = () => {
    if (!vendor) return;
    const nowSaved = toggleFavorite(vendor.id);
    setSaved(nowSaved);
    toast.success(
      nowSaved
        ? `${vendor.name} saved to your favourites`
        : `${vendor.name} removed from favourites`,
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
      <TopIconButton to={backTo} ariaLabel="Back" tone={tone}>
        <IoChevronBack className="h-6 w-6" />
      </TopIconButton>
      <div className="flex items-center gap-2">
        <TopIconButton ariaLabel="Share" tone={tone} onClick={share}>
          <IoShareOutline className="h-5 w-5" />
        </TopIconButton>
        <TopIconButton
          ariaLabel={saved ? "Remove from favourites" : "Save to favourites"}
          tone={tone}
          onClick={save}
        >
          {saved ? (
            <IoHeart className="h-5 w-5 text-[var(--brand-clay)]" />
          ) : (
            <IoHeartOutline className="h-5 w-5" />
          )}
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
    <div className="min-h-dvh bg-[#f7f7f4] pb-32">
      {/* Cinematic Hero */}
      <div className="relative h-[420px] w-full overflow-hidden sm:h-[500px]">
        {vendor.cover_image_url ? (
          <img
            src={vendor.cover_image_url}
            alt={vendor.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={restaurantDining} alt={vendor.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />

        <div className="absolute top-0 inset-x-0 z-20">
          <TopBar backTo="/discover" itemCount={itemCount} vendor={vendor} />
        </div>

        {/* Vendor Identity - Floating */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-6 sm:pb-10">
          <div className="mx-auto max-w-7xl">
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
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                />
                {isOpen ? "Open now" : "Closed"}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-none tracking-normal text-white sm:text-6xl">
              {vendor.name}
            </h1>
            {vendor.tagline && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                {vendor.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-5 rounded-lg border border-black/5 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.45)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-6">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <InfoStat
              Icon={IoStar}
              tone="gold"
              primary={`${Number(vendor.rating || 0).toFixed(1)}`}
              secondary={`${vendor.rating_count || 0} reviews`}
              label="Rating"
            />
            <InfoStat
              Icon={IoTime}
              tone="clay"
              primary={`${vendor.prep_time_minutes ?? 30}m`}
              secondary="Prep time"
              label="Delivery"
            />
            <InfoStat
              Icon={PiTruckDuotone}
              tone="ink"
              primary={fmt(vendor.delivery_fee || 0)}
              secondary="Delivery fee"
              label="Fee"
            />
            <InfoStat
              Icon={IoLocation}
              tone="forest"
              primary={vendor.city || "—"}
              secondary="Local kitchen"
              label="Location"
            />
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              to="/chats/$vendorId"
              params={{ vendorId: vendor.id }}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#171714] px-5 text-sm font-semibold text-white transition hover:bg-black"
            >
              <IoChatbubbleEllipses className="h-4 w-4" /> Message the kitchen
            </Link>
            <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
              <PiCookingPotDuotone className="h-4 w-4" /> About the chef
            </button>
          </div>
        </div>
      </div>

      <MenuSection grouped={grouped} vendor={vendor} />
      <CartBar
        cartIsForThisVendor={cartIsForThisVendor}
        itemCount={itemCount}
        subtotal={subtotal}
        fmt={fmt}
      />
    </div>
  );
}

/* ────────────────────────  GROCERY  ──────────────────────── */

function GroceryStoreLayout({
  vendor,
  grouped,
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt,
}: any) {
  const [productQuery, setProductQuery] = useState("");
  const pq = productQuery.trim().toLowerCase();
  // Filter every category's products by the store search box.
  const visibleGroups = pq
    ? grouped
        .map(({ category, items }: any) => ({
          category,
          items: items.filter((i: any) =>
            [i.name, i.description]
              .filter(Boolean)
              .some((s: string) => s.toLowerCase().includes(pq)),
          ),
        }))
        .filter(({ items }: any) => items.length > 0)
    : grouped;

  return (
    <div className="min-h-dvh bg-[#f5f7f2] pb-32">
      <div className="relative overflow-hidden bg-[#163d2b] pb-10 text-white">
        <img
          src={vendor.cover_image_url || groceryMarket}
          alt="Fresh grocery produce"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[#163d2b]/70" />

        <div className="relative">
          <TopBar backTo="/groceries" itemCount={itemCount} vendor={vendor} />
        </div>

        <div className="relative mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="grid gap-7 lg:grid-cols-[1fr_420px] lg:items-end">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 shrink-0 rounded-lg bg-white p-1 shadow-xl ring-1 ring-white/30">
                {vendor.logo_url || vendor.cover_image_url ? (
                  <img
                    src={vendor.logo_url || vendor.cover_image_url}
                    alt=""
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-md bg-emerald-100">
                    <PiStorefrontDuotone className="h-10 w-10 text-emerald-700" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                  <IoLeafOutline className="h-3 w-3" /> Fresh groceries
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 tracking-tight leading-tight">
                  {vendor.name}
                </h1>
                <p className="text-emerald-50/85 text-sm mt-1 flex items-center gap-1.5">
                  <IoLocation className="h-4 w-4" /> {vendor.city}
                </p>
                <Link
                  to="/chats/$vendorId"
                  params={{ vendorId: vendor.id }}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <IoChatbubbleEllipses className="h-4 w-4" /> Message store
                </Link>
              </div>
            </div>
            <div className="relative lg:mb-1">
              <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search yam, rice, palm oil…"
                className="h-13 w-full rounded-lg border border-white/20 bg-white pl-11 pr-4 text-sm text-zinc-900 shadow-xl outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#f0bd43]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="relative z-10 mx-auto -mt-4 max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-emerald-950/5 bg-emerald-950/10 p-px text-center shadow-[0_16px_45px_-32px_rgba(6,78,59,0.5)] sm:grid-cols-4">
          <MiniStat label="Rating" value={`${Number(vendor.rating || 0).toFixed(1)}★`} />
          <MiniStat label="Delivery" value={`${vendor.prep_time_minutes ?? 30}m`} />
          <MiniStat label="Fee" value={fmt(vendor.delivery_fee || 0)} />
          <MiniStat label="Min order" value={fmt(vendor.min_order || 0)} />
        </div>
      </div>

      {/* Category chips */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {visibleGroups.map(({ category }: any, i: number) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`category-${category.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                i === 0
                  ? "bg-[#163d2b] text-white border-[#163d2b]"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-400"
              }`}
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>

      {pq && visibleGroups.length === 0 && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-10 text-center text-sm text-zinc-500">
          Nothing matches "{productQuery}" in this store.
        </div>
      )}
      <GroceryMenuSection grouped={visibleGroups} vendor={vendor} />
      <CartBar
        cartIsForThisVendor={cartIsForThisVendor}
        itemCount={itemCount}
        subtotal={subtotal}
        fmt={fmt}
        tone="green"
      />
    </div>
  );
}

/* ────────────────────────  CHEF  ──────────────────────── */

function ChefProfileLayout({
  vendor,
  grouped,
  cartIsForThisVendor,
  itemCount,
  subtotal,
  fmt,
}: any) {
  return (
    <div className="min-h-dvh bg-[#f7f5f1] pb-32">
      {/* Editorial hero */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[390px] overflow-hidden">
          {vendor.cover_image_url ? (
            <img src={vendor.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <img src={chefPortrait} alt="Chef at work" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#f7f5f1] to-transparent" />
        </div>

        <div className="relative z-10">
          <TopBar backTo="/discover" itemCount={itemCount} vendor={vendor} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-40">
          <div className="rounded-lg border border-black/5 bg-white p-6 shadow-[0_28px_70px_-44px_rgba(0,0,0,0.5)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr_auto] lg:items-center">
              <div className="relative">
                <div className="mx-auto h-36 w-36 overflow-hidden rounded-lg bg-zinc-200 shadow-xl ring-1 ring-black/5 lg:mx-0 lg:h-44 lg:w-44">
                  {vendor.logo_url || vendor.cover_image_url ? (
                    <img
                      src={vendor.logo_url || vendor.cover_image_url}
                      alt={vendor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-[var(--brand-clay)] text-white shadow-lg ring-4 ring-white lg:left-auto lg:right-[-8px] lg:translate-x-0">
                  <PiCookingPotDuotone className="h-5 w-5" />
                </span>
              </div>

              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-clay)]/8 text-[var(--brand-clay)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  <PiMedalDuotone className="h-3.5 w-3.5" /> Chef
                </div>
                <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-normal text-zinc-900 sm:text-5xl">
                  {vendor.name}
                </h1>
                <p className="text-zinc-500 font-medium mt-1 text-sm">{vendor.city}</p>
                {(vendor.description || vendor.tagline) && (
                  <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-600 lg:mx-0">
                    {vendor.description || vendor.tagline}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-bold">
                    <IoStar className="h-3.5 w-3.5" /> {Number(vendor.rating || 0).toFixed(1)} ·{" "}
                    {vendor.rating_count || 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 text-zinc-800 px-3 py-1.5 text-xs font-bold">
                    <IoTime className="h-3.5 w-3.5" /> {vendor.prep_time_minutes ?? 30} min
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-bold">
                    <PiSealCheckDuotone className="h-3.5 w-3.5" /> ID verified
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:flex-col">
                <Link
                  to="/chats/$vendorId"
                  params={{ vendorId: vendor.id }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#171714] px-6 text-sm font-bold text-white transition hover:bg-black"
                >
                  <IoChatbubbleEllipses className="h-4 w-4" /> Message chef
                </Link>
                <a
                  href="#category-all"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(`category-${grouped[0]?.category?.id}`)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
                >
                  See menu
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MenuSection grouped={grouped} vendor={vendor} />
      <CartBar
        cartIsForThisVendor={cartIsForThisVendor}
        itemCount={itemCount}
        subtotal={subtotal}
        fmt={fmt}
      />
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
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${toneMap[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{label}</div>
        <div className="text-[15px] font-extrabold text-zinc-900 leading-tight truncate">
          {primary}
        </div>
        <div className="text-[11px] text-zinc-500 truncate">{secondary}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-3 py-4">
      <div className="text-sm font-extrabold text-zinc-900 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5">
        {label}
      </div>
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
    { id: "new" as const, label: "New", count: newItems.length || newFallback.length },
    { id: "trending" as const, label: "Trending", count: trendingItems.length },
  ];

  const fmtPrice = (n: number) =>
    `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;

  return (
    <>
      {/* Filter pill row — no top/bottom borders, brand-clay active */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
                        isActive ? "bg-white/25 text-white" : "bg-white text-zinc-500"
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

      <div className="mx-auto mt-8 max-w-7xl space-y-14 px-4 sm:px-6">
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
                <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
                  Nothing in this section yet.
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {items.map((item: any) => (
                    <HorizontalFoodCard
                      key={item.id}
                      vendor={vendor}
                      item={item}
                      priceLabel={fmtPrice(item.price)}
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
              tab === "new" ? "Just added by the kitchen" : "What everyone's ordering this week"
            }
            items={tab === "new" ? (newItems.length > 0 ? newItems : newFallback) : trendingItems}
            vendor={vendor}
            fmtPrice={fmtPrice}
            emptyMsg={
              tab === "new" ? "No new items yet — check back soon." : "Nothing trending right now."
            }
          />
        )}
      </div>
    </>
  );
}

function GroceryMenuSection({ grouped, vendor }: any) {
  return (
    <div className="mx-auto mt-8 max-w-7xl space-y-12 px-4 sm:px-6">
      {grouped.map(({ category, items }: any) => (
        <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
          <div className="flex items-end justify-between mb-5">
            <h3 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">
              {category.name}
            </h3>
            <span className="text-xs font-semibold text-zinc-400">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>
          {items.length === 0 ? (
            <p className="text-zinc-400 text-sm">Nothing in this section yet.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item: any) => (
                <GroceryCard
                  key={item.id}
                  vendor={vendor}
                  item={item}
                  priceLabel={`${vendor.currency === "GBP" ? "£" : "₦"}${Number(item.price).toLocaleString()}`}
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
  vendor,
  fmtPrice,
  emptyMsg,
}: {
  title: string;
  subtitle: string;
  items: any[];
  vendor: any;
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
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
          {emptyMsg}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {items.map((item: any) => (
            <HorizontalFoodCard
              key={item.id}
              vendor={vendor}
              item={item}
              priceLabel={fmtPrice(item.price)}
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
    tone === "green" ? "bg-[#163d2b] shadow-emerald-950/20" : "bg-[#171714] shadow-black/20";
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),1rem)] px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md">
        <Link
          to="/cart"
          className={`flex items-center justify-between gap-4 rounded-lg ${gradient} px-5 py-4 text-white shadow-2xl transition-transform hover:-translate-y-0.5 active:translate-y-0`}
        >
          <span className="inline-flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <IoCartOutline className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-widest text-white/70">
                {itemCount} item{itemCount > 1 ? "s" : ""}
              </span>
              <span className="text-sm font-extrabold">View basket</span>
            </span>
          </span>
          <span className="text-base font-extrabold tabular-nums">{fmt(subtotal)}</span>
        </Link>
      </div>
    </div>
  );
}

function HorizontalFoodCard({ vendor, item, priceLabel }: any) {
  const { addItem } = useCart();
  const isAvailable = item.is_available;
  const badge = item.is_featured ? "Top" : undefined;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: Number(vendor.delivery_fee || 0),
        minOrder: Number(vendor.min_order || 0),
      },
      { menuItemId: item.id, name: item.name, price: Number(item.price), imageUrl: item.image_url },
    );
    toast.success(`${item.name} added to basket`);
  };

  const content = (
    <div
      className={`group relative flex gap-4 rounded-lg bg-white p-4 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.16)] ring-1 ring-black/[0.05] transition-all duration-300 ${
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
          {item.name}
        </h4>
        {item.description && (
          <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 justify-between">
          <div className="font-display font-extrabold text-lg text-zinc-900 tracking-tight">
            {priceLabel}
          </div>
          {!isAvailable && (
            <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg">
              Sold out
            </p>
          )}
        </div>
      </div>
      <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-black/[0.05] sm:h-[132px] sm:w-[132px]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out ${isAvailable ? "group-hover:scale-110" : ""}`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" />
        )}
        {isAvailable && (
          <button
            aria-label={`Add ${item.name} to basket`}
            onClick={quickAdd}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg shadow-black/15 text-[var(--brand-clay)] scale-90 group-hover:scale-100 active:scale-90 transition-all duration-300"
          >
            <IoAdd className="h-5 w-5" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
  if (!isAvailable) return content;
  return (
    <Link
      to="/vendor/$slug/item/$itemId"
      params={{ slug: vendor.slug, itemId: item.id }}
      className="block"
    >
      {content}
    </Link>
  );
}

function GroceryCard({ vendor, item, priceLabel }: any) {
  const { addItem } = useCart();
  const isAvailable = item.is_available;

  // + adds straight to the basket; tapping anywhere else on the card opens
  // the product details page.
  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: Number(vendor.delivery_fee || 0),
        minOrder: Number(vendor.min_order || 0),
      },
      { menuItemId: item.id, name: item.name, price: Number(item.price), imageUrl: item.image_url },
    );
    toast.success(`${item.name} added to basket`);
  };

  const content = (
    <div
      className={`group relative overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.05] transition-all duration-300 ${
        isAvailable
          ? "hover:shadow-[0_12px_30px_-10px_rgba(6,78,59,0.25)] hover:-translate-y-0.5 hover:ring-emerald-400/40"
          : "opacity-55 grayscale"
      }`}
    >
      <div className="relative aspect-square bg-emerald-50 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`h-full w-full object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-110" : ""}`}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-emerald-300">
            <IoLeafOutline className="h-10 w-10" />
          </div>
        )}
        {isAvailable && (
          <button
            aria-label={`Add ${item.name} to basket`}
            onClick={quickAdd}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-700 active:scale-90 transition"
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
        <h4 className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2">{item.name}</h4>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="font-display text-base font-extrabold text-zinc-900">{priceLabel}</span>
        </div>
      </div>
    </div>
  );
  if (!isAvailable) return content;
  return (
    <Link
      to="/vendor/$slug/item/$itemId"
      params={{ slug: vendor.slug, itemId: item.id }}
      className="block"
    >
      {content}
    </Link>
  );
}
