import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { ChatThread } from "@/components/naija/ChatThread";
import { ArrowLeft, Info, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chats/$vendorId")({
  component: ChatPage,
});

function ChatPage() {
  const { vendorId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", "with-vendor", vendorId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name, logo_url, cover_image_url, slug")
        .eq("id", vendorId)
        .maybeSingle();
      if (!vendor) return null;
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("customer_id", uid)
        .eq("vendor_id", vendorId)
        .maybeSingle();
      let convo = existing;
      if (!convo) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({ customer_id: uid, vendor_id: vendorId })
          .select("*")
          .single();
        convo = created;
      }
      return { me: uid, vendor, conversation: convo };
    },
  });

  return (
    <CustomerShell hideBottomNav>
      <div className="fixed inset-0 z-20 flex flex-col bg-[#f5f1ea]">
        {/* WhatsApp-style header */}
        <div className="sticky top-0 z-10 px-3 py-2.5 bg-[#f5f1ea] border-b border-black/5 flex items-center gap-2">
          <Link
            to="/chats"
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
            {data?.vendor && (data.vendor.logo_url || data.vendor.cover_image_url) ? (
              <img
                src={data.vendor.logo_url ?? data.vendor.cover_image_url ?? ""}
                alt={data.vendor.name ?? "Chef"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[var(--gradient-warm)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-[15px] truncate leading-tight text-foreground">
              {data?.vendor?.name ?? "Chef"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-tight">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              Offline
            </div>
          </div>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5" aria-label="Info">
            <Info className="h-5 w-5" />
          </button>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5" aria-label="More">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {isLoading || !data?.conversation ? (
          <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
            {isLoading ? "Opening chat…" : "Chef not found."}
          </div>
        ) : (
          <ChatThread
            conversationId={data.conversation.id}
            meId={data.me}
            otherName={data.vendor.name}
            otherAvatar={data.vendor.logo_url ?? data.vendor.cover_image_url ?? null}
            unreadField="customer_unread"
          />
        )}
      </div>
    </CustomerShell>
  );
}
