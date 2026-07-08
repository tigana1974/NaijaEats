import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useVendorStore } from "@/hooks/useVendorStore";
import { Search, X } from "lucide-react";
import { PiChatCircleDotsDuotone, PiUserCircleDuotone } from "react-icons/pi";

export const Route = createFileRoute("/_authenticated/vendor/messages")({
  component: VendorInbox,
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
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function VendorInbox() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { activeShopId } = useVendorStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  const { data, refetch } = useQuery({
    queryKey: ["conversations", "vendor", activeShopId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];

      let query = supabase.from("vendors").select("id, name").eq("owner_id", uid);
      if (activeShopId && activeShopId !== "ALL") query = query.eq("id", activeShopId);

      const { data: vendors } = await query;
      const vendor = vendors?.[0];
      if (!vendor) return [];
      const { data: convos } = await supabase
        .from("conversations")
        .select("*, customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url)")
        .eq("vendor_id", vendor.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      return convos ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("conversations-vendor")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);

  const list = data ?? [];
  const totalUnread = list.reduce((n, c: any) => n + (c.vendor_unread ?? 0), 0);

  const filtered = useMemo(() => {
    let out = list as any[];
    if (tab === "unread") out = out.filter((c) => (c.vendor_unread ?? 0) > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((c) => {
        const cust = c.customer;
        return (
          (cust?.full_name ?? "").toLowerCase().includes(q) ||
          (c.last_message ?? "").toLowerCase().includes(q)
        );
      });
    }
    return out;
  }, [list, tab, query]);

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] p-5 sm:p-7 text-white bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12 backdrop-blur border border-white/15">
              <PiChatCircleDotsDuotone className="h-7 w-7 text-[var(--brand-gold)]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70">Inbox</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                Customer messages
              </h1>
            </div>
            {totalUnread > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-[var(--brand-clay)] px-3 py-1.5 text-xs font-bold shadow-lg">
                {totalUnread} new
              </span>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers"
              className="w-full h-11 rounded-2xl border border-border bg-white pl-10 pr-9 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/15 transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full bg-muted hover:bg-muted/70"
                aria-label="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="inline-flex rounded-2xl bg-muted p-0.5 text-xs font-bold">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 h-10 rounded-xl capitalize transition ${
                  tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t}
                {t === "unread" && totalUnread > 0 && (
                  <span className="ml-1 rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] px-1.5 py-0.5 text-[10px]">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-5">
          {filtered.length === 0 ? (
            <EmptyState hasQuery={!!query || tab === "unread"} />
          ) : (
            <div className="rounded-3xl bg-white border border-border overflow-hidden divide-y divide-border">
              {filtered.map((c: any) => (
                <ChatRow key={c.id} convo={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ChatRow({ convo }: { convo: any }) {
  const cust = convo.customer;
  const name = cust?.full_name || "Customer";
  const unread = convo.vendor_unread ?? 0;
  const initial = name.charAt(0).toUpperCase();
  return (
    <Link
      to="/vendor/messages/$conversationId"
      params={{ conversationId: convo.id }}
      className="flex items-center gap-3 p-3.5 hover:bg-muted/40 transition-colors"
    >
      <div className="relative">
        <div className="rounded-2xl overflow-hidden bg-muted ring-1 ring-black/5 shrink-0" style={{ height: 52, width: 52 }}>
          {cust?.avatar_url ? (
            <img src={cust.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-[var(--brand-forest)] text-[var(--brand-ink)] font-display font-bold text-lg">
              {initial}
            </div>
          )}
        </div>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate ${unread > 0 ? "font-extrabold" : "font-semibold"} text-sm sm:text-[15px]`}>
            {name}
          </span>
          <span className={`text-[11px] shrink-0 tabular-nums ${unread > 0 ? "text-[var(--brand-clay)] font-bold" : "text-muted-foreground"}`}>
            {timeLabel(convo.last_message_at)}
          </span>
        </div>
        <p className={`mt-0.5 text-xs truncate ${unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
          {convo.last_message ?? "Say hello"}
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
        <PiChatCircleDotsDuotone className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="mt-3 font-semibold">No chats match</p>
        <p className="text-xs text-muted-foreground mt-1">Try clearing your filter or search.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-border bg-white p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
        <PiUserCircleDuotone className="h-8 w-8" />
      </div>
      <p className="mt-3 font-display text-lg font-bold">No customer messages yet</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        Customers can reach you directly from your shop page.
      </p>
    </div>
  );
}
