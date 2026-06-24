import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { L as Logo } from "./Logo-Du-Zai3C.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as Dialog, a as DialogContent } from "./dialog-BKo0Bocc.mjs";
import { S as Search, A as ArrowRight, P as Play, b as Star, C as ChefHat, U as Utensils, c as ShoppingBasket, d as CalendarHeart, e as ChevronLeft, f as ChevronRight, I as Instagram, T as Twitter, F as Facebook, M as Mail, g as Send } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const heroJollof = "/assets/hero-jollof-BrS3gLwn.jpg";
const dishJollof = "/assets/dish-jollof-CVRkcjD-.jpg";
const dishSuya = "/assets/dish-suya-DpBlSg2y.jpg";
const dishEgusi = "/assets/dish-egusi-CP0mE27V.jpg";
const dishPuffpuff = "/assets/dish-puffpuff-CK4cEKkN.jpg";
const chefPortrait = "/assets/chef-portrait-BFQq25Da.jpg";
const offerPlatter = "/assets/offer-platter-ChNzJaiq.jpg";
const avatarTunde = "/assets/avatar-tunde-DKZcR68I.jpg";
const avatarRahim = "/assets/avatar-rahim-CMB9VcAj.jpg";
const avatarEmily = "/assets/avatar-emily-UeKLHX72.jpg";
const avatarSade = "/assets/avatar-sade-pocPrYcd.jpg";
const illusRider = "/assets/illus-rider-epAE0vMA.png";
const illusOrder = "/assets/illus-order-CGExVz7n.png";
const illusChef = "/assets/illus-chef-DmVLqazU.png";
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground overflow-x-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SearchProvider, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Nav, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Hero, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Story, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialDishes, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WhyUs, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MenuCarousel, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OfferBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Testimonials, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ServePromise, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BrandWordmark, {})
  ] });
}
const SearchContext = reactExports.createContext(null);
function useSearchModal() {
  const ctx = reactExports.useContext(SearchContext);
  if (!ctx) throw new Error("SearchContext missing");
  return ctx;
}
function SearchProvider({
  children
}) {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [initialQuery, setInitialQuery] = reactExports.useState("");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SearchContext.Provider, { value: {
    open: () => setIsOpen(true)
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SearchSeedContext.Provider, { value: {
    initialQuery,
    setInitialQuery
  }, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(SearchDialog, { open: isOpen, onOpenChange: setIsOpen })
  ] }) });
}
const SearchSeedContext = reactExports.createContext({
  initialQuery: "",
  setInitialQuery: () => {
  }
});
function useDebounced(value, ms = 250) {
  const [v, setV] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
function SearchDialog({
  open,
  onOpenChange
}) {
  const {
    initialQuery
  } = reactExports.useContext(SearchSeedContext);
  const [q, setQ] = reactExports.useState("");
  const inputRef = reactExports.useRef(null);
  const debounced = useDebounced(q, 220);
  reactExports.useEffect(() => {
    if (open) {
      setQ(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialQuery]);
  const term = debounced.trim();
  const {
    data,
    isFetching
  } = useQuery({
    queryKey: ["landing-search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term.replace(/[%_]/g, "")}%`;
      const [vendorsRes, itemsRes] = await Promise.all([supabase.from("vendors").select("id,name,slug,city,country,type,tagline,cover_image_url").eq("status", "approved").or(`name.ilike.${like},tagline.ilike.${like},city.ilike.${like}`).limit(8), supabase.from("menu_items").select("id,name,price,currency,image_url,vendor_id,vendors!inner(name,slug,city,status)").eq("is_available", true).eq("vendors.status", "approved").or(`name.ilike.${like},description.ilike.${like}`).limit(10)]);
      return {
        vendors: vendorsRes.data ?? [],
        items: itemsRes.data ?? []
      };
    },
    staleTime: 3e4
  });
  const fmt = (n, c) => `${c === "GBP" ? "£" : "₦"}${Number(n).toLocaleString()}`;
  const empty = term.length >= 2 && !isFetching && (data?.vendors.length ?? 0) === 0 && (data?.items.length ?? 0) === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl p-0 gap-0 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: inputRef, value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search dishes, chefs, restaurants, cities…", className: "flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground" }),
      isFetching && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Searching…" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[60vh] overflow-y-auto", children: [
      term.length < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-sm text-muted-foreground", children: "Type at least 2 letters to search across dishes, chefs and restaurants in Nigeria and the UK." }),
      empty && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-sm text-muted-foreground text-center", children: [
        'No matches for "',
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: term }),
        '". Try a different word.'
      ] }),
      (data?.vendors?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold", children: "Chefs & Restaurants" }),
        data.vendors.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/vendor/$slug", params: {
          slug: v.slug
        }, onClick: () => onOpenChange(false), className: "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0", children: v.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: v.cover_image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-[var(--gradient-warm)]" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm truncate", children: v.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
              v.type?.replace("_", " "),
              " · ",
              v.city,
              " · ",
              v.country
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
        ] }, v.id))
      ] }),
      (data?.items?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold", children: "Dishes" }),
        data.items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/vendor/$slug", params: {
          slug: it.vendors.slug
        }, onClick: () => onOpenChange(false), className: "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0", children: it.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: it.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-[var(--gradient-warm)]" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm truncate", children: it.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
              it.vendors.name,
              " · ",
              it.vendors.city
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold text-primary shrink-0", children: fmt(it.price, it.currency) })
        ] }, it.id))
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-muted/40 px-4 py-3 flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Sign in to order, save favourites and track delivery." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", onClick: () => onOpenChange(false), className: "rounded-full bg-primary text-primary-foreground px-4 py-1.5 font-semibold hover:opacity-95 transition", children: "Sign in" })
    ] })
  ] }) });
}
function Leaf({
  className = "",
  rotate = 0
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 64 64", className, style: {
    transform: `rotate(${rotate}deg)`
  }, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 56C8 28 28 8 56 8c0 28-20 48-48 48Z", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 50 50 14", stroke: "white", strokeOpacity: "0.45", strokeWidth: "1.5", fill: "none" })
  ] });
}
function Blob({
  className = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 200 200", className, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "currentColor", d: "M44.5,-58.3C56.1,-48.6,62.5,-33.5,66.6,-17.6C70.7,-1.7,72.4,15,65.6,27.6C58.7,40.3,43.3,49,27.5,55.7C11.7,62.4,-4.6,67.1,-19.4,63.6C-34.2,60.1,-47.4,48.5,-55.7,34.4C-64,20.4,-67.3,3.8,-64.2,-11.2C-61,-26.2,-51.5,-39.7,-39.4,-49.6C-27.3,-59.6,-13.6,-66.1,1.6,-68.1C16.8,-70.1,33.6,-67.6,44.5,-58.3Z", transform: "translate(100 100)" }) });
}
function Sparkle({
  className = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", className, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z", fill: "currentColor" }) });
}
function Nav() {
  const search = useSearchModal();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "relative z-30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 py-5 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#top", className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-10 w-10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-xl font-bold tracking-tight text-foreground", children: [
        "Naija",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Eats" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden md:flex items-center gap-9 text-sm font-medium text-foreground/80", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#top", className: "text-primary", children: "Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#menu", className: "hover:text-primary transition", children: "Menu" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#story", className: "hover:text-primary transition", children: "About" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#why", className: "hover:text-primary transition", children: "Vendors" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#contact", className: "hover:text-primary transition", children: "Contact" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: search.open, className: "hidden sm:grid place-items-center h-9 w-9 rounded-full border border-border text-foreground/70 hover:text-primary hover:border-primary transition", "aria-label": "Search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex items-center gap-1 text-xs font-semibold text-foreground/60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 rounded-full bg-muted", children: "NG" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 rounded-full", children: "UK" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]", children: "Sign Up" })
    ] })
  ] }) });
}
function Hero() {
  const search = useSearchModal();
  const {
    setInitialQuery
  } = reactExports.useContext(SearchSeedContext);
  const [q, setQ] = reactExports.useState("");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "top", className: "relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-10 -left-20 text-accent/40 w-[420px] h-[420px] pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Blob, { className: "w-full h-full" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Leaf, { className: "absolute top-32 right-[42%] h-10 w-10 text-secondary/70", rotate: 20 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Leaf, { className: "absolute bottom-24 left-[8%] h-12 w-12 text-secondary/60", rotate: 120 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto max-w-7xl px-6 pt-8 pb-24 grid lg:grid-cols-2 gap-12 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight text-foreground", children: [
          "Everything Food.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "One African ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Marketplace." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed", children: "Order restaurant meals, discover home chefs, shop groceries, and enjoy fast delivery—all from a platform built for African food culture." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          setInitialQuery(q);
          search.open();
        }, className: "mt-8 flex items-center gap-2 rounded-full bg-card border border-border pl-5 pr-1.5 py-1.5 shadow-[var(--shadow-soft)] max-w-md focus-within:border-primary transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), onFocus: () => {
            setInitialQuery(q);
            search.open();
          }, placeholder: "Search jollof, suya, chefs, restaurants…", className: "flex-1 bg-transparent outline-none text-sm py-2", "aria-label": "Search foods, chefs and restaurants" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "rounded-full bg-primary text-primary-foreground h-9 w-9 grid place-items-center hover:opacity-95 transition", "aria-label": "Search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-warm)]", children: [
            "Order Now",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#contact", className: "inline-flex items-center gap-2 rounded-full bg-card border border-border text-foreground px-7 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary transition", children: "Become a Vendor" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 inline-flex items-center gap-3 rounded-full bg-card border border-border pl-1.5 pr-5 py-1.5 shadow-[var(--shadow-soft)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: chefPortrait, alt: "Chef Amaka", width: 48, height: 48, loading: "lazy", className: "h-10 w-10 rounded-full object-cover" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold leading-tight", children: "Chef Amaka" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground uppercase tracking-wider", children: "Home Chef · Lagos" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative aspect-square rounded-full overflow-hidden bg-accent/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: heroJollof, alt: "Steaming pot of Nigerian jollof rice", width: 1280, height: 1280, className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Leaf, { className: "absolute -top-4 right-10 h-14 w-14 text-secondary", rotate: -20 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Leaf, { className: "absolute top-1/3 -left-6 h-12 w-12 text-secondary/80", rotate: 70 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkle, { className: "absolute top-12 left-8 h-6 w-6 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -bottom-6 -left-6 md:-left-10 bg-card rounded-2xl shadow-[var(--shadow-card)] p-3 flex items-center gap-3 border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: dishSuya, alt: "Suya", width: 64, height: 64, loading: "lazy", className: "h-14 w-14 rounded-xl object-cover" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-foreground", children: "Suya Skewers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-primary font-bold text-lg leading-none", children: "₦7,490" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Story() {
  const stats = [["10K+", "Orders Delivered"], ["500+", "Home Chefs"], ["50+", "Cities Covered"], ["4.9★", "Average Rating"]];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "story", className: "relative py-20 md:py-28 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-2 h-12 w-1 bg-primary rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-widest text-primary", children: "Our Story" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 font-display text-3xl md:text-5xl font-bold leading-tight text-foreground text-left", children: "Crafted with love, spiced with passion, and made to satisfy every craving." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: dishJollof, alt: "Jollof rice", width: 1024, height: 768, loading: "lazy", className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: dishSuya, alt: "Suya", width: 1024, height: 768, loading: "lazy", className: "h-full w-full object-cover" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[16/7] rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: offerPlatter, alt: "A platter of African dishes", width: 1024, height: 448, loading: "lazy", className: "h-full w-full object-cover" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-card border border-border p-5 flex items-center gap-6 flex-wrap", children: [
        stats.map(([n, l]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-2xl font-bold text-primary", children: n }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider text-muted-foreground", children: l })
        ] }, l)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ml-auto flex items-center gap-2 text-sm font-semibold text-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 fill-current" }) }),
          "Watch Intro"
        ] })
      ] })
    ] })
  ] }) });
}
const specialDishes = [{
  name: "Jollof Rice",
  price: "₦5,500",
  rating: 4.9,
  img: dishJollof
}, {
  name: "Suya Skewers",
  price: "₦7,490",
  rating: 4.8,
  img: dishSuya
}, {
  name: "Egusi & Pounded Yam",
  price: "₦6,200",
  rating: 4.9,
  img: dishEgusi
}, {
  name: "Puff Puff (12pc)",
  price: "₦2,500",
  rating: 4.7,
  img: dishPuffpuff
}];
function SpecialDishes() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "relative py-20 md:py-24 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-3xl md:text-4xl font-bold text-foreground", children: [
        "Special Dishes from ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Our Kitchens" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Bestsellers cooked by home chefs and African restaurants across Lagos, Abuja, London and Manchester." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid grid-cols-2 md:grid-cols-4 gap-6", children: specialDishes.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "relative rounded-3xl bg-card border border-border pt-16 pb-6 px-5 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full overflow-hidden ring-4 ring-background shadow-[var(--shadow-warm)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: d.img, alt: d.name, width: 256, height: 256, loading: "lazy", className: "h-full w-full object-cover" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-primary", children: d.price }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 font-semibold text-foreground text-base leading-tight", children: d.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-center gap-0.5 text-accent", children: [
        Array.from({
          length: 5
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-current" }, i)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-[11px] text-muted-foreground", children: d.rating })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mt-4 w-full rounded-full bg-primary text-primary-foreground py-2 text-xs font-semibold hover:opacity-95 transition", children: "Order Now" })
    ] }, d.name)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-6 rounded-full bg-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-border" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-border" })
    ] })
  ] }) });
}
function WhyUs() {
  const tiles = [{
    icon: ChefHat,
    title: "Home Chefs",
    copy: "Authentic recipes from grandmothers and aunties."
  }, {
    icon: Utensils,
    title: "African Restaurants",
    copy: "Lagos buka to Caribbean roti — at your door."
  }, {
    icon: ShoppingBasket,
    title: "Ethnic Grocery",
    copy: "Egusi, palm oil, plantains and scotch bonnets."
  }, {
    icon: CalendarHeart,
    title: "Personal Chef",
    copy: "Book a chef for your dinner or celebration."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "why", className: "relative py-20 md:py-28 bg-[oklch(0.95_0.035_75)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkle, { className: "absolute top-12 left-12 h-5 w-5 text-accent" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkle, { className: "absolute bottom-16 left-[40%] h-4 w-4 text-accent/70" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-3xl md:text-5xl font-bold text-foreground", children: [
          "Why ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Naija Eats" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-muted-foreground max-w-md leading-relaxed", children: "We are more than delivery. We are a food ecosystem — connecting the people who cook with culture to the people who crave it. Verified chefs, fair pricing, and stories behind every dish." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "mt-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]", children: [
          "Explore More",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: tiles.map(({
        icon: Icon,
        title,
        copy
      }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-card border border-border p-6 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center h-11 w-11 rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold text-foreground", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-muted-foreground leading-relaxed", children: copy })
      ] }, title)) })
    ] })
  ] });
}
function MenuCarousel() {
  const items = [{
    name: "Jollof Bowl",
    price: "₦5,500",
    tag: "Best Seller",
    img: dishJollof
  }, {
    name: "Suya Plate",
    price: "₦7,490",
    tag: "Spicy",
    img: dishSuya
  }, {
    name: "Egusi & Yam",
    price: "₦6,200",
    tag: "Comfort",
    img: dishEgusi
  }, {
    name: "Puff Puff Stack",
    price: "₦2,500",
    tag: "Sweet",
    img: dishPuffpuff
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "menu", className: "py-20 md:py-24 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-3xl md:text-4xl font-bold text-foreground", children: [
      "Our ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Menu" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "hidden md:grid absolute -left-5 top-1/2 -translate-y-1/2 place-items-center h-10 w-10 rounded-full bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition shadow-[var(--shadow-soft)]", "aria-label": "Previous", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
      items.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "relative rounded-3xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-square rounded-full overflow-hidden mx-auto w-32 h-32 ring-4 ring-background shadow-[var(--shadow-warm)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: d.img, alt: d.name, width: 256, height: 256, loading: "lazy", className: "h-full w-full object-cover" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 right-2 text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground px-2 py-1 rounded-full", children: d.tag })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-5 text-center font-semibold text-foreground", children: d.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-center text-primary font-bold text-xl", children: d.price })
      ] }, d.name)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "hidden md:grid absolute -right-5 top-1/2 -translate-y-1/2 place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground hover:opacity-95 transition shadow-[var(--shadow-warm)]", "aria-label": "Next", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
    ] })
  ] }) });
}
function OfferBanner() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-12 md:py-20 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-3xl overflow-hidden bg-accent/40 grid md:grid-cols-2 items-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 md:p-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-primary", children: "Special Offer" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-3xl md:text-4xl font-bold leading-tight text-foreground", children: [
        "Tasty Fare,",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Refreshing Drinks,",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Joyful Company."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-foreground/70 max-w-sm", children: "Order our weekend festive platter — suya, jollof, grilled fish and plantain. Feeds 4." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]", children: "Order Now" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-2xl font-bold text-foreground", children: "₦18,990" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-sm line-through text-muted-foreground", children: "₦27,990" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-64 md:h-full min-h-[280px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: offerPlatter, alt: "Festive platter", width: 1024, height: 1024, loading: "lazy", className: "absolute inset-0 h-full w-full object-cover" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "absolute top-4 right-4 grid place-items-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[var(--shadow-warm)]", children: [
        "50%",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "OFF"
      ] })
    ] })
  ] }) }) });
}
function Testimonials() {
  const cards = [{
    name: "Tunde Bakare",
    role: "Foodie · Lagos",
    avatar: avatarTunde,
    text: "The jollof from Mama Ngozi tastes exactly like home. Naija Eats finally gave home chefs a stage."
  }, {
    name: "Rahim Hassan",
    role: "Chef · London",
    avatar: avatarRahim,
    text: "I started cooking from my kitchen in Peckham. Within a month, I had 80 regulars ordering my egusi every weekend."
  }, {
    name: "Emily Carter",
    role: "Customer · Manchester",
    avatar: avatarEmily,
    text: "I found African chefs I never knew existed in my city. The personal chef booking made my birthday unforgettable."
  }, {
    name: "Sade Ojo",
    role: "Foodie · Abuja",
    avatar: avatarSade,
    text: "Fast delivery, real flavour, and stories about every dish. This is more than an app."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 md:py-24 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-3xl md:text-4xl font-bold text-foreground", children: [
        "What Our ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Customers Say" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground max-w-md mx-auto", children: "Real eaters. Real chefs. Real stories behind every order." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid md:grid-cols-4 gap-4 items-center", children: cards.map((c, i) => {
      const featured = i === 1;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: `rounded-2xl border p-5 ${featured ? "bg-card border-primary/30 shadow-[var(--shadow-card)] md:-translate-y-4 md:scale-105 relative z-10" : "bg-card/70 border-border"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: c.avatar, alt: c.name, width: 80, height: 80, loading: "lazy", className: "h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold leading-tight", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: c.role })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-xs leading-relaxed text-foreground/80", children: [
          '"',
          c.text,
          '"'
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex gap-0.5 text-accent", children: Array.from({
          length: 5
        }).map((_, j) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-current" }, j)) })
      ] }, c.name);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition shadow-[var(--shadow-soft)]", children: "View All" }) })
  ] }) });
}
function ServePromise() {
  const items = [{
    img: illusOrder,
    title: "Easy To Order",
    copy: "Browse, pick and order in just a few taps."
  }, {
    img: illusRider,
    title: "Fastest Delivery",
    copy: "Hot meals at your door, tracked end to end."
  }, {
    img: illusChef,
    title: "Cooked with Culture",
    copy: "Recipes from real African kitchens, every order."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 md:py-24 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-primary", children: "What We Serve" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-3xl md:text-4xl font-bold text-foreground", children: [
        "Your Favourite African",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Food Delivery Partner"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid md:grid-cols-3 gap-8", children: items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-44 w-44 grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: it.img, alt: "", width: 768, height: 768, loading: "lazy", className: "h-full w-full object-contain" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold text-foreground", children: it.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-muted-foreground max-w-[200px] mx-auto", children: it.copy })
    ] }, it.title)) })
  ] }) });
}
function Footer() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { id: "contact", className: "px-4 sm:px-6 pt-10 pb-6 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl rounded-3xl bg-[var(--brand-ink)] text-white p-8 sm:p-12 shadow-[var(--shadow-soft)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-12 gap-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-10 w-10 ring-2 ring-white/10 rounded-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-xl font-bold tracking-tight", children: [
            "Naija",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Eats" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-white/60 leading-relaxed max-w-[300px]", children: "The home of African & authentic food — delivered fresh, cooked with culture." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex gap-2.5", children: [Instagram, Twitter, Facebook].map((Icon, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", "aria-label": "Social", className: "grid place-items-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-primary hover:text-primary-foreground transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-white", children: "Customer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-5 space-y-3 text-sm text-white/60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "FAQ" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Contact" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Our Journey" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Returns" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Privacy" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-white", children: "Verticals" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-5 space-y-3 text-sm text-white/60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Restaurants" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Home Chefs" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Grocery" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Personal Chefs" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Affiliate" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-white", children: "Sign Up For Our Newsletter" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-white/60 leading-relaxed", children: "Get launch news, early invites and exclusive offers — straight to your inbox." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FooterNewsletter, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-2 text-xs text-white/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "hello@naijaeats.com" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Naija Eats. Cooked with culture."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Terms" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Privacy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#", className: "hover:text-white transition", children: "Cookies" })
      ] })
    ] })
  ] }) });
}
function FooterNewsletter() {
  const [email, setEmail] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const {
      error
    } = await supabase.from("waitlist").insert({
      email: email.trim().toLowerCase(),
      role: "customer"
    });
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "mt-5 flex items-center gap-2 rounded-full bg-white/10 p-1.5 pl-4 ring-1 ring-white/10 focus-within:ring-primary/60 transition", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, placeholder: "Enter your email address", value: email, onChange: (e) => setEmail(e.target.value), className: "flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: loading, "aria-label": "Subscribe", className: "grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
  ] });
}
function BrandWordmark() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl px-6 pb-12 pt-4 overflow-visible", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center select-none bg-gradient-to-b from-foreground via-foreground to-primary bg-clip-text text-transparent", style: {
    fontFamily: "'Instrument Serif', serif",
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: "clamp(64px, 18vw, 260px)",
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    paddingBottom: "0.15em",
    paddingRight: "0.08em"
  }, children: "NaijaEats" }) }) });
}
export {
  Index as component
};
