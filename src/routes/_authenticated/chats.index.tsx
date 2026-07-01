import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chats/")({
  component: ChatsList,
});

function ChatsList() {
  const { data, refetch } = useQuery({
    queryKey: ["conversations", "customer"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];
      const { data } = await supabase
        .from("conversations")
        .select("*, vendor:vendors(id, name, slug, logo_url, cover_image_url)")
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

  return (
    <CustomerShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Messages</h1>
        <p className="text-muted-foreground mt-1">Chat directly with your chefs.</p>

        <div className="mt-6 space-y-2">
          {(!data || data.length === 0) && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap “Message chef” from any restaurant or chef to start a chat.
              </p>
              <Link
                to="/discover"
                className="inline-block mt-4 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-5 py-2 text-sm font-semibold"
              >
                Discover chefs
              </Link>
            </div>
          )}
          {data?.map((c: any) => {
            const v = c.vendor;
            return (
              <Link
                key={c.id}
                to="/chats/$vendorId"
                params={{ vendorId: v?.id ?? "" }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-[var(--shadow-soft)] transition"
              >
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {v?.logo_url || v?.cover_image_url ? (
                    <img src={v.logo_url ?? v.cover_image_url} alt={v.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{v?.name ?? "Chef"}</span>
                    {c.last_message_at && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(c.last_message_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-sm text-muted-foreground truncate">
                      {c.last_message ?? "Start the conversation"}
                    </p>
                    {c.customer_unread > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] text-[11px] font-semibold">
                        {c.customer_unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </CustomerShell>
  );
}
