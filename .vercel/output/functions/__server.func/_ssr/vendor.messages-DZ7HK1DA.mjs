import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
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
import "./router-Ck7azls6.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "./avatar-DhUB8IKM.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./Logo-Du-Zai3C.mjs";
function VendorInbox() {
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["conversations", "vendor"],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];
      const {
        data: vendor
      } = await supabase.from("vendors").select("id, name").eq("owner_id", uid).maybeSingle();
      if (!vendor) return [];
      const {
        data: convos
      } = await supabase.from("conversations").select("*, customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url)").eq("vendor_id", vendor.id).order("last_message_at", {
        ascending: false,
        nullsFirst: false
      });
      return convos ?? [];
    }
  });
  reactExports.useEffect(() => {
    const ch = supabase.channel("conversations-vendor").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "conversations"
    }, () => refetch()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold", children: "Inbox" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Reply to customers chatting with your shop." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-2", children: [
      (!data || data.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-8 w-8 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 font-medium", children: "No customer messages yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Customers can reach you from your shop page." })
      ] }),
      data?.map((c) => {
        const cust = c.customer;
        const name = cust?.full_name || "Customer";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/vendor/messages/$conversationId", params: {
          conversationId: c.id
        }, className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-[var(--shadow-soft)] transition", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0 grid place-items-center text-sm font-semibold", children: cust?.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: cust.avatar_url, alt: name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: name.charAt(0).toUpperCase() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold truncate", children: name }),
              c.last_message_at && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground shrink-0", children: new Date(c.last_message_at).toLocaleDateString([], {
                month: "short",
                day: "numeric"
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground truncate", children: c.last_message ?? "Say hello" }),
              c.vendor_unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] text-[11px] font-semibold", children: c.vendor_unread })
            ] })
          ] })
        ] }, c.id);
      })
    ] })
  ] }) });
}
export {
  VendorInbox as component
};
