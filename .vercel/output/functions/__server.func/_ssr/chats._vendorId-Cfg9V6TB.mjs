import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { C as CustomerShell } from "./CustomerShell-DwqKtSA4.mjs";
import { C as ChatThread } from "./ChatThread-CdS4HTmz.mjs";
import { j as Route$9 } from "./router-Ck7azls6.mjs";
import "../_libs/sonner.mjs";
import "../_libs/stripe.mjs";
import { s as ArrowLeft, aq as Info, ar as Ellipsis } from "../_libs/lucide-react.mjs";
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
import "./Logo-Du-Zai3C.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
function ChatPage() {
  const {
    vendorId
  } = Route$9.useParams();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["conversation", "with-vendor", vendorId],
    queryFn: async () => {
      const {
        data: u
      } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const {
        data: vendor
      } = await supabase.from("vendors").select("id, name, logo_url, cover_image_url, slug").eq("id", vendorId).maybeSingle();
      if (!vendor) return null;
      const {
        data: existing
      } = await supabase.from("conversations").select("*").eq("customer_id", uid).eq("vendor_id", vendorId).maybeSingle();
      let convo = existing;
      if (!convo) {
        const {
          data: created
        } = await supabase.from("conversations").insert({
          customer_id: uid,
          vendor_id: vendorId
        }).select("*").single();
        convo = created;
      }
      return {
        me: uid,
        vendor,
        conversation: convo
      };
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerShell, { hideBottomNav: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-20 flex flex-col bg-[#f5f1ea]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-10 px-3 py-2.5 bg-[#f5f1ea] border-b border-black/5 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/chats", className: "h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 shrink-0", "aria-label": "Back", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0", children: data?.vendor && (data.vendor.logo_url || data.vendor.cover_image_url) ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: data.vendor.logo_url ?? data.vendor.cover_image_url ?? "", alt: data.vendor.name ?? "Chef", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full bg-[var(--gradient-warm)]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-semibold text-[15px] truncate leading-tight text-foreground", children: data?.vendor?.name ?? "Chef" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground leading-tight", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-muted-foreground/50" }),
          "Offline"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "h-9 w-9 grid place-items-center rounded-full hover:bg-black/5", "aria-label": "Info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "h-9 w-9 grid place-items-center rounded-full hover:bg-black/5", "aria-label": "More", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-5 w-5" }) })
    ] }),
    isLoading || !data?.conversation ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 grid place-items-center text-muted-foreground text-sm", children: isLoading ? "Opening chat…" : "Chef not found." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChatThread, { conversationId: data.conversation.id, meId: data.me, otherName: data.vendor.name, otherAvatar: data.vendor.logo_url ?? data.vendor.cover_image_url ?? null, unreadField: "customer_unread" })
  ] }) });
}
export {
  ChatPage as component
};
