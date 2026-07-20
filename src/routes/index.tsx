import { createFileRoute, redirect } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { homeForRole, type AppRole } from "@/hooks/useMyRole";
import {
  ChefHat,
  Store,
  ShoppingBasket,
  ArrowRight,
  Utensils,
  Search,
  ShoppingBag,
  Star,
  Play,
  ChevronLeft,
  ChevronRight,
  Truck,
  CalendarHeart,
  HomeIcon,
  Heart,
  Instagram,
  Twitter,
  Facebook,
  Send,
  Mail,
} from "lucide-react";
import {
  heroFood as heroJollof,
  dishJollof,
  dishSuya,
  dishEgusi,
  dishPuffpuff,
  dishExtra,
  chefPortrait,
  offerPlatter,
  avatarTunde,
  avatarRahim,
  avatarEmily,
  avatarSade,
  illusRider,
  illusOrder,
  illusChef,
} from "@/assets/landing-images";
import { Logo } from "@/components/naija/Logo";
import { useState, useEffect, useRef, createContext, useContext, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const landingItemsQuery = queryOptions({
  queryKey: ["landing-items"],
  queryFn: async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("id, name, price, currency, image_url, description, vendors!inner(name, city, status)")
      .eq("is_available", true)
      .eq("vendors.status", "approved")
      .not("image_url", "is", null)
      .limit(16);
    return data || [];
  },
  staleTime: 1000 * 60 * 15,
});


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Naija Eats: The Home of African & Authentic Food, Delivered" },
      { name: "description", content: "Order from chefs, African & Caribbean restaurants, and ethnic grocers. Cooked with culture, delivered fresh." },
      { property: "og:title", content: "Naija Eats: Cooked with Culture, Delivered Fresh" },
      { property: "og:description", content: "The food ecosystem for African & authentic cuisine. Chefs, restaurants, and groceries." },
    ],
  }),
  // If the visitor already has a Supabase session, skip the marketing site and
  // hand them straight to their role home. This runs BEFORE the landing page
  // renders, so a signed-in PWA user never briefly sees the marketing hero on
  // launch — the splash screen covers the auth check and the redirect happens
  // under it. Anonymous visitors continue to see the landing page.
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return; // signed-out visitor → landing page

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const roles = ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role);
      const role: AppRole = roles.includes("admin")
        ? "admin"
        : roles.includes("vendor")
          ? "vendor"
          : roles.includes("rider")
            ? "rider"
            : "customer";
      const to = homeForRole(role);
      // `throw redirect(...)` short-circuits the loader and swaps the route.
      throw redirect({ to, replace: true });
    } catch (err) {
      // Re-throw redirect errors so TanStack Router can handle them; any other
      // failure (e.g. offline) silently falls back to the landing page.
      if (err && typeof err === "object" && "isRedirect" in err) throw err;
    }
  },
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData(landingItemsQuery);
  },
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <SearchProvider>
        <Nav />
        <Hero />
      </SearchProvider>
      <Story />
      <SpecialDishes />
      <WhyUs />
      <MenuCarousel />
      <OfferBanner />
      <ServePromise />
      <Testimonials />
      <StartOrderingCTA />
      <Footer />
      <BrandWordmark />
    </div>
  );
}

/**
 * Temporary on-page diagnostic to explain why vendor images may not be
 * showing on the live site. Reports env var presence, query error, and
 * item count. Remove once the DB / RLS is confirmed healthy in prod.
 */
