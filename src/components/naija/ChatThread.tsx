import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Send } from "lucide-react";

type Props = {
  conversationId: string;
  meId: string;
  otherName?: string | null;
  otherAvatar?: string | null;
  unreadField: "customer_unread" | "vendor_unread";
};

export function ChatThread({ conversationId, meId, otherName, otherAvatar, unreadField }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Realtime subscribe
  useEffect(() => {
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Mark conversation as read for me
  useEffect(() => {
    const patch = unreadField === "customer_unread" ? { customer_unread: 0 } : { vendor_unread: 0 };
    void supabase.from("conversations").update(patch).eq("id", conversationId);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [conversationId, unreadField, messages.length, qc]);

  // Focus composer
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: meId, body });
    setSending(false);
    if (error) {
      setText(body);
      return;
    }
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    inputRef.current?.focus();
  };

  const initial = (otherName ?? "C").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#f5f1ea]">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full grid place-items-center text-center text-muted-foreground text-sm">
            <div>
              <p>Say hello to {otherName ?? "your chef"} 👋</p>
              <p className="mt-1 text-xs">Ask about ingredients, customizations, or delivery times.</p>
            </div>
          </div>
        )}
        {messages.map((m: any) => {
          const mine = m.sender_id === meId;
          const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          if (mine) {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-white shadow-sm bg-gradient-to-br from-fuchsia-500 to-purple-700">
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                  <p className="mt-1 text-[10px] text-white/70 text-right">{time}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex items-end gap-2 justify-start">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-muted shrink-0">
                {otherAvatar ? (
                  <img src={otherAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-xs font-semibold bg-[var(--gradient-warm)] text-white">
                    {initial}
                  </div>
                )}
              </div>
              <div className="max-w-[78%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-[#ece6dc] text-foreground shadow-sm">
                <p className="text-[13px] font-semibold mb-0.5">{otherName ?? "Chef"}</p>
                <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground text-right">{time}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="p-3 bg-[#f5f1ea] border-t border-black/5"
      >
        <div className="flex items-center gap-2 bg-[#ece6dc] rounded-full pl-4 pr-2 py-1.5">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Start a message"
            className="flex-1 resize-none bg-transparent text-[15px] focus:outline-none max-h-32 placeholder:text-muted-foreground"
          />
          <button
            type="button"
            className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:bg-black/5 shrink-0"
            aria-label="Attach"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="h-9 w-9 grid place-items-center rounded-full text-purple-700 disabled:opacity-40 shrink-0"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}