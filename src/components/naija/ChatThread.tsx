import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, X, Check, CheckCheck, Smile } from "lucide-react";
import {
  PiPlusDuotone,
  PiImagesDuotone,
  PiReceiptDuotone,
  PiFileDuotone,
  PiMicrophoneDuotone,
  PiCameraDuotone,
} from "react-icons/pi";
import { toast } from "sonner";

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
  const attachRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

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

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const patch = unreadField === "customer_unread" ? { customer_unread: 0 } : { vendor_unread: 0 };
    void supabase.from("conversations").update(patch).eq("id", conversationId);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }, [conversationId, unreadField, messages.length, qc]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  // Close attach popover on outside click
  useEffect(() => {
    if (!attachOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!attachRef.current?.contains(e.target as Node)) setAttachOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [attachOpen]);

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
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const uploadFile = async (
    file: File,
    kind: "image" | "document" | "audio" | "invoice",
  ) => {
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() ?? "bin";
      const filename = `${meId}-${Date.now()}.${ext}`;
      const bucket = "chat-images";
      const { error: upErr } = await supabase.storage.from(bucket).upload(filename, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
      const body =
        kind === "image"
          ? ""
          : `📎 ${kind === "invoice" ? "Invoice" : kind === "audio" ? "Audio message" : "File"}: ${file.name}`;
      const image_url = kind === "image" ? urlData.publicUrl : null;
      const { error: insErr } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: meId, body, image_url });
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success(kind === "image" ? "Photo sent" : `${kind[0].toUpperCase()}${kind.slice(1)} sent`);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initial = (otherName ?? "C").charAt(0).toUpperCase();

  // Group messages by date for headers
  const grouped = useMemo(() => {
    const buckets: { label: string; items: any[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    for (const m of messages) {
      const d = new Date(m.created_at);
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      const label =
        day.getTime() === today.getTime()
          ? "Today"
          : day.getTime() === yesterday.getTime()
            ? "Yesterday"
            : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      const last = buckets[buckets.length - 1];
      if (last && last.label === label) last.items.push(m);
      else buckets.push({ label, items: [m] });
    }
    return buckets;
  }, [messages]);

  const openAttach = (which: "photo" | "camera" | "invoice" | "document" | "audio") => {
    setAttachOpen(false);
    if (which === "photo") imgInputRef.current?.click();
    else if (which === "camera") cameraInputRef.current?.click();
    else if (which === "document" || which === "invoice") {
      // set a data attribute to distinguish invoice vs document during handler
      if (docInputRef.current) docInputRef.current.dataset.kind = which;
      docInputRef.current?.click();
    } else if (which === "audio") audioInputRef.current?.click();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[oklch(0.985_0.005_90)] relative">
      {/* Subtle top scrim */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/60 to-transparent z-[1]" />

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full grid place-items-center text-center text-muted-foreground text-sm">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] mb-3">
                <Smile className="h-7 w-7" />
              </div>
              <p className="font-semibold text-foreground">Say hello to {otherName ?? "your chef"} 👋</p>
              <p className="mt-1 text-xs">Ask about ingredients, customizations, or delivery times.</p>
            </div>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="flex justify-center">
              <span className="inline-flex items-center rounded-full bg-white/70 backdrop-blur border border-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                {group.label}
              </span>
            </div>
            {group.items.map((m: any, idx: number) => {
              const mine = m.sender_id === meId;
              const prev = idx > 0 ? group.items[idx - 1] : null;
              const same = prev && prev.sender_id === m.sender_id;
              const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              if (mine) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 shadow-[0_2px_10px_-4px_rgba(217,75,58,0.35)] bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white ${
                        same ? "rounded-2xl rounded-br-lg" : "rounded-2xl rounded-br-md"
                      }`}
                    >
                      {m.image_url && (
                        <img
                          src={m.image_url}
                          alt="Attachment"
                          className="max-w-full rounded-xl mb-1 object-cover border border-white/20"
                        />
                      )}
                      {m.body && (
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/85">
                        <span className="tabular-nums">{time}</span>
                        <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex items-end gap-2 justify-start">
                  <div className={`h-8 w-8 rounded-full overflow-hidden bg-muted shrink-0 ${same ? "opacity-0" : ""}`}>
                    {otherAvatar ? (
                      <img src={otherAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs font-semibold bg-[var(--brand-forest)] text-[var(--brand-ink)]">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 shadow-[0_2px_10px_-4px_rgba(132,204,22,0.35)] bg-[var(--brand-forest)] text-[var(--brand-ink)] ${
                      same ? "rounded-2xl rounded-bl-lg" : "rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {!same && (
                      <p className="text-[12px] font-extrabold mb-1 opacity-80">{otherName ?? "Chef"}</p>
                    )}
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="Attachment"
                        className="max-w-full rounded-xl mb-1 object-cover border border-black/5"
                      />
                    )}
                    {m.body && (
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                    )}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                      <span className="tabular-nums">{time}</span>
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="relative p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/70 backdrop-blur border-t border-black/5"
      >
        {/* Attach popover */}
        {attachOpen && (
          <div
            ref={attachRef}
            className="absolute bottom-full left-3 right-3 sm:right-auto sm:w-[320px] mb-3 rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] border border-border p-2 animate-in slide-in-from-bottom-2 fade-in duration-150"
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                Attach
              </div>
              <button
                type="button"
                onClick={() => setAttachOpen(false)}
                aria-label="Close"
                className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1">
              <AttachTile
                Icon={PiImagesDuotone}
                label="Photos / Videos"
                tone="bg-[oklch(0.95_0.06_320)] text-purple-700"
                onClick={() => openAttach("photo")}
              />
              <AttachTile
                Icon={PiReceiptDuotone}
                label="Invoice"
                tone="bg-[oklch(0.95_0.04_145)] text-emerald-700"
                onClick={() => openAttach("invoice")}
              />
              <AttachTile
                Icon={PiFileDuotone}
                label="Document"
                tone="bg-[oklch(0.94_0.05_250)] text-blue-700"
                onClick={() => openAttach("document")}
              />
              <AttachTile
                Icon={PiMicrophoneDuotone}
                label="Audio"
                tone="bg-[oklch(0.96_0.05_60)] text-orange-700"
                onClick={() => openAttach("audio")}
              />
              <AttachTile
                Icon={PiCameraDuotone}
                label="Camera"
                tone="bg-[oklch(0.96_0.04_20)] text-[var(--brand-clay)]"
                onClick={() => openAttach("camera")}
              />
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach trigger */}
          <button
            type="button"
            onClick={() => setAttachOpen((v) => !v)}
            disabled={uploading}
            aria-label="Attach"
            className={`h-11 w-11 shrink-0 grid place-items-center rounded-full transition ${
              attachOpen
                ? "bg-[var(--brand-clay)] text-white rotate-45"
                : "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] hover:bg-[var(--brand-clay)]/15"
            } duration-200`}
          >
            <PiPlusDuotone className="h-6 w-6" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-white border border-black/5 rounded-3xl pl-4 pr-1.5 py-1.5 shadow-sm">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Message…"
              className="flex-1 resize-none bg-transparent text-[15px] focus:outline-none max-h-32 placeholder:text-muted-foreground py-2"
              style={{ minHeight: "24px" }}
            />
            <button
              type="submit"
              disabled={(!text.trim() && !uploading) || sending || uploading}
              className={`h-10 w-10 grid place-items-center rounded-full shrink-0 transition-all ${
                text.trim() && !sending
                  ? "bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-md shadow-[var(--brand-clay)]/30 hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground"
              }`}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hidden inputs for each file type */}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          ref={imgInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f, "image");
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f, "image");
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          ref={docInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            const kind = (e.currentTarget.dataset.kind === "invoice" ? "invoice" : "document") as "invoice" | "document";
            if (f) uploadFile(f, kind);
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          type="file"
          accept="audio/*"
          ref={audioInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f, "audio");
            e.target.value = "";
          }}
          className="hidden"
        />
      </form>
    </div>
  );
}

function AttachTile({
  Icon,
  label,
  tone,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl py-2.5 hover:bg-muted/60 transition-colors group"
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-2xl ${tone} shadow-sm group-hover:scale-105 transition-transform`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] font-bold text-center leading-tight px-0.5">{label}</span>
    </button>
  );
}
