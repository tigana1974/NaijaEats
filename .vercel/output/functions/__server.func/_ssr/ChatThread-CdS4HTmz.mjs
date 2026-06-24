import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DVFnSlur.mjs";
import { as as Paperclip, g as Send } from "../_libs/lucide-react.mjs";
function ChatThread({ conversationId, meId, otherName, otherAvatar, unreadField }) {
  const qc = useQueryClient();
  const [text, setText] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const scrollerRef = reactExports.useRef(null);
  const inputRef = reactExports.useRef(null);
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
      return data ?? [];
    }
  });
  reactExports.useEffect(() => {
    const ch = supabase.channel(`messages:${conversationId}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      () => qc.invalidateQueries({ queryKey: ["messages", conversationId] })
    ).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);
  reactExports.useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  reactExports.useEffect(() => {
    const patch = unreadField === "customer_unread" ? { customer_unread: 0 } : { vendor_unread: 0 };
    void supabase.from("conversations").update(patch).eq("id", conversationId);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [conversationId, unreadField, messages.length, qc]);
  reactExports.useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);
  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: meId, body });
    setSending(false);
    if (error) {
      setText(body);
      return;
    }
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    inputRef.current?.focus();
  };
  const initial = (otherName ?? "C").charAt(0).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col flex-1 min-h-0 bg-[#f5f1ea]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollerRef, className: "flex-1 overflow-y-auto px-3 py-4 space-y-3", children: [
      messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full grid place-items-center text-center text-muted-foreground text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "Say hello to ",
          otherName ?? "your chef",
          " 👋"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs", children: "Ask about ingredients, customizations, or delivery times." })
      ] }) }),
      messages.map((m) => {
        const mine = m.sender_id === meId;
        const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (mine) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-white shadow-sm bg-gradient-to-br from-fuchsia-500 to-purple-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap break-words text-[15px] leading-snug", children: m.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-white/70 text-right", children: time })
          ] }) }, m.id);
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2 justify-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full overflow-hidden bg-muted shrink-0", children: otherAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: otherAvatar, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full grid place-items-center text-xs font-semibold bg-[var(--gradient-warm)] text-white", children: initial }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[78%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-[#ece6dc] text-foreground shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold mb-0.5", children: otherName ?? "Chef" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap break-words text-[15px] leading-snug", children: m.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground text-right", children: time })
          ] })
        ] }, m.id);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "form",
      {
        onSubmit: (e) => {
          e.preventDefault();
          void send();
        },
        className: "p-3 bg-[#f5f1ea] border-t border-black/5",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-[#ece6dc] rounded-full pl-4 pr-2 py-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              ref: inputRef,
              value: text,
              onChange: (e) => setText(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              },
              rows: 1,
              placeholder: "Start a message",
              className: "flex-1 resize-none bg-transparent text-[15px] focus:outline-none max-h-32 placeholder:text-muted-foreground"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:bg-black/5 shrink-0",
              "aria-label": "Attach",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "h-5 w-5" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              disabled: !text.trim() || sending,
              className: "h-9 w-9 grid place-items-center rounded-full text-purple-700 disabled:opacity-40 shrink-0",
              "aria-label": "Send",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-5 w-5" })
            }
          )
        ] })
      }
    )
  ] });
}
export {
  ChatThread as C
};
