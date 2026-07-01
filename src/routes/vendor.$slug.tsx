import { createFileRoute, Link, notFound, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IoStar, IoTime, IoLocation, IoChevronBack, IoChatbubbleEllipses, IoCartOutline, IoFlame, IoAdd } from "react-icons/io5";
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

  if (isLoading) {
    return <div className="min-h-dvh bg-white grid place-items-center text-zinc-500">Loading…</div>;
  }
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

  if (isItemRoute) {
    return <Outlet />;
  }

  const commonProps = { vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt };

  if (vendor.type === "grocery") {
    return <GroceryStoreLayout {...commonProps} />;
  } else if (vendor.type === "chef") {
    return <ChefProfileLayout {...commonProps} />;
  }
  return <RestaurantLayout {...commonProps} />;
}

function RestaurantLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  return (
    <div className="min-h-dvh bg-zinc-50/50 pb-32">
      {/* Premium Hero Section */}
      <div className="relative w-full h-[350px] sm:h-[400px]">
        {vendor.cover_image_url ? (
          <img src={vendor.cover_image_url} alt={vendor.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[var(--gradient-warm)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        
        {/* Top bar over hero */}
        <div className="absolute top-0 inset-x-0 z-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link
              to="/discover"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition ring-1 ring-white/10"
              aria-label="Back to discover"
            >
              <IoChevronBack className="h-6 w-6" />
            </Link>
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition ring-1 ring-white/10"
            >
              <IoCartOutline className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Floating Vendor Info Card */}
        <div className="absolute bottom-0 inset-x-0 px-4 sm:px-6 translate-y-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-5 sm:p-7 shadow-2xl text-white">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div className="min-w-0 flex-1">
                  {vendor.is_featured && (
                    <span className="inline-block mb-3 rounded-full bg-[var(--brand-clay)] px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-white shadow-sm">
                      Featured
                    </span>
                  )}
                  <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm">{vendor.name}</h1>
                  {vendor.tagline && <p className="text-white/80 mt-1.5 text-sm sm:text-base max-w-xl">{vendor.tagline}</p>}
                  
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1">
                      <IoStar className="h-4 w-4 text-amber-400" />
                      {Number(vendor.rating || 0).toFixed(1)} <span className="text-white/60">({vendor.rating_count || 0})</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1">
                      <IoLocation className="h-4 w-4" /> {vendor.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1">
                      <IoTime className="h-4 w-4" /> {vendor.prep_time_minutes ?? 30} min
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
                   <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-2.5 text-center min-w-[100px]">
                     <div className="text-[10px] uppercase tracking-wide text-white/60 font-semibold mb-0.5">Delivery</div>
                     <div className="font-bold text-base">{fmt(vendor.delivery_fee || 0)}</div>
                   </div>
                   <Link
                    to="/chats/$vendorId"
                    params={{ vendorId: vendor.id }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-zinc-900 px-5 py-2.5 text-sm font-bold shadow-lg hover:bg-zinc-100 transition min-w-[100px]"
                  >
                    <IoChatbubbleEllipses className="h-5 w-5" /> Chat
                  </Link>
                </div>
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

function GroceryStoreLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  return (
    <div className="min-h-dvh bg-white pb-32">
      {/* Clean Grocery Header */}
      <div className="bg-emerald-800 text-white pt-safe pb-8 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between py-4">
            <Link
              to="/groceries"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Back"
            >
              <IoChevronBack className="h-6 w-6" />
            </Link>
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <IoCartOutline className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg shrink-0">
               {vendor.logo_url || vendor.cover_image_url ? (
                  <img src={vendor.logo_url || vendor.cover_image_url} alt="" className="h-full w-full rounded-xl object-cover" />
               ) : (
                  <div className="h-full w-full rounded-xl bg-emerald-100" />
               )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{vendor.name}</h1>
              <p className="text-emerald-100 text-sm mt-1">{vendor.city} • Fresh Groceries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-4 relative z-10">
         <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 flex items-center justify-around text-sm font-medium text-zinc-600">
            <div className="text-center">
              <div className="text-zinc-900 font-bold">{Number(vendor.rating || 0).toFixed(1)} ★</div>
              <div className="text-xs text-zinc-400">Rating</div>
            </div>
            <div className="w-px h-8 bg-zinc-100" />
            <div className="text-center">
              <div className="text-zinc-900 font-bold">{vendor.prep_time_minutes ?? 30} mins</div>
              <div className="text-xs text-zinc-400">Delivery</div>
            </div>
            <div className="w-px h-8 bg-zinc-100" />
            <div className="text-center">
              <div className="text-zinc-900 font-bold">{fmt(vendor.delivery_fee || 0)}</div>
              <div className="text-xs text-zinc-400">Fee</div>
            </div>
         </div>
      </div>

      <MenuSection grouped={grouped} vendor={vendor} />
      <CartBar cartIsForThisVendor={cartIsForThisVendor} itemCount={itemCount} subtotal={subtotal} fmt={fmt} />
    </div>
  );
}

function ChefProfileLayout({ vendor, grouped, cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  return (
    <div className="min-h-dvh bg-[#FAFAFA] pb-32">
      {/* Chef Profile Header */}
      <div className="w-full bg-white border-b border-zinc-100 pt-safe px-4 sm:px-6 pb-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between py-4">
            <Link
              to="/discover"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition text-zinc-800"
              aria-label="Back"
            >
              <IoChevronBack className="h-6 w-6" />
            </Link>
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition text-zinc-800"
            >
              <IoCartOutline className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-clay)] px-1 text-[10px] font-bold text-white shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className="h-28 w-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-zinc-200">
               {vendor.cover_image_url ? (
                  <img src={vendor.cover_image_url} alt={vendor.name} className="h-full w-full object-cover" />
               ) : (
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`} alt="" className="h-full w-full object-cover" />
               )}
            </div>
            <h1 className="font-display text-3xl font-bold mt-5 text-zinc-900">{vendor.name}</h1>
            <p className="text-zinc-500 font-medium mt-1">Chef • {vendor.city}</p>
            <p className="max-w-xl text-sm text-zinc-500 mt-4 leading-relaxed">{vendor.description || "Authentic African cuisine made with passion."}</p>
            
            <div className="mt-6 flex items-center justify-center gap-4">
               <Link
                  to="/chats/$vendorId"
                  params={{ vendorId: vendor.id }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition"
                >
                  <IoChatbubbleEllipses className="h-5 w-5" /> Message Chef
                </Link>
                <div className="px-5 py-2.5 rounded-full bg-zinc-100 text-sm font-bold text-zinc-800">
                  ★ {Number(vendor.rating || 0).toFixed(1)}
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

function MenuSection({ grouped, vendor }: any) {
  return (
    <>
      {/* Sticky Category Nav */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto py-4 scrollbar-hide">
            {grouped.map(({ category }: any) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                className="shrink-0 text-sm font-bold text-zinc-500 hover:text-[var(--brand-clay)] transition"
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-12">
        {grouped.map(({ category, items }: any) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
            <h3 className="font-display text-2xl font-bold mb-6 text-zinc-900">{category.name}</h3>
            {items.length === 0 ? (
              <p className="text-zinc-500 text-sm">No items in this section yet.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {items.map((item: any) => (
                  <HorizontalFoodCard
                    key={item.id}
                    vendorSlug={vendor.slug}
                    itemId={item.id}
                    name={item.name}
                    imageUrl={item.image_url}
                    priceLabel={`${vendor.currency === "GBP" ? "£" : "₦"}${Number(item.price).toLocaleString()}`}
                    description={item.description}
                    badge={item.is_featured ? "Top" : undefined}
                    isAvailable={item.is_available}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function CartBar({ cartIsForThisVendor, itemCount, subtotal, fmt }: any) {
  if (!cartIsForThisVendor || itemCount <= 0) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),1rem)] px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md">
        <Link
          to="/cart"
          className="flex items-center justify-between gap-4 rounded-full bg-[var(--brand-clay)] px-5 py-4 text-white shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-transform"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <IoCartOutline className="h-6 w-6" /> {itemCount} item{itemCount > 1 ? "s" : ""}
          </span>
          <span className="text-sm font-bold">View cart · {fmt(subtotal)}</span>
        </Link>
      </div>
    </div>
  );
}

function HorizontalFoodCard({
  vendorSlug,
  itemId,
  name,
  imageUrl,
  priceLabel,
  description,
  badge,
  isAvailable,
}: {
  vendorSlug: string;
  itemId: string;
  name: string;
  imageUrl?: string | null;
  priceLabel: string;
  description?: string;
  badge?: string;
  isAvailable: boolean;
}) {
  const content = (
    <div className={`relative flex gap-5 p-4 rounded-[1.75rem] bg-white shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all duration-500 group ${
      isAvailable 
        ? 'hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:ring-[var(--brand-clay)]/20' 
        : 'opacity-50 grayscale'
    }`}>
      <div className="flex-1 min-w-0 py-1 flex flex-col">
        {badge && (
          <span className="inline-flex items-center gap-1 w-max px-2.5 py-1 rounded-lg bg-amber-400/15 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 mb-2.5">
            <IoFlame className="h-3 w-3 text-amber-500" />
            {badge}
          </span>
        )}
        <h4 className="font-bold text-zinc-900 text-[17px] leading-tight line-clamp-2 tracking-tight group-hover:text-[var(--brand-clay)] transition-colors duration-300">{name}</h4>
        {description && <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed">{description}</p>}
        
        <div className="mt-3.5 flex flex-wrap items-center gap-2 justify-between">
          <div className="font-display font-extrabold text-lg text-zinc-900 tracking-tight">{priceLabel}</div>
          {!isAvailable && <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg">Unavailable</p>}
        </div>
      </div>
      <div className="relative h-[120px] w-[120px] shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className={`h-full w-full object-cover transition-transform duration-700 ease-out ${isAvailable ? 'group-hover:scale-110' : ''}`} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100" />
        )}
        {/* Floating add indicator */}
        {isAvailable && (
          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg shadow-black/10 text-[var(--brand-clay)] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-75">
            <IoAdd className="h-4 w-4" />
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
