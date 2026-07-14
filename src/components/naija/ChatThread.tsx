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
  PiCurrencyNgnDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { loadWallet, addWalletTxn } from "@/lib/wallet";

const PAID_KEY = "naijaeats.paidInvoices.v1";

function loadPaidSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(PAID_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function markPaid(id: string) {
  if (typeof window === "undefined") return;
  const s = loadPaidSet();
  s.add(id);
  localStorage.setItem(PAID_KEY, JSON.stringify(Array.from(s)));
}

function parseInvoice(body: string | null | undefined): { amount: number; note: string } | null {
  if (!body || !body.startsWith("[[INVOICE:") || !body.endsWith("]]")) return null;
  const inner = body.slice(10, -2);
  const firstColon = inner.indexOf(":");
  if (firstColon === -1) return null;
  const amt = parseInt(inner.slice(0, firstColon), 10);
  const note = inner.slice(firstColon + 1);
  if (!Number.isFinite(amt) || amt <= 0) return null;
  return { amount: amt, note };
}

type Props = {
  conversationId: string;
  meId: string;
  otherName?: string | null;
  otherAvatar?: string | null;
  unreadField: "customer_unread" | "vendor_unread";
  isVendor?: boolean;
};

function SwipeableMessage({
  children,
  onSwipe,
  mine
}: {
  children: React.ReactNode;
  onSwipe: () => void;
  mine: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);

  return (
    <div
      className="relative touch-pan-y"
      style={{ transform: `translateX(${offset}px)`, transition: isSwiping.current ? "none" : "transform 0.2s" }}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isSwiping.current = true;
      }}
      onTouchMove={(e) => {
        if (!isSwiping.current) return;
        const dx = e.touches[0].clientX - startX.current;
        const dy = e.touches[0].clientY - startY.current;
        if (Math.abs(dy) > Math.abs(dx)) {
          // It's a vertical scroll, cancel swipe
          setOffset(0);
          isSwiping.current = false;
          return;
        }
        if ((mine && dx < 0) || (!mine && dx > 0)) {
          // Allow swiping left for my messages, right for others
          setOffset(Math.max(-60, Math.min(60, dx)));
        }
      }}
      onTouchEnd={() => {
        isSwiping.current = false;
        if (Math.abs(offset) >= 50) {
          onSwipe();
          if (navigator.vibrate) navigator.vibrate(50);
        }
        setOffset(0);
      }}
      onTouchCancel={() => {
        isSwiping.current = false;
        setOffset(0);
      }}
    >
      {children}
    </div>
  );
}

