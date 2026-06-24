import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { f as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { u as useCart } from "./router-Ck7azls6.mjs";
import { A as Avatar, a as AvatarImage, b as AvatarFallback } from "./avatar-DhUB8IKM.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import { L as Logo } from "./Logo-Du-Zai3C.mjs";
import { h as ShieldCheck, r as Store, aa as ClipboardList, ab as Bike, ac as LayoutDashboard, ad as PackageSearch, H as Wallet, ae as FileText, af as Compass, L as ShoppingBag, ag as CalendarCheck, z as MessageCircle, B as Bell, c as ShoppingBasket, y as UtensilsCrossed, C as ChefHat } from "../_libs/lucide-react.mjs";
function AppShell({ children, hideHeader, hideBottomNav }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { itemCount } = useCart();
  const { data: me } = useQuery({
    queryKey: ["me-header"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", uid).maybeSingle();
      return { email: u.user?.email ?? "", ...p ?? {} };
    },
    staleTime: 5 * 60 * 1e3
  });
  const { data: vendorType } = useQuery({
    queryKey: ["my-vendor-type"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: v } = await supabase.from("vendors").select("type").eq("owner_id", uid).maybeSingle();
      return v?.type ?? null;
    },
    enabled: role === "vendor",
    staleTime: 5 * 60 * 1e3
  });
  const initials = (me?.full_name || me?.email || "?").split(/[\s@]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const isActive = (to) => path === to || path.startsWith(to + "/");
  const chatLink = role === "vendor" ? "/vendor/messages" : role === "customer" ? "/chats" : null;
  const navByRole = {
    customer: [
      { to: "/discover", label: "Discover", Icon: Compass },
      { to: "/orders", label: "Orders", Icon: ShoppingBag },
      { to: "/book", label: "Book", Icon: CalendarCheck },
      { to: "/wallet", label: "Wallet", Icon: Wallet }
    ],
    vendor: /* @__PURE__ */ (() => {
      const isChef = vendorType === "home_chef" || vendorType === "personal_chef";
      const isGrocery = vendorType === "grocery";
      return [
        { to: "/vendor/dashboard", label: "Dashboard", Icon: LayoutDashboard },
        { to: "/vendor/orders", label: "Orders", Icon: ClipboardList },
        { to: "/vendor/menu", label: isGrocery ? "Products" : "Menu", Icon: isGrocery ? ShoppingBasket : UtensilsCrossed },
        { to: "/vendor/earnings", label: "Earnings", Icon: Wallet },
        { to: "/vendor/profile", label: isGrocery ? "Store" : isChef ? "Kitchen" : "Restaurant", Icon: isGrocery ? ShoppingBasket : isChef ? ChefHat : Store }
      ];
    })(),
    rider: [
      { to: "/rider/dashboard", label: "Home", Icon: LayoutDashboard },
      { to: "/rider/available", label: "Available", Icon: PackageSearch },
      { to: "/rider/earnings", label: "Earnings", Icon: Wallet },
      { to: "/rider/documents", label: "Documents", Icon: FileText }
    ],
    admin: [
      { to: "/admin/dashboard", label: "Admin", Icon: ShieldCheck },
      { to: "/admin/vendors", label: "Vendors", Icon: Store },
      { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
      { to: "/admin/riders", label: "Riders", Icon: Bike }
    ]
  };
  const navItems = role ? navByRole[role] : roleLoading ? [] : navByRole.customer;
  const desktopNavItem = (to, label, Icon) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to,
      className: `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive(to) ? "bg-[var(--brand-clay)] text-[var(--brand-cream)]" : "text-foreground hover:bg-muted"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
        label
      ]
    }
  );
  const mobileNavItem = (to, label, Icon) => {
    const active = isActive(to);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to,
        "aria-label": label,
        className: "flex flex-1 items-center justify-center py-2",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: `flex items-center justify-center gap-2 transition ${active ? "bg-[var(--brand-clay)] text-white shadow-lg shadow-[var(--brand-clay)]/40 px-4 h-11 rounded-full" : "h-11 w-11 rounded-full text-white/80 hover:text-white"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 shrink-0" }),
              active ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium whitespace-nowrap", children: label }) : null
            ]
          }
        )
      }
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    !hideHeader && /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-8 w-8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg font-semibold hidden sm:inline", children: "Naija Eats" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden md:flex items-center gap-1 ml-2", children: navItems.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: desktopNavItem(n.to, n.label, n.Icon) }, n.to)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        role === "customer" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/cart",
            "aria-label": "Cart",
            className: "relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-4 w-4" }),
              itemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold grid place-items-center", children: itemCount })
            ]
          }
        ),
        chatLink && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: chatLink,
            "aria-label": "Messages",
            className: "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/notifications",
            "aria-label": "Notifications",
            className: "relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-clay)]" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/account",
            "aria-label": "Profile",
            className: "rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-9 w-9", children: [
              me?.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: me.avatar_url, alt: me.full_name ?? "Profile" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs font-semibold", children: initials || "?" })
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "pb-20 md:pb-0", children }),
    navItems.length > 0 && !hideBottomNav && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:hidden fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "pointer-events-auto mx-auto max-w-sm flex items-stretch bg-[#1a1a1a] rounded-full px-2 py-1.5 shadow-2xl will-change-transform [transform:translateZ(0)]", children: navItems.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 flex", children: mobileNavItem(n.to, n.label, n.Icon) }, n.to)) }) })
  ] });
}
export {
  AppShell as A
};
