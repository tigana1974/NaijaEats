import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { A as AppShell } from "./AppShell-9a5PrCGV.mjs";
import { C as ChatThread } from "./ChatThread-CdS4HTmz.mjs";
import { u as useMyRole } from "./useMyRole-CK88GRqg.mjs";
import { l as Route } from "./router-Ck7azls6.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { s as ArrowLeft } from "../_libs/lucide-react.mjs";
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
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
function VendorConversation() {
  const {
    conversationId
  } = Route.useParams();
  const {
    data: role,
    isLoading: roleLoading
  } = useMyRole();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["vendor-conversation", conversationId],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const {
        data: convo
      } = await supabase.from("conversations").select("*, customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url)").eq("id", conversationId).maybeSingle();
      if (!convo) return null;
      return {
        me: uid,
        conversation: convo
      };
    }
  });
  const cust = data?.conversation?.customer;
  const name = cust?.full_name || "Customer";
  if (!roleLoading && role !== "vendor") return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/vendor/messages", className: "h-9 w-9 grid place-items-center rounded-full ring-1 ring-border hover:bg-muted", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0 grid place-items-center text-sm font-semibold", children: cust?.avatar_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: cust.avatar_url, alt: name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: name.charAt(0).toUpperCase() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-lg sm:text-xl font-semibold truncate", children: name })
      ] })
    ] }),
    isLoading || !data?.conversation ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground", children: isLoading ? "Opening chat…" : "Conversation not found." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChatThread, { conversationId: data.conversation.id, meId: data.me, otherName: name, unreadField: "vendor_unread" })
  ] }) });
}
export {
  VendorConversation as component
};
