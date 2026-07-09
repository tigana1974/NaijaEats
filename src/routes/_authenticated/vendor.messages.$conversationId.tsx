import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/naija/ChatThread";
import { useMyRole } from "@/hooks/useMyRole";
import { ArrowLeft, Info, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();
      if (!convo) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", convo.customer_id)
        .maybeSingle();

      if (profile) {
        (convo as any).customer = profile;
      }

      return { me: uid, conversation: convo };
    },
  });

  const cust = (data?.conversation as any)?.customer;
  const name = cust?.full_name || "Customer";

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    // Bypass AppShell entirely — this is a full-viewport dedicated chat
    // screen. Using `h-dvh flex flex-col` guarantees ChatThread's flex-1
    // messages scroller has real vertical space to grow into, which is the
    // fix for the "can't interact with the chat" bug.
    <div className="h-dvh w-full flex flex-col bg-[oklch(0.985_0.005_90)]">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 bg-white/95 backdrop-blur border-b border-black/5 flex items-center gap-2">
        <Link
          to="/vendor/messages"
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
          {cust?.avatar_url ? (
            <img src={cust.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-[var(--brand-forest)] text-[var(--brand-ink)] font-display font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-[15px] truncate leading-tight text-foreground">
            {name}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-tight">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Customer
          </div>
        </div>
        <Link
          to="/vendor/messages"
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5"
          aria-label="Info"
        >
          <Info className="h-5 w-5" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5"
              aria-label="More"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                if (confirm("Are you sure you want to clear this chat history?")) {
                  if (data?.conversation?.id) {
                    await supabase.from("messages").delete().eq("conversation_id", data.conversation.id);
                  }
                }
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" />
              Clear chat history
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body — flex-1 ensures ChatThread's own flex-1 scroller works */}
      {isLoading || !data?.conversation ? (
        <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
          {isLoading ? "Opening chat…" : "Conversation not found."}
        </div>
      ) : (
        <ChatThread
          conversationId={data.conversation.id}
          meId={data.me}
          otherName={name}
          otherAvatar={cust?.avatar_url ?? null}
          unreadField="vendor_unread"
          isVendor={true}
        />
      )}
    </div>
  );
}