function LandingDebugBanner() {
  // Run a client-side probe that mirrors landingItemsQuery but captures the
  // raw error object so we can render it directly on the page.
  const { data: probe, isLoading } = useQuery({
    queryKey: ["landing-items-probe"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, image_url, vendors!inner(name, status)")
        .eq("is_available", true)
        .eq("vendors.status", "approved")
        .not("image_url", "is", null)
        .limit(16);
      return { rows: data ?? [], error: error ? error.message : null };
    },
    staleTime: 60_000,
    retry: false,
  });

  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  const envOk = !!url && !!key;
  const rows = probe?.rows ?? [];
  const probeError = probe?.error ?? null;
  const count = rows.length;
  const withImage = rows.filter((d: any) => d?.image_url).length;

  let state: "loading" | "ok" | "empty" | "envMissing" | "queryError" = "loading";
  let message = "";
  if (isLoading) {
    state = "loading";
    message = "Checking vendor catalogue…";
  } else if (!envOk) {
    state = "envMissing";
    message = `Supabase env vars missing on this deployment. VITE_SUPABASE_URL=${url ? "set" : "MISSING"} · VITE_SUPABASE_ANON_KEY=${key ? "set" : "MISSING"}`;
  } else if (probeError) {
    state = "queryError";
    message = `Query failed: ${probeError}`;
  } else if (count === 0) {
    state = "empty";
    message = "Query ran but returned 0 rows. No approved vendor has an available menu item with an image_url in this database.";
  } else {
    state = "ok";
    message = `Live DB · ${count} vendor item${count === 1 ? "" : "s"} returned (${withImage} with image_url). Landing page is showing real uploads.`;
  }

  const tone =
    state === "ok"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : state === "loading"
        ? "bg-zinc-50 text-zinc-700 border-zinc-200"
        : "bg-amber-50 text-amber-900 border-amber-300";

  return (
    <div className={`relative z-40 border-b ${tone} text-xs`}>
      <div className="mx-auto max-w-7xl px-6 py-2 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold uppercase tracking-widest text-[10px] shrink-0">Landing diagnostic</span>
          <span className="truncate">{message}</span>
        </div>
        <span className="hidden sm:inline shrink-0 opacity-60">
          host: {typeof window !== "undefined" ? window.location.hostname : "server"}
          {url ? ` · sb: ${new URL(url).hostname}` : ""}
        </span>
      </div>
    </div>
  );
}

/* --------------------------- Search (landing) -------------------------- */

type SearchCtx = { open: () => void };
const SearchContext = createContext<SearchCtx | null>(null);
function useSearchModal() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("SearchContext missing");
  return ctx;
}

function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  return (
    <SearchContext.Provider value={{ open: () => setIsOpen(true) }}>
      <SearchSeedContext.Provider value={{ initialQuery, setInitialQuery }}>
        {children}
        <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
      </SearchSeedContext.Provider>
    </SearchContext.Provider>
  );
}

