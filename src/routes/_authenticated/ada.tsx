import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, Trash2, RotateCcw, ArrowUp } from "lucide-react";
import {
  PiForkKnifeDuotone,
  PiCalendarCheckDuotone,
  PiLeafDuotone,
  PiPercentDuotone,
  PiStorefrontDuotone,
  PiWalletDuotone,
} from "react-icons/pi";
import {
  loadThread,
  saveThread,
  clearThread,
  generateReply,
  getRegion,
  newThread,
  type AdaMessage,
} from "@/lib/ada";

export const Route = createFileRoute("/_authenticated/ada")({
  validateSearch: (s: Record<string, unknown>): { intent?: string; q?: string } => ({
    intent: typeof s.intent === "string" ? s.intent : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: AdaChatPage,
});

type ChatMsg = AdaMessage;

const SUGGESTIONS: { Icon: React.ComponentType<{ className?: string }>; label: string; prompt: string }[] = [
  { Icon: PiCalendarCheckDuotone, label: "Plan my week", prompt: "Help me plan meals for the whole week" },
  { Icon: PiLeafDuotone, label: "Vegetarian ideas", prompt: "I'm vegetarian — what dishes work for me?" },
  { Icon: PiPercentDuotone, label: "On a budget", prompt: "I want to eat well on a small budget. Any picks?" },
  { Icon: PiForkKnifeDuotone, label: "What should I eat?", prompt: "Recommend something for lunch today" },
  { Icon: PiStorefrontDuotone, label: "Find a chef", prompt: "Show me the top chefs near me" },
  { Icon: PiWalletDuotone, label: "How does the wallet work?", prompt: "How does the Naija Eats wallet work?" },
];

function AdaChatPage() {
  const navigate = useNavigate();
  const { intent, q } = Route.useSearch();
  const region = useMemo(() => getRegion(), []);

  const [thread, setThread] = useState(() => loadThread());
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const kickedOffRef = useRef(false);

  // Auto-scroll to the newest message whenever the thread grows
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.messages.length, thread.updatedAt]);

  // Persist on every meaningful change
  useEffect(() => {
    saveThread(thread);
  }, [thread]);

  // Handle deep-links from other pages ("Build my week", floating button, etc.)
  useEffect(() => {
    if (kickedOffRef.current) return;
    kickedOffRef.current = true;
    let opening: string | null = null;
    if (intent === "meal-plan") opening = "Help me plan my week based on my dietary preferences.";
    else if (typeof q === "string" && q.length > 0) opening = q;
    if (opening && thread.messages.length === 0) {
      // Fire the message with a slight delay so the UI mounts first
      window.setTimeout(() => send(opening!), 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, q]);

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || streaming) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const adaId = crypto.randomUUID();
    const seed: ChatMsg = {
      id: adaId,
      role: "ada",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setDraft("");
    setStreaming(true);
    setThread((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg, seed],
      updatedAt: new Date().toISOString(),
    }));

    try {
      let acc = "";
      for await (const chunk of generateReply(text, { region })) {
        if (chunk.delta) {
          acc += chunk.delta;
          setThread((prev) => ({
            ...prev,
            messages: prev.messages.map((m) => (m.id === adaId ? { ...m, content: acc } : m)),
            updatedAt: new Date().toISOString(),
          }));
        }
        if (chunk.done && chunk.actions) {
          setThread((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === adaId ? { ...m, actions: chunk.actions } : m,
            ),
            updatedAt: new Date().toISOString(),
          }));
        }
      }
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const reset = () => {
    if (streaming) return;
    if (!confirm("Start a new conversation with Ada? This clears the current chat.")) return;
    const t = clearThread();
    setThread(t);
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card/95 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/discover" })}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted shrink-0 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <AdaAvatar size={38} pulsing={streaming} />
        <div className="flex-1 min-w-0 leading-tight">
          <div className="font-display font-bold text-[15px] truncate flex items-center gap-1.5">
            Ada
            <span className="inline-flex items-center rounded-full bg-[var(--brand-gold)]/20 text-[oklch(0.55_0.14_75)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest">
              AI
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {streaming ? "Typing…" : "Online · " + (region === "NG" ? "Nigeria" : "United Kingdom")}
          </div>
        </div>
        <button
          onClick={reset}
          aria-label="New chat"
          disabled={streaming}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted shrink-0 transition disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (streaming) return;
            if (confirm("Delete this conversation?")) setThread(newThread());
          }}
          aria-label="Delete chat"
          disabled={streaming}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-red-50 hover:text-red-600 shrink-0 transition disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Messages ─── */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {thread.messages.length === 0 ? (
          <EmptyState region={region} onPick={(prompt) => send(prompt)} />
        ) : (
          thread.messages.map((m) => <MessageBubble key={m.id} msg={m} region={region} />)
        )}
      </div>

      {/* ─── Composer ─── */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-3 sm:px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        {/* Quick suggestion chips when the input is empty */}
        {draft === "" && thread.messages.length > 0 && !streaming && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => send(s.prompt)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition"
              >
                <s.Icon className="h-3.5 w-3.5 text-[var(--brand-clay)]" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 rounded-3xl border border-border bg-background pl-4 pr-1.5 py-1.5 shadow-sm focus-within:border-[var(--brand-clay)] focus-within:ring-2 focus-within:ring-[var(--brand-clay)]/15 transition">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              rows={1}
              placeholder="Ask Ada anything…"
              className="flex-1 resize-none bg-transparent text-[15px] focus:outline-none placeholder:text-muted-foreground py-2 max-h-32"
              style={{ minHeight: 24 }}
              disabled={streaming}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || streaming}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all ${
                draft.trim() && !streaming
                  ? "bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-md shadow-[var(--brand-clay)]/30 hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {streaming ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Ada is an assistant — always double-check delivery times and prices with the vendor.
        </div>
      </form>
    </div>
  );
}

