import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { N as CircleCheck, f as ChevronRight, B as Bell, G as Gift, z as MessageCircle, O as Package } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "../_libs/react-icons.mjs";
import "./router-Ck7azls6.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./client-DVFnSlur.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./Logo-Du-Zai3C.mjs";
const DUMMY_NOTIFICATIONS = [{
  id: "1",
  type: "order",
  title: "Order on the way! 🛵",
  message: "Your Jollof Rice from Chef Ada is out for delivery. Track your rider now.",
  time: "2 mins ago",
  isUnread: true,
  actionText: "Track Order"
}, {
  id: "2",
  type: "message",
  title: "New message from Chef Tunde",
  message: "Sure! I can make the Asun extra spicy for your booking this Friday.",
  time: "1 hour ago",
  isUnread: true,
  actionText: "Reply"
}, {
  id: "3",
  type: "promo",
  title: "Weekend Special: 20% Off 🎁",
  message: "Book any backyard grill experience this weekend and get 20% off your total.",
  time: "Yesterday",
  isUnread: false
}, {
  id: "4",
  type: "system",
  title: "Account verified",
  message: "Your phone number has been successfully verified. You're all set!",
  time: "2 days ago",
  isUnread: false
}];
function NotificationsPage() {
  const [notifications, setNotifications] = reactExports.useState(DUMMY_NOTIFICATIONS);
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({
      ...n,
      isUnread: false
    })));
  };
  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? {
      ...n,
      isUnread: false
    } : n));
  };
  const unreadCount = notifications.filter((n) => n.isUnread).length;
  const getIconData = (type) => {
    switch (type) {
      case "order":
        return {
          Icon: Package,
          bg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          ring: "ring-emerald-100"
        };
      case "message":
        return {
          Icon: MessageCircle,
          bg: "bg-gradient-to-br from-blue-400 to-blue-600",
          ring: "ring-blue-100"
        };
      case "promo":
        return {
          Icon: Gift,
          bg: "bg-gradient-to-br from-amber-400 to-orange-500",
          ring: "ring-orange-100"
        };
      case "system":
      default:
        return {
          Icon: Bell,
          bg: "bg-gradient-to-br from-zinc-400 to-zinc-600",
          ring: "ring-zinc-100"
        };
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold truncate text-zinc-900 tracking-tight", children: "Notifications" }) })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-2 pt-6 sm:pt-8 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between px-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-extrabold text-zinc-900 tracking-tight", children: "Updates" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-zinc-500 mt-1", children: [
          "You have ",
          unreadCount,
          " unread message",
          unreadCount !== 1 ? "s" : ""
        ] })
      ] }),
      unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: markAllAsRead, className: "text-sm font-bold text-[var(--brand-clay)] hover:text-orange-700 transition flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[var(--brand-clay)]/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
        "Mark all read"
      ] })
    ] }),
    notifications.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: notifications.map((notif) => {
      const {
        Icon,
        bg,
        ring
      } = getIconData(notif.type);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => markAsRead(notif.id), className: `group relative overflow-hidden rounded-[1.75rem] p-4 sm:p-5 transition-all duration-300 cursor-pointer ${notif.isUnread ? "bg-orange-50/60 ring-1 ring-orange-200/50 shadow-sm hover:bg-orange-50/80" : "bg-white ring-1 ring-zinc-100 hover:ring-zinc-200 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"}`, children: [
        notif.isUnread && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-5 right-5 h-2.5 w-2.5 rounded-full bg-[var(--brand-clay)] ring-4 ring-orange-50 animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 sm:gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ring-4 ${bg} ${ring}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 pt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `font-display text-base tracking-tight truncate ${notif.isUnread ? "font-bold text-zinc-900" : "font-semibold text-zinc-800"}`, children: notif.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-zinc-400 whitespace-nowrap uppercase tracking-wider", children: notif.time })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm leading-relaxed ${notif.isUnread ? "text-zinc-700 font-medium" : "text-zinc-500"}`, children: notif.message }),
            notif.actionText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-clay)] hover:text-orange-700 transition group-hover:underline", children: [
              notif.actionText,
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            ] }) })
          ] })
        ] })
      ] }, notif.id);
    }) }) : (
      /* Empty State */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 flex flex-col items-center justify-center text-center p-8 rounded-[2rem] bg-zinc-50/50 border border-dashed border-zinc-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-8 w-8 text-zinc-300" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold text-zinc-900", children: "All caught up!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-zinc-500 text-sm mt-2 max-w-sm", children: "You don't have any new notifications right now. We'll let you know when there's an update." })
      ] })
    )
  ] }) });
}
export {
  NotificationsPage as component
};
