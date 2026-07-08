import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { ChatThread } from "@/components/naija/ChatThread";
import { useMyRole } from "@/hooks/useMyRole";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/messages/$conversationId")({
  component: VendorConversation,
});

function VendorConversation() {
  const { conversationId } = Route.useParams();
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-conversation", conversationId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: convo } = await supabase
        .from("conversations")
        .select("*, customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url)")
        .eq("id", conversationId)
        .maybeSingle();
      if (!convo) return null;
      return { me: uid, conversation: convo };
    },
  });

  const cust = (data?.conversation as any)?.customer;
  const name = cust?.full_name || "Customer";

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/vendor/messages"
            className="h-9 w-9 grid place-items-center rounded-full ring-1 ring-border hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0 grid place-items-center text-sm font-semibold">
              {cust?.avatar_url ? (
                <img src={cust.avatar_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1 className="font-display text-lg sm:text-xl font-semibold truncate">{name}</h1>
          </div>
        </div>

        {isLoading || !data?.conversation ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            {isLoading ? "Opening chat…" : "Conversation not found."}
          </div>
        ) : (
          <ChatThread
            conversationId={data.conversation.id}
            meId={data.me}
            otherName={name}
            unreadField="vendor_unread"
            isVendor={true}
          />
        )}
      </div>
    </AppShell>
  );
}