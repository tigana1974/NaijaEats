import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { IoStar, IoChevronBack, IoEllipsisVertical, IoHeart, IoTimeOutline, IoFlameOutline, IoCallOutline, IoChatbubbleEllipsesOutline, IoRemove, IoAdd, IoInformationCircleOutline } from "react-icons/io5";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/$slug/item/$itemId")({
  head: ({ params }) => ({
    meta: [
      { title: `Menu item — Naija Eats` },
      { name: "description", content: `View a menu item from ${params.slug} on Naija Eats.` },
    ],
  }),
  component: MenuItemPage,
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center p-6 text-center bg-white">
      <div>
        <h1 className="font-display text-2xl">Item not found</h1>
        <Link to="/discover" className="text-[var(--brand-clay)] hover:underline mt-4 inline-block">
          Back to discover
        </Link>
      </div>
    </div>
  ),
});

function MenuItemPage() {
  const { slug, itemId } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["menu-item", slug, itemId],
    queryFn: async () => {
      const { data: vendor, error: vErr } = await supabase
        .from("vendors")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (vErr) throw vErr;
      if (!vendor) throw notFound();

      const { data: item, error: iErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", itemId)
        .eq("vendor_id", vendor.id)
        .maybeSingle();
      if (iErr) throw iErr;
      if (!item) throw notFound();

      return { vendor, item };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[#fdfaf5] grid place-items-center text-zinc-500">Loading…</div>
    );
  }
  if (!data) return null;
  const { vendor, item } = data;
  const fmt = (n: number) => `${vendor.currency === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;

  const handleAddToCart = async () => {
    if (!item.is_available) return;
    setAdding(true);
    try {
      const vendorArg = {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: Number(vendor.delivery_fee || 0),
        minOrder: Number(vendor.min_order || 0),
      };
      const itemArg = {
        menuItemId: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.image_url,
      };

      for (let i = 0; i < qty; i++) {
        addItem(vendorArg, itemArg);
      }
      toast.success(`Added ${qty} ${item.name} to cart`);
      setTimeout(() => navigate({ to: `/vendor/${vendor.slug}` }), 300);
    } finally {
      setAdding(false);
    }
  };

  const commonProps = {
    slug,
    vendor,
    item,
    qty,
    setQty,
    adding,
    isFavorite,
    setIsFavorite,
    handleAddToCart,
    fmt,
  };

  if (vendor.type === "grocery") {
    return <GroceryItemLayout {...commonProps} />;
  }
  return <FoodItemLayout {...commonProps} />;
}

function FoodItemLayout({ slug, vendor, item, qty, setQty, adding, isFavorite, setIsFavorite, handleAddToCart, fmt }: any) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#d4cdbd] via-[#faede6] to-[#eae5da] pb-[100px] font-sans relative overflow-x-hidden">
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-md px-5 py-5 flex items-center justify-between pt-safe">
          <Link
            to="/vendor/$slug"
            params={{ slug }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:scale-105"
            aria-label="Back"
          >
            <IoChevronBack className="h-5 w-5 ml-0.5" />
          </Link>
          
          <h1 className="font-medium text-[17px] tracking-tight text-zinc-900">Details</h1>
          
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:scale-105"
            aria-label="More options"
          >
            <IoEllipsisVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Floating Hero Image */}
      <div className="relative mx-auto max-w-md pt-20 pb-2">
        {item.image_url ? (
          <div className="relative w-full h-[360px] flex justify-center items-center px-6">
             <img 
               src={item.image_url} 
               alt={item.name} 
               className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply" 
             />
          </div>
        ) : (
          <div className="w-full h-80 bg-black/5 mix-blend-multiply" />
        )}
      </div>

      {/* Details Section (No background, sits directly on gradient) */}
      <div className="mx-auto max-w-md px-6 relative z-10">
        
        {/* Title and Favorite */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-[22px] font-medium leading-snug text-zinc-900 tracking-tight">
              {item.name}
            </h2>
            <div className="mt-1 flex items-center">
              <span className="text-zinc-500 font-medium text-[13px] mr-1.5">Price:</span>
              <span className="font-semibold text-zinc-900 text-lg">{fmt(Number(item.price))}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:scale-105 transition-transform mt-1"
          >
            <IoHeart className={`h-5 w-5 ${isFavorite ? "text-[#ff4d4d]" : "text-[#ff4d4d]"}`} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-5 pt-4 text-[12px] font-medium text-zinc-500 border-t border-zinc-400/20">
          <div className="flex items-center gap-1.5">
            <IoStar className="h-3.5 w-3.5 text-zinc-400" />
            <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : "4.6"} Rating</span>
          </div>
          <div className="w-px h-3 bg-zinc-300/60" />
          <div className="flex items-center gap-1.5">
            <IoTimeOutline className="h-4 w-4 text-zinc-400" />
            <span>{vendor.prep_time_minutes ? `${vendor.prep_time_minutes} Min` : "25-30 Min"}</span>
          </div>
          <div className="w-px h-3 bg-zinc-300/60" />
          <div className="flex items-center gap-1.5">
            <IoFlameOutline className="h-4 w-4 text-zinc-400" />
            <span>110 Kcal</span>
          </div>
        </div>

        {/* Chef Row */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <img 
              src={vendor.cover_image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${vendor.slug}`} 
              alt={vendor.name} 
              className="h-10 w-10 rounded-full object-cover bg-zinc-200 ring-1 ring-white/50"
            />
            <div>
              <div className="font-medium text-[13px] text-zinc-900">{vendor.name}</div>
              <div className="text-[11px] text-zinc-500 font-medium tracking-wide capitalize">Id: {vendor.id.split('-')[0]}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-zinc-600 hover:bg-zinc-50 transition">
              <IoCallOutline className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-zinc-600 hover:bg-zinc-50 transition">
              <IoChatbubbleEllipsesOutline className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-7">
          <h3 className="text-[15px] font-medium text-zinc-900 mb-2">Description</h3>
          <p className="text-[12px] text-zinc-500 leading-relaxed font-normal">
            {item.description || "This looks like a rich, indulgent dish built for serious flavor. Fresh ingredients and expert preparation bring irresistible taste to every bite."}
            {" "}
            <button className="font-medium text-zinc-900 ml-1 capitalize hover:underline">Read more...</button>
          </p>
        </div>

        {/* Macros */}
        <div className="mt-6 grid grid-cols-4 gap-2.5">
          {[
            { label: "Protein", val: "35 Gram" },
            { label: "Carbs", val: "80 Gram" },
            { label: "Fiber", val: "25 Gram" },
            { label: "Fat", val: "15 Gram" },
          ].map((macro) => (
            <div key={macro.label} className="bg-white rounded-2xl px-1 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center">
              <div className="text-[10px] text-zinc-400 font-normal tracking-wide mb-1.5 capitalize">{macro.label}</div>
              <div className="font-medium text-[11px] text-zinc-900 capitalize">{macro.val}</div>
            </div>
          ))}
        </div>

        {/* Availability Notice */}
        {!item.is_available && (
          <div className="mt-6 rounded-2xl bg-red-50/80 px-4 py-3 ring-1 ring-red-100 flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
             <p className="text-sm font-medium text-red-800">Currently unavailable</p>
          </div>
        )}

      </div>

      {/* Bottom Action Bar (No background, sits on main gradient) */}
      <div className="fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-2 px-6">
        <div className="mx-auto max-w-md flex items-center justify-between gap-4">
          
          {/* Custom Stepper */}
          <div className="flex items-center justify-between bg-white rounded-full p-1 shadow-[0_4px_14px_rgba(0,0,0,0.05)] w-[115px] shrink-0 border border-zinc-100/50">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-10 w-10 flex items-center justify-center rounded-full text-zinc-800 font-medium hover:bg-zinc-50 transition"
            >
              <IoRemove className="h-4 w-4" />
            </button>
            <span className="font-medium text-[15px] text-zinc-900">{qty}</span>
            <button 
              onClick={() => setQty(qty + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff7070] to-[#ff4d4d] text-white shadow-md shadow-red-500/30 hover:scale-105 transition"
            >
              <IoAdd className="h-5 w-5" />
            </button>
          </div>

          {/* Add To Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!item.is_available || adding}
            className="flex-1 h-[48px] rounded-full bg-gradient-to-r from-[#ff7070] to-[#ff4d4d] text-white font-medium shadow-lg shadow-red-500/25 disabled:opacity-50 hover:scale-[1.02] transition-transform text-sm tracking-wide capitalize"
          >
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GroceryItemLayout({ slug, vendor, item, qty, setQty, adding, isFavorite, setIsFavorite, handleAddToCart, fmt }: any) {
  return (
    <div className="min-h-dvh bg-white pb-[100px] font-sans relative overflow-x-hidden">
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-md px-5 py-5 flex items-center justify-between pt-safe">
          <Link
            to="/vendor/$slug"
            params={{ slug }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105"
            aria-label="Back"
          >
            <IoChevronBack className="h-5 w-5 ml-0.5" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105"
            >
              <IoHeart className={`h-5 w-5 ${isFavorite ? "text-[#ff4d4d]" : "text-zinc-400"}`} />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200 transition hover:scale-105"
              aria-label="More options"
            >
              <IoEllipsisVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grocery Image Product Shot */}
      <div className="relative mx-auto max-w-md bg-zinc-50 rounded-b-[2.5rem] pt-24 pb-8 px-8 shadow-sm">
        {item.image_url ? (
          <div className="relative w-full h-[280px] flex justify-center items-center">
             <img 
               src={item.image_url} 
               alt={item.name} 
               className="w-full h-full object-contain drop-shadow-xl" 
             />
          </div>
        ) : (
          <div className="w-full h-[280px] bg-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400">
             No Image
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="mx-auto max-w-md px-6 pt-6 relative z-10">
        
        {/* Brand / Vendor Label */}
        <div className="flex items-center gap-2 mb-2">
           <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{vendor.name}</span>
           <span className="h-1 w-1 rounded-full bg-zinc-300" />
           <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">In Stock</span>
        </div>

        {/* Title & Price */}
        <h2 className="font-display text-[24px] font-semibold leading-tight text-zinc-900 tracking-tight">
          {item.name}
        </h2>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-semibold text-zinc-900 text-3xl tracking-tight">{fmt(Number(item.price))}</span>
          <span className="text-zinc-400 font-medium text-sm mb-1 line-through">{fmt(Number(item.price) * 1.2)}</span>
        </div>

        <div className="h-px w-full bg-zinc-100 my-6" />

        {/* Description */}
        <div>
          <h3 className="text-[15px] font-medium text-zinc-900 mb-2">Product Details</h3>
          <p className="text-[13px] text-zinc-500 leading-relaxed font-normal">
            {item.description || "Fresh, high-quality groceries directly sourced for your daily needs. Store in a cool, dry place."}
          </p>
        </div>

        {/* Spec Row */}
        <div className="mt-6 flex flex-col gap-3">
           <div className="flex items-center justify-between py-2 border-b border-zinc-50">
             <span className="text-[13px] text-zinc-500">Weight/Volume</span>
             <span className="text-[13px] font-medium text-zinc-900">500g</span>
           </div>
           <div className="flex items-center justify-between py-2 border-b border-zinc-50">
             <span className="text-[13px] text-zinc-500">Origin</span>
             <span className="text-[13px] font-medium text-zinc-900 capitalize">{vendor.city}</span>
           </div>
        </div>

        {/* Availability Notice */}
        {!item.is_available && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 border border-red-100 flex items-center gap-3">
             <IoInformationCircleOutline className="h-5 w-5 text-red-500" />
             <p className="text-sm font-medium text-red-800">Currently out of stock</p>
          </div>
        )}

      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 px-6 bg-white border-t border-zinc-100">
        <div className="mx-auto max-w-md flex items-center justify-between gap-4">
          
          {/* Custom Stepper */}
          <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-1 w-[120px] shrink-0 border border-zinc-200/60">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-800 font-medium hover:bg-white hover:shadow-sm transition"
            >
              <IoRemove className="h-4 w-4" />
            </button>
            <span className="font-medium text-[15px] text-zinc-900">{qty}</span>
            <button 
              onClick={() => setQty(qty + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-800 font-medium hover:bg-white hover:shadow-sm transition"
            >
              <IoAdd className="h-4 w-4" />
            </button>
          </div>

          {/* Add To Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!item.is_available || adding}
            className="flex-1 h-[48px] rounded-2xl bg-zinc-900 text-white font-medium shadow-md shadow-zinc-900/20 disabled:opacity-50 hover:bg-zinc-800 hover:scale-[1.02] transition-all text-sm tracking-wide capitalize"
          >
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