const SearchSeedContext = createContext<{
  initialQuery: string;
  setInitialQuery: (s: string) => void;
}>({ initialQuery: "", setInitialQuery: () => {} });

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { initialQuery } = useContext(SearchSeedContext);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(q, 220);

  useEffect(() => {
    if (open) {
      setQ(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialQuery]);

  const term = debounced.trim();
  const { data, isFetching } = useQuery({
    queryKey: ["landing-search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term.replace(/[%_]/g, "")}%`;
      const [vendorsRes, itemsRes] = await Promise.all([
        supabase
          .from("vendors")
          .select("id,name,slug,city,country,type,tagline,cover_image_url")
          .eq("status", "approved")
          .or(`name.ilike.${like},tagline.ilike.${like},city.ilike.${like}`)
          .limit(8),
        supabase
          .from("menu_items")
          .select("id,name,price,currency,image_url,vendor_id,vendors!inner(name,slug,city,status)")
          .eq("is_available", true)
          .eq("vendors.status", "approved")
          .or(`name.ilike.${like},description.ilike.${like}`)
          .limit(10),
      ]);
      return {
        vendors: vendorsRes.data ?? [],
        items: (itemsRes.data ?? []) as any[],
      };
    },
    staleTime: 30_000,
  });

  const fmt = (n: number, c: string) => `${c === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const empty = term.length >= 2 && !isFetching && (data?.vendors.length ?? 0) === 0 && (data?.items.length ?? 0) === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes, chefs, restaurants, cities…"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          {isFetching && <span className="text-xs text-muted-foreground">Searching…</span>}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {term.length < 2 && (
            <div className="p-6 text-sm text-muted-foreground">
              Type at least 2 letters to search across dishes, chefs and restaurants in Nigeria and the UK.
            </div>
          )}

          {empty && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No matches for "<span className="text-foreground">{term}</span>". Try a different word.
            </div>
          )}

          {(data?.vendors?.length ?? 0) > 0 && (
            <div className="p-2">
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Chefs & Restaurants
              </div>
              {data!.vendors.map((v: any) => (
                <Link
                  key={v.id}
                  to="/vendor/$slug"
                  params={{ slug: v.slug }}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition"
                >
                  <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0">
                    {v.cover_image_url ? (
                      <img src={v.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[var(--gradient-warm)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{v.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {v.type?.replace("_", " ")} · {v.city} · {v.country}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}

          {(data?.items?.length ?? 0) > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Dishes
              </div>
              {data!.items.map((it: any) => (
                <Link
                  key={it.id}
                  to="/vendor/$slug"
                  params={{ slug: it.vendors.slug }}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition"
                >
                  <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0">
                    {it.image_url ? (
                      <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[var(--gradient-warm)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {it.vendors.name} · {it.vendors.city}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary shrink-0">{fmt(it.price, it.currency)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-muted/40 px-4 py-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sign in to order, save favourites and track delivery.</span>
          <Link
            to="/auth"
            onClick={() => onOpenChange(false)}
            className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 font-semibold hover:opacity-95 transition"
          >
            Sign in
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Decor SVGs ------------------------------ */

function Leaf({ className = "", rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <path
        d="M8 56C8 28 28 8 56 8c0 28-20 48-48 48Z"
        fill="currentColor"
      />
      <path
        d="M14 50 50 14"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function Blob({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M44.5,-58.3C56.1,-48.6,62.5,-33.5,66.6,-17.6C70.7,-1.7,72.4,15,65.6,27.6C58.7,40.3,43.3,49,27.5,55.7C11.7,62.4,-4.6,67.1,-19.4,63.6C-34.2,60.1,-47.4,48.5,-55.7,34.4C-64,20.4,-67.3,3.8,-64.2,-11.2C-61,-26.2,-51.5,-39.7,-39.4,-49.6C-27.3,-59.6,-13.6,-66.1,1.6,-68.1C16.8,-70.1,33.6,-67.6,44.5,-58.3Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ----------------------------------- Nav --------------------------------- */

function Nav() {
  const search = useSearchModal();
  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
            Naija<span className="text-primary">Eats</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-foreground/70">
          <a href="#top" className="text-foreground">Home</a>
          <a href="#menu" className="hover:text-foreground transition">Menu</a>
          <a href="#story" className="hover:text-foreground transition">About</a>
          <a href="#why" className="hover:text-foreground transition">Vendors</a>
          <a href="#contact" className="hover:text-foreground transition">Contact</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={search.open}
            className="hidden sm:grid place-items-center h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-muted transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground pl-1 pr-1 border-l border-border/60 ml-1">
            <span className="ml-3">NG</span>
            <span className="text-border">·</span>
            <span>UK</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="text-[13px] font-semibold text-foreground/80 hover:text-foreground px-2.5 py-1.5 transition whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-semibold hover:opacity-90 transition whitespace-nowrap"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------------- Hero -------------------------------- */

function Hero() {
  const search = useSearchModal();
  const { setInitialQuery } = useContext(SearchSeedContext);
  const [q, setQ] = useState("");
  const { data: items, isLoading } = useQuery(landingItemsQuery);
  const heroItem = items && items.length > 0 ? items[0] : null;
  const cardItem = items && items.length > 1 ? items[1] : null;

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Subtle background wash — restrained editorial feel */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_20%,var(--brand-gold)/8%,transparent),radial-gradient(50%_40%_at_10%_80%,var(--brand-clay)/6%,transparent)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-20 items-center">
        {/* Left */}
        <div className="relative z-10">
          
          <h1 className="mt-6 font-display text-[42px] md:text-6xl lg:text-[76px] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground">
            Everything food.
            <br />
            One African
            <br />
            <span className="italic font-light text-primary">marketplace.</span>
          </h1>
          <p className="mt-7 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
            Restaurant meals, private chefs, ethnic groceries and same‑day delivery, from a platform built around African food culture.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setInitialQuery(q);
              search.open();
            }}
            className="mt-8 flex items-center gap-2 rounded-full bg-card border border-border/70 pl-5 pr-1.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_30px_-16px_rgba(0,0,0,0.15)] max-w-md focus-within:border-foreground/30 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_50px_-20px_rgba(0,0,0,0.25)] transition"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                setInitialQuery(q);
                search.open();
              }}
              placeholder="Search jollof, suya, chefs, restaurants…"
              className="flex-1 bg-transparent outline-none text-sm py-2"
              aria-label="Search foods, chefs and restaurants"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground text-background h-9 w-9 grid place-items-center hover:opacity-90 transition"
              aria-label="Search"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/discover"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Order now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", role: "chef" }}
              className="inline-flex items-center gap-2 rounded-full text-foreground/80 hover:text-foreground px-5 py-3.5 text-sm font-semibold transition"
            >
              Become a vendor
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>


        </div>

        {/* Right — editorial portrait card */}
        <div className="relative mt-12 lg:mt-0">
          <div className="relative aspect-[16/10] md:aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)]">
            {isLoading ? (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            ) : (
              <img
                 src={heroItem ? heroItem.image_url : heroJollof}
                 alt={heroItem ? heroItem.name : "Delicious African food"}
                width={1280}
                height={1600}
                className="h-full w-full object-cover"
              />
            )}
            {/* Subtle vignette for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Chef byline — bottom-left overlay */}
            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3">
              {isLoading ? (
                <>
                  <div className="h-11 w-11 rounded-full bg-white/20 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-white/20 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-white/20 rounded animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={chefPortrait}
                    alt="Chef Amaka"
                    width={44}
                    height={44}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white/80"
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight text-white">{heroItem?.vendors ? heroItem.vendors.name : "Chef Amaka"}</div>
                    <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/70 leading-tight mt-0.5">{heroItem ? heroItem.name : "Signature dish"} · {heroItem?.vendors ? heroItem.vendors.city : "Lagos"}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Floating price card — refined */}
          <div className="absolute -bottom-6 -left-4 md:-left-8 bg-card rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] p-3 pr-5 flex items-center gap-3 border border-border/60 backdrop-blur">
            {isLoading ? (
              <>
                <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                <div>
                  <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
                  <div className="h-4 w-12 bg-muted animate-pulse rounded mt-2" />
                </div>
              </>
            ) : (
              <>
                <img
                  src={cardItem ? cardItem.image_url : dishSuya}
                  alt={cardItem ? cardItem.name : "Suya"}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Trending</div>
                  <div className="text-sm font-semibold text-foreground leading-tight">{cardItem ? cardItem.name : "Suya Skewers"}</div>
                  <div className="text-primary font-bold text-[13px] leading-tight mt-0.5">{cardItem ? `${cardItem.currency === 'GBP' ? '£' : '₦'}${Number(cardItem.price).toLocaleString()}` : "₦7,490"}</div>
                </div>
              </>
            )}
          </div>

          {/* Small quality tag — top-right */}
          <div className="absolute -top-3 -right-3 md:-right-5 bg-card rounded-full border border-border/60 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.3)] px-4 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-foreground">Delivered in 32 min</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Story -------------------------------- */

function Story() {
  const stats = [
    ["10K+", "Orders Delivered"],
    ["500+", "Chefs"],
    ["50+", "Cities Covered"],
    ["4.9★", "Average Rating"],
  ];
  const { data, isLoading } = useQuery(landingItemsQuery);
  // Pick three vendor-uploaded dishes for the collage. Fall back to the local
  // brand imagery only when the database is still empty.
  const storyItems = data ?? [];
  const collageA = storyItems[8] ?? storyItems[0];
  const collageB = storyItems[9] ?? storyItems[1];
  const collageWide = storyItems[10] ?? storyItems[2];
  return (
    <section id="story" className="relative py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Our story</div>
          <h2 className="mt-5 font-display text-3xl md:text-[52px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-left">
            Crafted with love, <span className="italic font-light text-primary">spiced with passion</span>, and made to satisfy every craving.
          </h2>
          <p className="mt-6 text-[15px] text-muted-foreground max-w-md leading-relaxed">
            A network of chefs, restaurants and grocers united by one belief: African food deserves the world's finest delivery experience.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-muted-foreground/10" />
              ) : (
                <img src={collageA?.image_url ?? dishJollof} alt={collageA?.name ?? "Vendor dish"} width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-muted-foreground/10" />
              ) : (
                <img src={collageB?.image_url ?? dishSuya} alt={collageB?.name ?? "Vendor dish"} width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <div className="aspect-[16/7] rounded-2xl overflow-hidden bg-muted">
            {isLoading ? (
              <div className="h-full w-full animate-pulse bg-muted-foreground/10" />
            ) : (
              <img src={collageWide?.image_url ?? offerPlatter} alt={collageWide?.name ?? "A platter of African dishes"} width={1024} height={448} loading="lazy" className="h-full w-full object-cover" />
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {stats.map(([n, l]) => (
                <div
                  key={l}
                  className="rounded-xl sm:rounded-none sm:bg-transparent bg-muted/40 px-3 py-2.5 sm:p-0 min-w-0"
                >
                  <div className="font-display text-xl sm:text-2xl font-bold text-primary tabular-nums leading-none">
                    {n}
                  </div>
                  <div className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground leading-tight">
                    {l}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border sm:mt-5 sm:pt-5">
              <button
                type="button"
                className="w-full sm:w-auto sm:ml-auto flex items-center justify-center sm:justify-end gap-2 text-sm font-semibold text-foreground"
              >
                <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground shrink-0">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                Watch Intro
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Special Dishes --------------------------- */

const specialDishes = [
  { name: "Jollof Rice & Chicken", price: "₦6,500", rating: 4.9, img: dishJollof },
  { name: "Coconut Rice", price: "₦5,490", rating: 4.8, img: dishSuya },
  { name: "White Rice & Efo Riro", price: "₦6,200", rating: 4.9, img: dishEgusi },
  { name: "Special Jollof", price: "₦7,500", rating: 4.7, img: dishPuffpuff },
  { name: "Ofada Rice", price: "₦8,900", rating: 4.9, img: dishExtra },
  { name: "Assorted Rice Bowl", price: "₦5,800", rating: 4.8, img: dishEgusi },
  { name: "Jollof Party Pack", price: "₦12,500", rating: 4.9, img: dishJollof },
  { name: "Coconut Rice Combo", price: "₦7,500", rating: 4.7, img: dishSuya },
  { name: "Chef's Special Jollof", price: "₦6,900", rating: 4.9, img: dishJollof },
  { name: "Ofada Combo", price: "₦9,900", rating: 4.8, img: dishExtra },
  { name: "Family Efo Riro", price: "₦9,200", rating: 4.9, img: dishEgusi },
  { name: "Plantain Jollof", price: "₦6,900", rating: 4.7, img: dishPuffpuff },
];

const DISHES_PER_SLIDE = 4;
const TOTAL_SLIDES = 3;

function SpecialDishes() {
  const { data, isLoading } = useQuery(landingItemsQuery);
  const totalCount = DISHES_PER_SLIDE * TOTAL_SLIDES;
  const dbDishes = data ?? [];

  const displayDishes = Array.from({ length: totalCount }).map((_, i) => {
    if (dbDishes[i]) {
      const d = dbDishes[i];
      return {
        name: d.name,
        price: `${d.currency === "GBP" ? "£" : "₦"}${Number(d.price).toLocaleString()}`,
        rating: 4.9,
        img: d.image_url,
      };
    }
    return specialDishes[i % specialDishes.length];
  });

  const marqueeItems = [...displayDishes, ...displayDishes];

  return (
    <section className="relative py-20 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Signature dishes</div>
          <h2 className="mt-4 font-display text-3xl md:text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            Special dishes from <span className="italic font-light text-primary">our kitchens</span>
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
            Bestsellers cooked by chefs and African restaurants across Lagos, Abuja, London and Manchester.
          </p>
        </div>

        <div className="relative mt-16 overflow-hidden">
          <div className="flex w-max pt-14 pb-4 px-4 hover:[animation-play-state:paused] animate-marquee-ltr gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="group relative w-64 shrink-0">
                  <div className="aspect-square rounded-full sm:rounded-[2rem] bg-muted animate-pulse" />
                  <div className="mt-5 text-center px-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded mx-auto" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded mx-auto mt-2" />
                  </div>
                </div>
              ))
            ) : (
              marqueeItems.map((d, idx) => (
                <article
                  key={d.name + "-" + idx}
                  className="relative w-64 shrink-0 rounded-3xl bg-card border border-border pt-16 pb-6 px-5 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all"
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full overflow-hidden ring-4 ring-background shadow-[var(--shadow-warm)]">
                    <img src={d.img} alt={d.name} width={256} height={256} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-xs font-bold text-primary">{d.price}</div>
                  <h3 className="mt-1 font-semibold text-foreground text-base leading-tight truncate">{d.name}</h3>
                  <div className="mt-2 flex items-center justify-center gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="ml-1 text-[11px] text-muted-foreground">{d.rating}</span>
                  </div>
                  <button className="mt-4 w-full rounded-full bg-primary text-primary-foreground py-2 text-xs font-semibold hover:opacity-95 transition">
                    Order Now
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Why Us ------------------------------- */

function WhyUs() {
  const tiles = [
    { icon: ChefHat, title: "Chefs", copy: "Authentic recipes from grandmothers and aunties." },
    { icon: Utensils, title: "African Restaurants", copy: "From Lagos buka to Caribbean roti, at your door." },
    { icon: ShoppingBasket, title: "Ethnic Grocery", copy: "Egusi, palm oil, plantains and scotch bonnets." },
    { icon: CalendarHeart, title: "Chef Booking", copy: "Book a chef for your dinner or celebration." },
  ];
  return (
    <section id="why" className="relative py-20 md:py-28 bg-muted/50">
      <Sparkle className="absolute top-12 left-12 h-5 w-5 text-accent" />
      <Sparkle className="absolute bottom-16 left-[40%] h-4 w-4 text-accent/70" />
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">The difference</div>
          <h2 className="mt-4 font-display text-3xl md:text-[52px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            Why <span className="italic font-light text-primary">Naija Eats</span>
          </h2>
          <p className="mt-6 text-[15px] text-muted-foreground max-w-md leading-relaxed">
            We are more than delivery. We are a food ecosystem that connects the people who cook with culture to the people who crave it. Verified chefs, fair pricing, and stories behind every dish.
          </p>
          <Link
            to="/discover"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Explore more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="group rounded-2xl bg-card border border-border/60 p-6 hover:border-foreground/20 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)] transition"
            >
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-semibold text-foreground text-[15px]">{title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Menu Carousel ---------------------------- */

function MenuCarousel() {
  const { data } = useQuery(landingItemsQuery);
  // Prefer the tail end of the vendor catalogue so this section shows different
  // dishes from Signature Dishes (which uses the first 12).
  const dbItems = (data ?? []).slice(12, 16);
  const fallbackPool = (data ?? []).slice(0, 4);

  const staticItems = [
    { name: "Spicy Jollof", price: "₦5,500", tag: "Popular", img: dishJollof },
    { name: "Coconut Rice", price: "₦7,490", tag: "Spicy", img: dishSuya },
    { name: "Rice & Efo Riro", price: "₦6,200", tag: "Comfort", img: dishEgusi },
    { name: "Plantain Jollof", price: "₦6,900", tag: "Sweet", img: dishPuffpuff },
  ];

  const displayItems = Array.from({ length: 4 }).map((_, i) => {
    const d = dbItems[i] ?? fallbackPool[i];
    if (d) {
      return {
        name: d.name,
        price: `${d.currency === "GBP" ? "£" : "₦"}${Number(d.price).toLocaleString()}`,
        tag: "Special",
        img: d.image_url,
      };
    }
    return staticItems[i];
  });

  return (
    <section id="menu" className="py-20 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Our <span className="text-primary">Menu</span>
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
          <button className="hidden md:grid absolute -left-5 top-1/2 -translate-y-1/2 place-items-center h-10 w-10 rounded-full bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition shadow-[var(--shadow-soft)]" aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {displayItems.map((d, idx) => (
            <article key={d.name + idx} className="relative rounded-3xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]">
              <div className="relative">
                <div className="aspect-square rounded-full overflow-hidden mx-auto w-32 h-32 ring-4 ring-background shadow-[var(--shadow-warm)]">
                  <img src={d.img} alt={d.name} width={256} height={256} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <span className="absolute -top-1 right-2 text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground px-2 py-1 rounded-full">
                  {d.tag}
                </span>
              </div>
              <h3 className="mt-5 text-center font-semibold text-foreground">{d.name}</h3>
              <div className="mt-1 text-center text-primary font-bold text-xl">{d.price}</div>
            </article>
          ))}
          <button className="hidden md:grid absolute -right-5 top-1/2 -translate-y-1/2 place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground hover:opacity-95 transition shadow-[var(--shadow-warm)]" aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Offer Banner ----------------------------- */

function OfferBanner() {
  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative rounded-3xl overflow-hidden bg-accent/40 grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Special Offer</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold leading-tight text-foreground">
              Tasty Fare,<br />Refreshing Drinks,<br />Joyful Company.
            </h2>
            <p className="mt-4 text-sm text-foreground/70 max-w-sm">
              Order our weekend festive platter of suya, jollof, grilled fish and plantain. Feeds 4.
            </p>
            <div className="mt-6 flex items-center gap-5">
              <Link
                to="/discover"
                className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]"
              >
                Order Now
              </Link>
              <div>
                <span className="font-display text-2xl font-bold text-foreground">₦18,990</span>
                <span className="ml-2 text-sm line-through text-muted-foreground">₦27,990</span>
              </div>
            </div>
          </div>
          <div className="relative h-64 md:h-full min-h-[280px]">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
              alt="Friends sharing a festive dinner with drinks"
              width={1200}
              height={800}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute top-4 right-4 grid place-items-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[var(--shadow-warm)]">
              50%<br />OFF
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Testimonials ----------------------------- */

function Testimonials() {
  const cards = [
    { name: "Tunde Bakare", role: "Foodie · Lagos", avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&q=80", text: "The jollof from Mama Ngozi tastes exactly like home. Naija Eats finally gave chefs a stage." },
    { name: "Rahim Hassan", role: "Chef · London", avatar: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&h=150&fit=crop&q=80", text: "I started cooking from my kitchen in Peckham. Within a month, I had 80 regulars ordering my egusi every weekend." },
    { name: "Emily Carter", role: "Customer · Manchester", avatar: "https://images.unsplash.com/photo-1618085222100-93f0eecad0aa?w=150&h=150&fit=crop&q=80", text: "I found African chefs I never knew existed in my city. The chef booking made my birthday unforgettable." },
    { name: "Sade Ojo", role: "Foodie · Abuja", avatar: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=150&h=150&fit=crop&q=80", text: "Fast delivery, real flavour, and stories about every dish. This is more than an app." },
  ];
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Real eaters. Real chefs. Real stories behind every order.
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-4 gap-4 items-center">
          {cards.map((c, i) => {
            const featured = i === 1;
            return (
              <article
                key={c.name}
                className={`rounded-2xl border p-5 ${
                  featured
                    ? "bg-card border-primary/30 shadow-[var(--shadow-card)] md:-translate-y-4 md:scale-105 relative z-10"
                    : "bg-card/70 border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <div className="text-sm font-semibold leading-tight">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.role}</div>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-foreground/80">"{c.text}"</p>
                <div className="mt-3 flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <button className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]">
            View All
          </button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Serve Promise ---------------------------- */

function ServePromise() {
  const items = [
    { img: illusOrder, title: "Easy To Order", copy: "Browse, pick and order in just a few taps." },
    { img: illusRider, title: "Fastest Delivery", copy: "Hot meals at your door, tracked end to end." },
    { img: illusChef, title: "Cooked with Culture", copy: "Recipes from real African kitchens, every order." },
  ];
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">What We Serve</div>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Your Favourite African<br />Food Delivery Partner
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6 md:gap-8">
          {items.map((it, idx) => (
            <div key={it.title} className="text-center group">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-[360px] rounded-[2rem] overflow-hidden bg-muted shadow-[var(--shadow-card)] ring-1 ring-black/5">
                <img
                  src={it.img}
                  alt={it.title}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur text-xs font-bold text-primary shadow-md">
                  {idx + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{it.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">{it.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Start ordering CTA ------------------------- */

function StartOrderingCTA() {
  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-16 text-white"
          style={{
            background:
              "radial-gradient(90% 90% at 100% 0%, oklch(0.75 0.16 85 / 0.28), transparent 55%), radial-gradient(90% 90% at 0% 100%, oklch(0.55 0.22 25 / 0.35), transparent 55%), linear-gradient(160deg, #0b0906 0%, #14100c 55%, #1a130e 100%)",
          }}
        >
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Sparkle className="h-3 w-3 text-[var(--brand-gold)]" />
                Ready when you are
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-[52px] font-semibold tracking-[-0.02em] mt-5 leading-[1.02]">
                Start ordering now.<br />
                <span className="italic font-light text-[var(--brand-gold)]">Eat happy in minutes.</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
                Pick from real chefs, African restaurants, and ethnic groceries near you.
                Delivered hot, tracked live, cooked with culture on every single order.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 rounded-full !bg-white !text-[#1a0e0a] px-6 sm:px-7 py-3.5 text-sm font-bold shadow-xl hover:scale-105 transition"
                >
                  Order now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white px-6 sm:px-7 py-3.5 text-sm font-bold hover:bg-white/15 transition"
                >
                  Create an account
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> Fast delivery
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-[var(--brand-gold)] fill-current" /> 4.9 average rating
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ChefHat className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> 500+ chefs
                </span>
              </div>
            </div>

            {/* Right-side visual */}
            <div className="relative hidden md:block">
              <div className="relative aspect-square max-w-[420px] mx-auto rounded-[2rem] overflow-hidden ring-1 ring-white/15 shadow-2xl">
                <img
                  src={heroJollof}
                  alt="Ready-to-order dishes"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Floating chef chip */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 flex items-center gap-2.5 rounded-2xl !bg-white/95 backdrop-blur pl-2 pr-4 py-2 shadow-xl border border-white/60">
                <img
                  src={chefPortrait}
                  alt="Chef"
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold !text-[#1a0e0a]">Cooking now</div>
                  <div className="text-[10px] !text-zinc-500">15 chefs online</div>
                </div>
              </div>

              {/* Floating rating chip */}
              <div className="absolute -top-3 right-2 sm:-right-2 flex items-center gap-1.5 rounded-full bg-[var(--brand-gold)] !text-[#1a0e0a] px-3 py-1.5 shadow-lg">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-bold">4.9 loved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Footer ------------------------------- */

function Footer() {
  return (
    <footer id="contact" className="px-4 sm:px-6 pt-10 pb-6 bg-background">
      <div className="mx-auto max-w-7xl rounded-3xl bg-[var(--brand-ink)] text-white p-8 sm:p-12 shadow-[var(--shadow-soft)]">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-10 w-10 ring-2 ring-white/10 rounded-full" />
              <span className="font-display text-xl font-bold tracking-tight">
                Naija<span className="text-primary">Eats</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-[300px]">
              The home of African &amp; authentic food, delivered fresh and cooked with culture.
            </p>
            <div className="mt-6 flex gap-2.5">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="grid place-items-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-primary hover:text-primary-foreground transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-white">Customer</div>
            <ul className="mt-5 space-y-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
              <li><a href="#" className="hover:text-white transition">Our Journey</a></li>
              <li><a href="#" className="hover:text-white transition">Returns</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
            </ul>
          </div>

          {/* Verticals */}
          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-white">Verticals</div>
            <ul className="mt-5 space-y-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition">Restaurants</a></li>
              <li><a href="#" className="hover:text-white transition">Chefs</a></li>
              <li><a href="#" className="hover:text-white transition">Grocery</a></li>
              <li><a href="#" className="hover:text-white transition">Chef Booking</a></li>
              <li><a href="#" className="hover:text-white transition">Affiliate</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <div className="text-sm font-semibold text-white">Sign Up For Our Newsletter</div>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Get launch news, early invites and exclusive offers straight to your inbox.
            </p>
            <FooterNewsletter />
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <Mail className="h-3.5 w-3.5" />
              <span>hello@naijaeats.com</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Naija Eats. Cooked with culture.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase(), role: "customer" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already on the list. We'll be in touch soon.");
        setEmail("");
        return;
      }
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setEmail("");
    toast.success("You're on the list! Welcome to the family.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex items-center gap-2 rounded-full bg-white/10 p-1.5 pl-4 ring-1 ring-white/10 focus-within:ring-primary/60 transition">
      <input
        type="email"
        required
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Subscribe"
        className="grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

/* ----------------------------- Brand Wordmark ---------------------------- */

function BrandWordmark() {
  return (
    <div className="relative bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-4 overflow-visible">
        <div
          className="text-center select-none bg-gradient-to-b from-foreground via-foreground to-primary bg-clip-text text-transparent"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(64px, 18vw, 260px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            paddingBottom: "0.15em",
            paddingRight: "0.08em",
          }}
        >
          NaijaEats
        </div>
      </div>
    </div>
  );
}
