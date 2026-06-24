import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { f as IoFlame } from "../_libs/react-icons.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { Z as Coffee, U as Utensils, o as Moon, A as ArrowRight, a2 as Calendar } from "../_libs/lucide-react.mjs";
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
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = [{
  id: "breakfast",
  label: "Breakfast",
  Icon: Coffee,
  time: "07:00 AM"
}, {
  id: "lunch",
  label: "Lunch",
  Icon: Utensils,
  time: "01:00 PM"
}, {
  id: "dinner",
  label: "Dinner",
  Icon: Moon,
  time: "07:00 PM"
}];
function MealPlannerPage() {
  const todayIndex = (/* @__PURE__ */ new Date()).getDay() - 1;
  const currentDayIndex = todayIndex < 0 ? 6 : todayIndex;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { topBar: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--brand-clay)] font-extrabold", children: "Weekly Planner" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold truncate text-zinc-900", children: "Plan your meals" })
    ] })
  ] }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl pt-6 px-2 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-extrabold text-zinc-900 tracking-tight", children: "Your Weekly Menu" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-zinc-500 text-sm leading-relaxed max-w-md mx-auto", children: "Select a meal slot to find chef-prepared food for breakfast, lunch, and dinner." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6 mt-6", children: DAYS.map((day, idx) => {
      const isToday = idx === currentDayIndex;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute -inset-0.5 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500 ${isToday ? "bg-gradient-to-r from-[var(--brand-clay)] to-[#ff6b35] opacity-30" : "bg-zinc-200"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative bg-white rounded-[1.75rem] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 ${isToday ? "ring-[var(--brand-clay)]/30" : "ring-black/[0.04]"} p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-12 w-12 items-center justify-center rounded-2xl font-display font-extrabold text-xl shadow-inner ${isToday ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : "bg-zinc-100 text-zinc-600"}`, children: day.substring(0, 3) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2", children: [
              day,
              isToday && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(IoFlame, { className: "h-3 w-3 text-amber-500" }),
                " Today"
              ] })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: MEALS.map((meal) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/search", className: "flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-[var(--brand-clay)]/30 hover:shadow-md transition-all duration-300 group/meal", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm text-zinc-500 group-hover/meal:text-[var(--brand-clay)] group-hover/meal:scale-110 transition-all duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(meal.Icon, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm text-zinc-900 group-hover/meal:text-[var(--brand-clay)] transition-colors", children: meal.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-zinc-500 font-semibold", children: meal.time })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover/meal:bg-[var(--brand-clay)] group-hover/meal:text-white transition-all duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" }) })
          ] }, meal.id)) })
        ] })
      ] }, day);
    }) })
  ] }) });
}
export {
  MealPlannerPage as component
};
