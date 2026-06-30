import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
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
import heroJollof from "@/assets/hero-jollof.jpg";
import dishJollof from "@/assets/dish-jollof.jpg";
import dishSuya from "@/assets/dish-suya.jpg";
import dishEgusi from "@/assets/dish-egusi.jpg";
import dishPuffpuff from "@/assets/dish-puffpuff.jpg";
import chefPortrait from "@/assets/chef-portrait.jpg";
import offerPlatter from "@/assets/offer-platter.jpg";
import avatarTunde from "@/assets/avatar-tunde.jpg";
import avatarRahim from "@/assets/avatar-rahim.jpg";
import avatarEmily from "@/assets/avatar-emily.jpg";
import avatarSade from "@/assets/avatar-sade.jpg";
import illusRider from "@/assets/illus-rider.png";
import illusOrder from "@/assets/illus-order.png";
import illusChef from "@/assets/illus-chef.png";
import { Logo } from "@/components/naija/Logo";
import { useState, useEffect, useRef, createContext, useContext, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Naija Eats — The Home of African & Authentic Food, Delivered" },
      { name: "description", content: "Order from home chefs, African & Caribbean restaurants, and ethnic grocers. Book personal chefs. Cooked with culture, delivered fresh." },
      { property: "og:title", content: "Naija Eats — Cooked with Culture, Delivered Fresh" },
      { property: "og:description", content: "The food ecosystem for African & authentic cuisine. Home chefs, restaurants, groceries, and personal chef experiences." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SearchProvider>
        <Nav />
        <Hero />
      </SearchProvider>
      <Story />
      <SpecialDishes />
      <WhyUs />
      <MenuCarousel />
      <OfferBanner />
      <Testimonials />
      <ServePromise />
      <Footer />
      <BrandWordmark />
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
    <header className="relative z-30">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <Logo className="h-10 w-10" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Naija<span className="text-primary">Eats</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-foreground/80">
          <a href="#top" className="text-primary">Home</a>
          <a href="#menu" className="hover:text-primary transition">Menu</a>
          <a href="#story" className="hover:text-primary transition">About</a>
          <a href="#why" className="hover:text-primary transition">Vendors</a>
          <a href="#contact" className="hover:text-primary transition">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={search.open}
            className="hidden sm:grid place-items-center h-9 w-9 rounded-full border border-border text-foreground/70 hover:text-primary hover:border-primary transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-foreground/60">
            <span className="px-2 py-1 rounded-full bg-muted">NG</span>
            <span className="px-2 py-1 rounded-full">UK</span>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]"
          >
            Sign Up
          </Link>
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
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Decor */}
      <div className="absolute top-10 -left-20 text-accent/40 w-[420px] h-[420px] pointer-events-none">
        <Blob className="w-full h-full" />
      </div>
      <Leaf className="absolute top-32 right-[42%] h-10 w-10 text-secondary/70" rotate={20} />
      <Leaf className="absolute bottom-24 left-[8%] h-12 w-12 text-secondary/60" rotate={120} />

      <div className="relative mx-auto max-w-7xl px-6 pt-8 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="relative z-10">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight text-foreground">
            Everything Food.<br />
            One African <span className="text-primary">Marketplace.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
            Order restaurant meals, discover home chefs, shop groceries, and enjoy fast delivery—all from a platform built for African food culture.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setInitialQuery(q);
              search.open();
            }}
            className="mt-8 flex items-center gap-2 rounded-full bg-card border border-border pl-5 pr-1.5 py-1.5 shadow-[var(--shadow-soft)] max-w-md focus-within:border-primary transition"
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
              className="rounded-full bg-primary text-primary-foreground h-9 w-9 grid place-items-center hover:opacity-95 transition"
              aria-label="Search"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-warm)]"
            >
              Order Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", role: "chef" }}
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border text-foreground px-7 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary transition"
            >
              Become a Vendor
            </Link>
          </div>

          {/* Featured chef chip */}
          <div className="mt-12 inline-flex items-center gap-3 rounded-full bg-card border border-border pl-1.5 pr-5 py-1.5 shadow-[var(--shadow-soft)]">
            <img
              src={chefPortrait}
              alt="Chef Amaka"
              width={48}
              height={48}
              loading="lazy"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-semibold leading-tight">Chef Amaka</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Home Chef · Lagos</div>
            </div>
          </div>
        </div>

        {/* Right — image with floating price card */}
        <div className="relative">
          <div className="relative aspect-square rounded-full overflow-hidden bg-accent/30">
            <img
              src={heroJollof}
              alt="Steaming pot of Nigerian jollof rice"
              width={1280}
              height={1280}
              className="h-full w-full object-cover"
            />
          </div>
          <Leaf className="absolute -top-4 right-10 h-14 w-14 text-secondary" rotate={-20} />
          <Leaf className="absolute top-1/3 -left-6 h-12 w-12 text-secondary/80" rotate={70} />
          <Sparkle className="absolute top-12 left-8 h-6 w-6 text-accent" />

          {/* Floating price card */}
          <div className="absolute -bottom-6 -left-6 md:-left-10 bg-card rounded-2xl shadow-[var(--shadow-card)] p-3 flex items-center gap-3 border border-border">
            <img
              src={dishSuya}
              alt="Suya"
              width={64}
              height={64}
              loading="lazy"
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div>
              <div className="text-xs font-semibold text-foreground">Suya Skewers</div>
              <div className="text-primary font-bold text-lg leading-none">₦7,490</div>
            </div>
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
    ["500+", "Home Chefs"],
    ["50+", "Cities Covered"],
    ["4.9★", "Average Rating"],
  ];
  return (
    <section id="story" className="relative py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-start gap-3">
            <span className="mt-2 h-12 w-1 bg-primary rounded-full" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Our Story</div>
              <h2 className="mt-3 font-display text-3xl md:text-5xl font-bold leading-tight text-foreground text-left">
                Crafted with love,
                spiced with passion,
                and made to satisfy
                every craving.
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img src={dishJollof} alt="Jollof rice" width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img src={dishSuya} alt="Suya" width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="aspect-[16/7] rounded-2xl overflow-hidden">
            <img src={offerPlatter} alt="A platter of African dishes" width={1024} height={448} loading="lazy" className="h-full w-full object-cover" />
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 flex items-center gap-6 flex-wrap">
            {stats.map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-primary">{n}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
            <button className="ml-auto flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                <Play className="h-4 w-4 fill-current" />
              </span>
              Watch Intro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Special Dishes --------------------------- */

const specialDishes = [
  { name: "Jollof Rice", price: "₦5,500", rating: 4.9, img: dishJollof },
  { name: "Suya Skewers", price: "₦7,490", rating: 4.8, img: dishSuya },
  { name: "Egusi & Pounded Yam", price: "₦6,200", rating: 4.9, img: dishEgusi },
  { name: "Puff Puff (12pc)", price: "₦2,500", rating: 4.7, img: dishPuffpuff },
];

function SpecialDishes() {
  return (
    <section className="relative py-20 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Special Dishes from <span className="text-primary">Our Kitchens</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Bestsellers cooked by home chefs and African restaurants across Lagos, Abuja, London and Manchester.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {specialDishes.map((d) => (
            <article
              key={d.name}
              className="relative rounded-3xl bg-card border border-border pt-16 pb-6 px-5 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full overflow-hidden ring-4 ring-background shadow-[var(--shadow-warm)]">
                <img src={d.img} alt={d.name} width={256} height={256} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="text-xs font-bold text-primary">{d.price}</div>
              <h3 className="mt-1 font-semibold text-foreground text-base leading-tight">{d.name}</h3>
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
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="h-2 w-6 rounded-full bg-primary" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Why Us ------------------------------- */

function WhyUs() {
  const tiles = [
    { icon: ChefHat, title: "Home Chefs", copy: "Authentic recipes from grandmothers and aunties." },
    { icon: Utensils, title: "African Restaurants", copy: "Lagos buka to Caribbean roti — at your door." },
    { icon: ShoppingBasket, title: "Ethnic Grocery", copy: "Egusi, palm oil, plantains and scotch bonnets." },
    { icon: CalendarHeart, title: "Personal Chef", copy: "Book a chef for your dinner or celebration." },
  ];
  return (
    <section id="why" className="relative py-20 md:py-28 bg-[oklch(0.95_0.035_75)]">
      <Sparkle className="absolute top-12 left-12 h-5 w-5 text-accent" />
      <Sparkle className="absolute bottom-16 left-[40%] h-4 w-4 text-accent/70" />
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Why <span className="text-primary">Naija Eats</span>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-md leading-relaxed">
            We are more than delivery. We are a food ecosystem — connecting the people who cook with culture to the people who crave it. Verified chefs, fair pricing, and stories behind every dish.
          </p>
          <Link
            to="/discover"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]"
          >
            Explore More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {tiles.map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="rounded-2xl bg-card border border-border p-6 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition"
            >
              <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Menu Carousel ---------------------------- */

function MenuCarousel() {
  const items = [
    { name: "Jollof Bowl", price: "₦5,500", tag: "Best Seller", img: dishJollof },
    { name: "Suya Plate", price: "₦7,490", tag: "Spicy", img: dishSuya },
    { name: "Egusi & Yam", price: "₦6,200", tag: "Comfort", img: dishEgusi },
    { name: "Puff Puff Stack", price: "₦2,500", tag: "Sweet", img: dishPuffpuff },
  ];
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
          {items.map((d) => (
            <article key={d.name} className="relative rounded-3xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]">
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
              Order our weekend festive platter — suya, jollof, grilled fish and plantain. Feeds 4.
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
            <img src={offerPlatter} alt="Festive platter" width={1024} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
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
    { name: "Tunde Bakare", role: "Foodie · Lagos", avatar: avatarTunde, text: "The jollof from Mama Ngozi tastes exactly like home. Naija Eats finally gave home chefs a stage." },
    { name: "Rahim Hassan", role: "Chef · London", avatar: avatarRahim, text: "I started cooking from my kitchen in Peckham. Within a month, I had 80 regulars ordering my egusi every weekend." },
    { name: "Emily Carter", role: "Customer · Manchester", avatar: avatarEmily, text: "I found African chefs I never knew existed in my city. The personal chef booking made my birthday unforgettable." },
    { name: "Sade Ojo", role: "Foodie · Abuja", avatar: avatarSade, text: "Fast delivery, real flavour, and stories about every dish. This is more than an app." },
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
        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {items.map((it) => (
            <div key={it.title} className="text-center">
              <div className="mx-auto h-44 w-44 grid place-items-center">
                <img src={it.img} alt="" width={768} height={768} loading="lazy" className="h-full w-full object-contain" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{it.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-[200px] mx-auto">{it.copy}</p>
            </div>
          ))}
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
              The home of African &amp; authentic food — delivered fresh, cooked with culture.
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
              <li><a href="#" className="hover:text-white transition">Home Chefs</a></li>
              <li><a href="#" className="hover:text-white transition">Grocery</a></li>
              <li><a href="#" className="hover:text-white transition">Personal Chefs</a></li>
              <li><a href="#" className="hover:text-white transition">Affiliate</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <div className="text-sm font-semibold text-white">Sign Up For Our Newsletter</div>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Get launch news, early invites and exclusive offers — straight to your inbox.
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
        toast.success("You're already on the list — we'll be in touch soon.");
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
