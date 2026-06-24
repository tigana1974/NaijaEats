import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link, f as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { m as IoHomeOutline, n as IoHome, o as IoBagHandleOutline, p as IoBagHandle, q as IoCalendarOutline, r as IoCalendar, a as IoCartOutline, s as IoCart, t as IoPersonCircleOutline, u as IoPersonCircle, v as IoNotifications } from "../_libs/react-icons.mjs";
import { u as useCart } from "./router-LlhGIoeI.mjs";
import { L as Logo } from "./Logo-Du-Zai3C.mjs";
import { e as ChevronLeft } from "../_libs/lucide-react.mjs";
function CustomerShell({
  children,
  topBar,
  hideBottomNav,
  showBack,
  backTo,
  containerClassName
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-white text-foreground", children: [
    topBar && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 pt-3 sm:pt-5 pb-2 flex items-center gap-3", children: [
      showBack && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: backTo ?? "/discover",
          className: "-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50",
          "aria-label": "Back",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: topBar })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "main",
      {
        className: containerClassName ?? "mx-auto max-w-6xl px-4 sm:px-6 pb-32 lg:pb-10 lg:pt-2",
        children
      }
    ),
    !hideBottomNav && /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerBottomNav, {})
  ] });
}
function CustomerLocationHeader() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "flex items-center gap-2.5 shrink-0 group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { className: "h-9 w-9 transition-transform duration-300 group-hover:scale-105" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display text-lg font-bold tracking-tight text-zinc-900", children: [
        "Naija",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--brand-clay)]", children: "Eats" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/notifications",
        "aria-label": "Notifications",
        className: "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 text-zinc-700 transition-colors",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(IoNotifications, { className: "h-5 w-5" })
      }
    )
  ] });
}
function CustomerBottomNav() {
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const searchObj = location.search;
  const { itemCount } = useCart();
  const items = [
    {
      to: "/discover",
      label: "Home",
      IconActive: IoHome,
      IconInactive: IoHomeOutline,
      matchPaths: ["/", "/discover"]
    },
    {
      to: "/groceries",
      label: "Groceries",
      IconActive: IoBagHandle,
      IconInactive: IoBagHandleOutline
    },
    {
      to: "/book",
      label: "Book",
      IconActive: IoCalendar,
      IconInactive: IoCalendarOutline
    },
    { to: "/cart", label: "Cart", IconActive: IoCart, IconInactive: IoCartOutline, badge: itemCount },
    { to: "/account", label: "Account", IconActive: IoPersonCircle, IconInactive: IoPersonCircleOutline }
  ];
  const checkActive = (item) => {
    const pathMatches = (item.matchPaths ?? [item.to.split("?")[0]]).some(
      (p) => pathname === p || p !== "/" && pathname.startsWith(p)
    );
    if (!pathMatches) return false;
    if (item.matchSearch) {
      for (const [k, v] of Object.entries(item.matchSearch)) {
        if (searchObj[k] !== v) return false;
      }
    }
    if (item.excludeSearch) {
      for (const [k, v] of Object.entries(item.excludeSearch)) {
        if (searchObj[k] === v) return false;
      }
    }
    return true;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "pointer-events-auto mx-auto max-w-md flex items-stretch bg-white rounded-full px-2 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100 backdrop-blur-md bg-white/95", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNavButton, { item, active: checkActive(item) }, item.to)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:flex sticky bottom-4 mx-auto max-w-md mt-10 -translate-y-2 z-50 items-stretch bg-white rounded-full px-2 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] ring-1 ring-zinc-100", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNavButton, { item, active: checkActive(item) }, item.to)) })
  ] });
}
function BottomNavButton({
  item,
  active
}) {
  const Icon = active ? item.IconActive : item.IconInactive;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: item.to,
      className: `relative flex-1 flex flex-col items-center justify-center gap-1 rounded-full text-[10px] font-bold transition px-1 py-1.5 ${active ? "text-[var(--brand-clay)]" : "text-zinc-500 hover:text-zinc-800"}`,
      "aria-current": active ? "page" : void 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-6 w-6 transition-transform ${active ? "scale-110" : ""}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `transition-opacity ${active ? "opacity-100" : "opacity-0 h-0 overflow-hidden sm:h-auto sm:opacity-100"}`, children: item.label }),
        !!item.badge && item.badge > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-0 right-3 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--brand-ink)] px-1 text-[9px] font-bold text-white ring-2 ring-white", children: item.badge > 99 ? "99+" : item.badge })
      ]
    }
  );
}
export {
  CustomerShell as C,
  CustomerLocationHeader as a
};