/* ─────────── Sub-components ─────────── */

function AdaAvatar({ size = 38, pulsing = false }: { size?: number; pulsing?: boolean }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-[var(--brand-clay)] via-[oklch(0.68_0.22_45)] to-[var(--brand-gold)] shadow-md ${pulsing ? "animate-pulse" : ""}`}
      />
      <div
        className="absolute inset-[3px] rounded-full bg-background grid place-items-center font-display font-extrabold text-[var(--brand-clay)]"
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        A
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
    </div>
  );
}

function MessageBubble({ msg, region }: { msg: ChatMsg; region: ReturnType<typeof getRegion> }) {
  const mine = msg.role === "user";
  const content = renderInlineMarkdown(msg.content);
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && <AdaAvatar size={30} />}
      <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
            mine
              ? "bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white rounded-br-md shadow-[var(--brand-clay)]/25"
              : "bg-card border border-border text-foreground rounded-bl-md"
          }`}
        >
          {msg.role === "ada" && msg.content.length === 0 ? (
            <TypingIndicator />
          ) : (
            <span dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {msg.actions.map((a) => (
              <Link
                key={a.to + a.label}
                to={a.to as any}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] px-3 py-1 text-xs font-bold hover:bg-[var(--brand-clay)]/15 transition"
              >
                <Sparkles className="h-3 w-3" /> {a.label}
              </Link>
            ))}
          </div>
        )}
        <div className={`text-[10px] text-muted-foreground ${mine ? "text-right" : "text-left"} px-1`}>
          {formatTime(msg.createdAt)}
          {msg.role === "ada" && ` · Ada`}
          {msg.role === "user" && ` · You · ${region === "NG" ? "🇳🇬" : "🇬🇧"}`}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "120ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "240ms" }} />
    </span>
  );
}

function EmptyState({
  region,
  onPick,
}: {
  region: ReturnType<typeof getRegion>;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center px-2 py-8">
      <AdaAvatar size={72} />
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-gold)]/20 text-[oklch(0.5_0.14_75)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
        <Sparkles className="h-3 w-3" /> Naija Eats AI
      </div>
      <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight">
        Hey, I'm Ada
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {region === "NG"
          ? "Your food buddy on Naija Eats. Ask me for jollof spots, plan your week, or find something under your budget — I got you."
          : "Your food buddy on Naija Eats. Ask me to plan meals, find a chef, filter by diet, or answer anything about the app."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-3 text-left hover:border-[var(--brand-clay)]/40 hover:bg-muted/40 transition"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
              <s.Icon className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-bold leading-tight">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Extremely small markdown pass — supports bold text (**text**) and bullet
 * lines starting with "• " or "- ". Enough to make Ada's replies feel styled
 * without pulling in a whole parser.
 */
function renderInlineMarkdown(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold">$1</strong>');
}
