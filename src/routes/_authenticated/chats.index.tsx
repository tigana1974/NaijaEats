import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { ArrowLeft, Search, X, Plus } from "lucide-react";
import {
  PiChatCircleDotsDuotone,
  PiMicrophoneDuotone,
  PiReceiptDuotone,
  PiImageDuotone,
  PiPaperclipDuotone,
  PiChefHatDuotone,
  PiStorefrontDuotone,
  PiBasketDuotone,
} from "react-icons/pi";
import { messagePreview, type PreviewIcon } from "@/lib/chatPreview";

export const Route = createFileRoute("/_authenticated/chats/")({
  component: ChatsList,
});

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  const week = new Date(now);
  week.setDate(now.getDate() - 7);
  if (d > week) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatsList() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  const { data, refetch } = useQuery({
    queryKey: ["conversations", "customer"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];
      const { data } = await supabase
        .from("conversations")
        .select("*, vendor:vendors(id, name, slug, logo_url, cover_image_url, type)")
        .eq("customer_id", uid)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("conversations-customer")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);

  const list = data ?? [];
  const totalUnread = list.reduce((n, c: any) => n + (c.customer_unread ?? 0), 0);

  const filtered = useMemo(() => {
    let out = list as any[];
    if (tab === "unread") out = out.filter((c) => (c.customer_unread ?? 0) > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((c) => {
        const v = c.vendor;
        return (
          (v?.name ?? "").toLowerCase().includes(q) ||
          (c.last_message ?? "").toLowerCase().includes(q)
        );
      });
    }
    return out;
  }, [list, tab, query]);

  return (
    <CustomerShell hideBottomNav>
      <div className="mx-auto w-full max-w-2xl px-0 sm:px-4 pb-24">
        {/* Sticky X-style header: back, title, tabs. Kept compact, no gradient hero. */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/85 border-b border-border/70">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
            <Link
              to="/account"
              aria-label="Back"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-extrabold tracking-tight">Messages</h1>
            {totalUnread > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full bg-[var(--brand-clay)] text-white px-2 py-0.5 text-[11px] font-bold">
                {totalUnread}
              </span>
            )}
          </div>

          <nav className="flex text-sm font-semibold">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex-1 h-11 capitalize transition ${
                  tab === t ? "text-foreground" : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t}
                  {t === "unread" && totalUnread > 0 && (
                    <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] px-1.5 py-0.5 text-[10px]">
                      {totalUnread}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute inset-x-1/2 -translate-x-1/2 bottom-0 h-[3px] w-12 rounded-full transition-all ${
                    tab === t ? "bg-[var(--brand-clay)]" : "bg-transparent"
                  }`}
                />
              </button>
            ))}
          </nav>
        </header>

        {/* Search bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Messages"
              className="w-full h-11 rounded-full bg-muted/70 pl-10 pr-9 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[var(--brand-clay)]/25 border border-transparent focus:border-border transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full bg-black/5 hover:bg-black/10"
                aria-label="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="mt-2">
          {filtered.length === 0 ? (
            <EmptyState hasQuery={!!query || tab === "unread"} />
          ) : (
            <ul className="divide-y divide-border/70">
              {filtered.map((c: any) => (
                <ChatRow key={c.id} convo={c} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Floating "new chat" FAB (X-style compose button) */}
      <Link
        to="/discover"
        aria-label="Find a chef to chat with"
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-30 grid h-14 w-14 place-items-center rounded-full bg-[var(--brand-clay)] text-white shadow-xl shadow-[var(--brand-clay)]/35 hover:scale-105 transition"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Link>
    </CustomerShell>
  );
}

function ChatRow({ convo }: { convo: any }) {
  const v = convo.vendor;
  const unread = convo.customer_unread ?? 0;
  const initial = (v?.name ?? "C").charAt(0).toUpperCase();
  const preview = messagePreview(convo.last_message, false);
  const kindLabel = v?.type === "grocery" ? "Grocery" : v?.type === "chef" ? "Chef" : "Restaurant";
  const KindIcon = v?.type === "grocery" ? PiBasketDuotone : v?.type === "chef" ? PiChefHatDuotone : PiStorefrontDuotone;

  return (
    <li>
      <Link
        to="/chats/$vendorId"
        params={{ vendorId: v?.id ?? "" }}
        className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="relative shrink-0">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-muted ring-1 ring-black/[0.06]">
            {v?.logo_url || v?.cover_image_url ? (
              <img src={v.logo_url ?? v.cover_image_url} alt={v.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-[var(--gradient-warm)] text-white font-display font-bold text-lg">
                {initial}
              </div>
            )}
          </div>
          {unread > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 min-w-[1.25rem] px-1 place-items-center rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold ring-2 ring-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`truncate text-[15px] ${unread > 0 ? "font-extrabold" : "font-bold"}`}>
              {v?.name ?? "Chef"}
            </span>
            {v?.type && (
              <span className="inline-flex items-center gap-1 text-muted-foreground text-[12px]">
                <KindIcon className="h-3 w-3" />
                {kindLabel}
              </span>
            )}
            <span className={`ml-auto shrink-0 text-[12px] tabular-nums ${unread > 0 ? "text-[var(--brand-clay)] font-bold" : "text-muted-foreground"}`}>
              {timeLabel(convo.last_message_at)}
            </span>
          </div>
          <div className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            <PreviewIconGlyph kind={preview.icon} />
            <span className="truncate">{preview.text}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function PreviewIconGlyph({ kind }: { kind: PreviewIcon }) {
  const cls = "h-3.5 w-3.5 shrink-0 opacity-80";
  if (kind === "audio") return <PiMicrophoneDuotone className={cls} />;
  if (kind === "invoice") return <PiReceiptDuotone className={cls} />;
  if (kind === "image") return <PiImageDuotone className={cls} />;
  if (kind === "file") return <PiPaperclipDuotone className={cls} />;
  return null;
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="mx-4 mt-8 rounded-3xl border border-dashed border-border bg-white p-10 text-center">
        <PiChatCircleDotsDuotone className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="mt-3 font-semibold">No chats match</p>
        <p className="text-xs text-muted-foreground mt-1">Try clearing your filter or search.</p>
      </div>
    );
  }
  return (
    <div className="mx-4 mt-8 rounded-3xl border border-border bg-white p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
        <PiChatCircleDotsDuotone className="h-8 w-8" />
      </div>
      <p className="mt-3 font-display text-lg font-bold">Your inbox is empty</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        Tap the compose button to find a chef, restaurant or grocery store to chat with.
      </p>
    </div>
  );
}