export function ChatThread({ conversationId, meId, otherName, otherAvatar, unreadField, isVendor }: Props) {
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
  const [invoicePopupOpen, setInvoicePopupOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paidInvoices, setPaidInvoices] = useState<Set<string>>(() => loadPaidSet());
  const [pulseInvoiceId, setPulseInvoiceId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  // Tapping any invoice bubble opens it full-screen over a blurred chat.
  const [viewInvoice, setViewInvoice] = useState<{
    msgId: string;
    amount: number;
    note: string;
    createdAt: string;
    fromMe: boolean;
  } | null>(null);

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
    const reply_to_id = replyingTo?.id || null;
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: meId, body, reply_to_id });
    setSending(false);
    if (error) {
      setText(body);
      toast.error(`Message not sent: ${error.message}`);
      return;
    }
    setReplyingTo(null);
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
      const reply_to_id = replyingTo?.id || null;
      const { error: insErr } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: meId, body, image_url, reply_to_id });
      if (insErr) throw insErr;
      setReplyingTo(null);
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success(kind === "image" ? "Photo sent" : `${kind[0].toUpperCase()}${kind.slice(1)} sent`);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(invoiceAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");
    const note = invoiceNote.trim() || "Custom Invoice";
    
    setSending(true);
    const body = `[[INVOICE:${amt}:${note}]]`;
    const reply_to_id = replyingTo?.id || null;
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: meId, body, reply_to_id });
    setSending(false);
    
    if (error) {
      toast.error("Failed to send invoice");
      return;
    }
    
    setReplyingTo(null);
    
    setInvoicePopupOpen(false);
    setInvoiceAmount("");
    setInvoiceNote("");
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    toast.success("Invoice sent!");
  };

  const handlePayInvoice = async (msgId: string, amount: number) => {
    if (paidInvoices.has(msgId)) return;
    setPayingInvoiceId(msgId);
    try {
      const w = loadWallet();
      if (w.balance < amount) {
        toast.error("Insufficient wallet balance — top up first");
        return;
      }
      // Small perceived delay for the "processing" state
      await new Promise((r) => setTimeout(r, 700));
      addWalletTxn({
        amount: -amount,
        type: "order",
        title: `Paid ${otherName ?? "vendor"}`,
        note: `Invoice INV-${msgId.slice(0, 8)}`,
      });
      markPaid(msgId);
      setPaidInvoices((prev) => new Set(prev).add(msgId));
      // Also send a follow-up "receipt" message so the vendor sees payment confirmation
      void supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: meId,
        body: `✅ Paid ₦${amount.toLocaleString()} · INV-${msgId.slice(0, 8)}`,
      });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      toast.success(`Paid ₦${amount.toLocaleString()} from your wallet`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to process payment");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const jumpToLatestInvoice = () => {
    setAttachOpen(false);
    // Find newest unpaid invoice sent by the other party
    for (let i = messages.length - 1; i >= 0; i--) {
      const m: any = messages[i];
      if (m.sender_id === meId) continue;
      const inv = parseInvoice(m.body);
      if (inv && !paidInvoices.has(m.id)) {
        const el = document.getElementById(`msg-${m.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setPulseInvoiceId(m.id);
        window.setTimeout(() => setPulseInvoiceId(null), 1600);
        return;
      }
    }
    toast.info("No unpaid invoices to pay right now");
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
    else if (which === "invoice") {
      setInvoicePopupOpen(true);
    }
    else if (which === "document") {
      if (docInputRef.current) docInputRef.current.dataset.kind = which;
      docInputRef.current?.click();
    } else if (which === "audio") audioInputRef.current?.click();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[oklch(0.985_0.005_90)] relative">
      {/* Subtle top scrim */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/60 to-transparent z-[1]" />

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 lg:px-[max(1rem,calc((100%-48rem)/2))]">
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
                const mineInvoice = parseInvoice(m.body);
                const isPaidMine = mineInvoice && paidInvoices.has(m.id);
                const repliedMsg = m.reply_to_id ? messages.find((x: any) => x.id === m.reply_to_id) : null;
                return (
                  <SwipeableMessage key={m.id} mine={true} onSwipe={() => setReplyingTo(m)}>
                    <div id={`msg-${m.id}`} className="flex justify-end">
                    <div
                      className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 shadow-[0_2px_10px_-4px_rgba(217,75,58,0.35)] bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white flex flex-col ${
                        same ? "rounded-2xl rounded-br-lg" : "rounded-2xl rounded-br-md"
                      }`}
                    >
                      {repliedMsg && (
                        <div
                          className="mb-2 bg-black/10 rounded-xl p-2 border-l-4 border-white/50 text-sm cursor-pointer hover:bg-black/20 transition text-white/90"
                          onClick={() => {
                            const el = document.getElementById(`msg-${repliedMsg.id}`);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <div className="font-bold text-xs opacity-80 mb-0.5">
                            {repliedMsg.sender_id === meId ? "You" : otherName ?? "Chef"}
                          </div>
                          <div className="line-clamp-2 text-xs opacity-90">
                            {repliedMsg.body ? repliedMsg.body : (repliedMsg.image_url ? "📷 Photo" : "📎 Attachment")}
                          </div>
                        </div>
                      )}
                      {m.image_url && (
                        <img
                          src={m.image_url}
                          alt="Attachment"
                          className="max-w-full rounded-xl mb-1 object-cover border border-white/20"
                        />
                      )}
                      {mineInvoice ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setViewInvoice({ msgId: m.id, amount: mineInvoice.amount, note: mineInvoice.note, createdAt: m.created_at, fromMe: true })
                          }
                          className="bg-white/10 rounded-xl p-3 border border-white/20 min-w-[200px] cursor-pointer transition hover:bg-white/20 active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-90">
                            <span className="inline-flex items-center gap-1.5">
                              <PiReceiptDuotone className="h-4 w-4" /> Invoice sent
                            </span>
                            {isPaidMine && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/30 text-emerald-50 px-1.5 py-0.5">
                                <Check className="h-3 w-3" strokeWidth={3} /> Paid
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-display font-bold tabular-nums">₦{mineInvoice.amount.toLocaleString()}</div>
                          <div className="text-sm opacity-90 mt-1 break-words">{mineInvoice.note}</div>
                          <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">Tap to view</div>
                        </div>
                      ) : m.body ? (
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                      ) : null}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/85">
                        <span className="tabular-nums">{time}</span>
                        <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                  </SwipeableMessage>
                );
              }

              const invoice = parseInvoice(m.body);
              const isPaid = invoice ? paidInvoices.has(m.id) : false;
              const isPaying = payingInvoiceId === m.id;
              const shouldPulse = pulseInvoiceId === m.id;
              const repliedMsg = m.reply_to_id ? messages.find((x: any) => x.id === m.reply_to_id) : null;
              return (
                <SwipeableMessage key={m.id} mine={false} onSwipe={() => setReplyingTo(m)}>
                  <div id={`msg-${m.id}`} className="flex items-end gap-2 justify-start">
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
                    className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 shadow-[0_2px_10px_-4px_rgba(132,204,22,0.35)] bg-[var(--brand-forest)] text-[var(--brand-ink)] transition-all duration-500 flex flex-col ${
                      same ? "rounded-2xl rounded-bl-lg" : "rounded-2xl rounded-bl-md"
                    } ${shouldPulse ? "ring-4 ring-[var(--brand-clay)]/50 scale-[1.03]" : ""}`}
                  >
                    {!same && (
                      <p className="text-[12px] font-extrabold mb-1 opacity-80">{otherName ?? "Chef"}</p>
                    )}
                    {repliedMsg && (
                      <div
                        className="mb-2 bg-black/10 rounded-xl p-2 border-l-4 border-[var(--brand-clay)]/60 text-sm cursor-pointer hover:bg-black/20 transition text-[var(--brand-ink)]/90"
                        onClick={() => {
                          const el = document.getElementById(`msg-${repliedMsg.id}`);
                          el?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      >
                        <div className="font-bold text-xs opacity-80 mb-0.5">
                          {repliedMsg.sender_id === meId ? "You" : otherName ?? "Chef"}
                        </div>
                        <div className="line-clamp-2 text-xs opacity-90">
                          {repliedMsg.body ? repliedMsg.body : (repliedMsg.image_url ? "📷 Photo" : "📎 Attachment")}
                        </div>
                      </div>
                    )}
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="Attachment"
                        className="max-w-full rounded-xl mb-1 object-cover border border-black/5"
                      />
                    )}
                    {invoice ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setViewInvoice({ msgId: m.id, amount: invoice.amount, note: invoice.note, createdAt: m.created_at, fromMe: false })
                        }
                        className="bg-white/95 text-foreground rounded-2xl p-3.5 shadow-inner min-w-[220px] cursor-pointer transition hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700">
                            <PiReceiptDuotone className="h-4 w-4" /> Invoice
                          </span>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5">
                              <Check className="h-3 w-3" strokeWidth={3} /> Paid
                            </span>
                          ) : (
                            <span className="text-muted-foreground normal-case tracking-normal font-semibold">Tap to view</span>
                          )}
                        </div>
                        <div className="font-display text-2xl font-extrabold tabular-nums leading-none">
                          ₦{invoice.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5 break-words">{invoice.note}</div>
                        {!isVendor && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayInvoice(m.id, invoice.amount);
                            }}
                            disabled={isPaying || isPaid}
                            className={`mt-3 w-full rounded-xl font-bold py-2.5 text-sm shadow-sm inline-flex items-center justify-center gap-1.5 transition ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-700 cursor-default"
                                : isPaying
                                  ? "bg-zinc-200 text-zinc-500"
                                  : "bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white hover:scale-[1.02] active:scale-95 shadow-[var(--brand-clay)]/30"
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <Check className="h-4 w-4" strokeWidth={3} /> Paid from wallet
                              </>
                            ) : isPaying ? (
                              <>
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                                Processing…
                              </>
                            ) : (
                              <>
                                <PiCurrencyNgnDuotone className="h-4 w-4" /> Pay ₦{invoice.amount.toLocaleString()}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ) : m.body ? (
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                      <span className="tabular-nums">{time}</span>
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                </SwipeableMessage>
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
        className="relative p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/70 backdrop-blur border-t border-black/5 lg:px-[max(1rem,calc((100%-48rem)/2))]"
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
              {isVendor ? (
                <AttachTile
                  Icon={PiReceiptDuotone}
                  label="Invoice"
                  tone="bg-[oklch(0.95_0.04_145)] text-emerald-700"
                  onClick={() => openAttach("invoice")}
                />
              ) : (
                <AttachTile
                  Icon={PiCurrencyNgnDuotone}
                  label="Pay"
                  tone="bg-[oklch(0.95_0.04_145)] text-emerald-700"
                  onClick={jumpToLatestInvoice}
                />
              )}
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
        
        {invoicePopupOpen && (
          <div className="absolute bottom-full left-3 right-3 sm:right-auto sm:w-[320px] mb-3 rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] border border-border p-4 animate-in slide-in-from-bottom-2 fade-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[12px] uppercase tracking-widest font-bold text-emerald-700 flex items-center gap-1.5">
                <PiReceiptDuotone className="h-4 w-4" /> Create Invoice
              </div>
              <button
                type="button"
                onClick={() => setInvoicePopupOpen(false)}
                className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted transition text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount (₦)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full h-11 rounded-xl border border-black/10 px-3 text-sm focus:border-[var(--brand-clay)] focus:ring-1 focus:ring-[var(--brand-clay)] transition"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  placeholder="e.g. Party Jollof (2 portions)"
                  className="w-full h-11 rounded-xl border border-black/10 px-3 text-sm focus:border-[var(--brand-clay)] focus:ring-1 focus:ring-[var(--brand-clay)] transition"
                />
              </div>
              <button
                type="button"
                onClick={sendInvoice}
                disabled={sending || !invoiceAmount}
                className="w-full h-11 rounded-xl bg-emerald-600 text-white font-bold shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition mt-2 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Invoice"}
              </button>
            </div>
          </div>
        )}
        {replyingTo && (
          <div className="flex items-center justify-between bg-white rounded-t-2xl px-4 py-2 border-l-4 border-[var(--brand-clay)] mb-2 shadow-sm relative">
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-xs font-bold text-[var(--brand-clay)] mb-0.5">
                Replying to {replyingTo.sender_id === meId ? "yourself" : otherName ?? "Chef"}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {replyingTo.body ? replyingTo.body : (replyingTo.image_url ? "📷 Photo" : "📎 Attachment")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="h-7 w-7 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 transition shrink-0"
            >
              <X className="h-4 w-4 text-zinc-500" />
            </button>
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

      {viewInvoice && (
        <InvoiceModal
          invoice={viewInvoice}
          otherName={otherName ?? "Vendor"}
          isVendor={Boolean(isVendor)}
          paid={paidInvoices.has(viewInvoice.msgId)}
          paying={payingInvoiceId === viewInvoice.msgId}
          onPay={() => handlePayInvoice(viewInvoice.msgId, viewInvoice.amount)}
          onClose={() => setViewInvoice(null)}
        />
      )}
    </div>
  );
}

/**
 * Full-screen invoice view. The blurred backdrop keeps the chat visible but
 * out of focus so the receipt owns the moment.
 */
function InvoiceModal({
  invoice,
  otherName,
  isVendor,
  paid,
  paying,
  onPay,
  onClose,
}: {
  invoice: { msgId: string; amount: number; note: string; createdAt: string; fromMe: boolean };
  otherName: string;
  isVendor: boolean;
  paid: boolean;
  paying: boolean;
  onPay: () => void;
  onClose: () => void;
}) {
  const issued = new Date(invoice.createdAt);
  const from = invoice.fromMe ? (isVendor ? "You" : "You") : otherName;
  const to = invoice.fromMe ? otherName : "You";
  const canPay = !isVendor && !invoice.fromMe && !paid;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-5 bg-black/35 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        {/* Header band */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pb-5 pt-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100">
            <PiReceiptDuotone className="h-5 w-5" /> Invoice
          </div>
          <div className="mt-2 font-mono text-sm text-emerald-100">
            INV-{invoice.msgId.slice(0, 8).toUpperCase()}
          </div>
          <div className="mt-3 font-display text-4xl font-extrabold tabular-nums leading-none">
            ₦{invoice.amount.toLocaleString()}
          </div>
          <div className="mt-3">
            {paid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-amber-950">
                Awaiting payment
              </span>
            )}
          </div>
        </div>

        {/* Receipt body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From</div>
              <div className="mt-0.5 font-semibold truncate">{from}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Billed to</div>
              <div className="mt-0.5 font-semibold truncate">{to}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued</div>
              <div className="mt-0.5 font-semibold">
                {issued.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                {issued.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-zinc-200" />

          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <div className="font-semibold break-words">{invoice.note}</div>
              <div className="text-xs text-muted-foreground mt-0.5">1 item</div>
            </div>
            <div className="shrink-0 font-semibold tabular-nums">₦{invoice.amount.toLocaleString()}</div>
          </div>

          <div className="my-4 border-t border-dashed border-zinc-200" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-extrabold tabular-nums">
              ₦{invoice.amount.toLocaleString()}
            </span>
          </div>

          {canPay && (
            <button
              type="button"
              onClick={onPay}
              disabled={paying}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--brand-clay)]/30 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            >
              {paying ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <PiCurrencyNgnDuotone className="h-4 w-4" /> Pay ₦{invoice.amount.toLocaleString()} from wallet
                </>
              )}
            </button>
          )}
          {paid && (
            <div className="mt-5 rounded-2xl bg-emerald-50 py-3 text-center text-sm font-bold text-emerald-700">
              Settled from wallet — you're all set
            </div>
          )}
        </div>
      </div>
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
