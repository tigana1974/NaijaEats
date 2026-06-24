import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { z as MessageCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/react-icons.mjs";
import "./router-Ck7azls6.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./Logo-Du-Zai3C.mjs";
function ChatsList() {
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["conversations", "customer"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];
      const {
        data: data2
      } = await supabase.from("conversations").select("*, vendor:vendors(id, name, slug, logo_url, cover_image_url)").eq("customer_id", uid).order("last_message_at", {
        ascending: false,
        nullsFirst: false
      });
      return data2 ?? [];
    }
  });
  reactExports.useEffect(() => {
    const ch = supabase.channel("conversations-customer").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "conversations"
    }, () => refetch()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: "Messages" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Chat directly with your chefs." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-2", children: [
      (!data || data.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-8 w-8 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 font-medium", children: "No conversations yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Tap “Message chef” from any restaurant or home chef to start a chat." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/discover", className: "inline-block mt-4 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-5 py-2 text-sm font-semibold", children: "Discover chefs" })
      ] }),
      data?.map((c) => {
        const v = c.vendor;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/chats/$vendorId", params: {
          vendorId: v?.id ?? ""
        }, className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-[var(--shadow-soft)] transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0", children: v?.logo_url || v?.cover_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: v.logo_url ?? v.cover_image_url, alt: v.name, className: "h-full w-full object-cover" }) : null }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold truncate", children: v?.name ?? "Chef" }),
              c.last_message_at && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground shrink-0", children: new Date(c.last_message_at).toLocaleDateString([], {
                month: "short",
                day: "numeric"
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground truncate", children: c.last_message ?? "Start the conversation" }),
              c.customer_unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] text-[11px] font-semibold", children: c.customer_unread })
            ] })
          ] })
        ] }, c.id);
      })
    ] })
  ] }) });
}
export {
  ChatsList as component
};
