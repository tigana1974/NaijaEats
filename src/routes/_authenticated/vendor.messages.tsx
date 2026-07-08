import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useVendorStore } from "@/hooks/useVendorStore";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/messages")({
  component: VendorInbox,
});

function VendorInbox() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { activeShopId } = useVendorStore();
  const { data, refetch } = useQuery({
    queryKey: ["conversations", "vendor", activeShopId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return [];
      
      let query = supabase.from("vendors").select("id, name").eq("owner_id", uid);
      if (activeShopId) {
        query = query.eq("id", activeShopId);
      }
      
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

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Inbox</h1>
        <p className="text-muted-foreground mt-1">Reply to customers chatting with your shop.</p>

        <div className="mt-6 space-y-2">
          {(!data || data.length === 0) && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No customer messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Customers can reach you from your shop page.
              </p>
            </div>
          )}
          {data?.map((c: any) => {
            const cust = c.customer;
            const name = cust?.full_name || "Customer";
            return (
              <Link
                key={c.id}
                to="/vendor/messages/$conversationId"
                params={{ conversationId: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-[var(--shadow-soft)] transition"
              >
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0 grid place-items-center text-sm font-semibold">
                  {cust?.avatar_url ? (
                    <img src={cust.avatar_url} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{name}</span>
                    {c.last_message_at && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(c.last_message_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-sm text-muted-foreground truncate">
                      {c.last_message ?? "Say hello"}
                    </p>
                    {c.vendor_unread > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] text-[11px] font-semibold">
                        {c.vendor_unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}