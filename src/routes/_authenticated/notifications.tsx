import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { useRef, useState } from "react";
import { Bell, Package, MessageCircle, Gift, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type NotificationType = "order" | "message" | "promo" | "system";

function NotificationsPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAsReadMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_unread: false }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  });

  const markAllAsReadMut = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_unread: false }).eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    // Optimistic: the card disappears the moment the swipe completes.
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user.id] });
      const prev = queryClient.getQueryData<any[]>(["notifications", user.id]);
      queryClient.setQueryData<any[]>(["notifications", user.id], (old) =>
        (old ?? []).filter((n) => n.id !== id),
      );
      return { prev };
    },
    onError: (err: any, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications", user.id], ctx.prev);
      toast.error(err?.message || "Could not delete notification");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    },
  });

  const markAllAsRead = () => markAllAsReadMut.mutate();
  const markAsRead = (id: string, link: string | null) => {
    // Only fire if it's unread
    const notif = notifications.find(n => n.id === id);
    if (notif?.is_unread) {
      markAsReadMut.mutate(id);
    }
    if (link) {
      navigate({ to: link });
    }
  };

  const unreadCount = notifications.filter((n) => n.is_unread).length;

  const getIconData = (type: NotificationType) => {
    switch (type) {
      case "order":
        return {
          Icon: Package,
          bg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          ring: "ring-emerald-100",
        };
      case "message":
        return {
          Icon: MessageCircle,
          bg: "bg-gradient-to-br from-blue-400 to-blue-600",
          ring: "ring-blue-100",
        };
      case "promo":
        return {
          Icon: Gift,
          bg: "bg-gradient-to-br from-amber-400 to-orange-500",
          ring: "ring-orange-100",
        };
      case "system":
      default:
        return {
          Icon: Bell,
          bg: "bg-gradient-to-br from-zinc-400 to-zinc-600",
          ring: "ring-zinc-100",
        };
    }
  };

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/20">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate text-zinc-900 tracking-tight">Notifications</h1>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl lg:max-w-3xl px-2 pt-6 sm:pt-8 space-y-6">
        
        {/* Header Actions */}
        <div className="flex items-end justify-between px-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-zinc-900 tracking-tight">Updates</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm font-bold text-[var(--brand-clay)] hover:text-orange-700 transition flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[var(--brand-clay)]/10"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 sm:gap-5 p-4 sm:p-5 rounded-[1.75rem] bg-white ring-1 ring-zinc-100">
                <div className="shrink-0 h-12 w-12 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const { Icon, bg, ring } = getIconData(notif.type as NotificationType);

              return (
                <SwipeToDelete key={notif.id} onDelete={() => deleteMut.mutate(notif.id)}>
                <div
                  onClick={() => markAsRead(notif.id, notif.link)}
                  className={`group relative overflow-hidden rounded-[1.75rem] p-4 sm:p-5 transition-all duration-300 cursor-pointer ${
                    notif.is_unread
                      ? "bg-orange-50/60 ring-1 ring-orange-200/50 shadow-sm hover:bg-orange-50/80"
                      : "bg-white ring-1 ring-zinc-100 hover:ring-zinc-200 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                  }`}
                >
                  {/* Desktop delete (swipe is the mobile gesture) */}
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMut.mutate(notif.id);
                    }}
                    className="absolute bottom-4 right-4 hidden sm:grid h-8 w-8 place-items-center rounded-full text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {/* Unread Indicator Dot */}
                  {notif.is_unread && (
                    <div className="absolute top-5 right-5 h-2.5 w-2.5 rounded-full bg-[var(--brand-clay)] ring-4 ring-orange-50 animate-pulse" />
                  )}

                  <div className="flex gap-4 sm:gap-5">
                    {/* Icon Badge */}
                    <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ring-4 ${bg} ${ring}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                        <h3 className={`font-display text-base tracking-tight truncate ${notif.is_unread ? "font-bold text-zinc-900" : "font-semibold text-zinc-800"}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap uppercase tracking-wider">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${notif.is_unread ? "text-zinc-700 font-medium" : "text-zinc-500"}`}>
                        {notif.message}
                      </p>

                      {/* Action Button */}
                      {notif.link && (
                        <div className="mt-3.5">
                          <button className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-clay)] hover:text-orange-700 transition group-hover:underline">
                            View details <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </SwipeToDelete>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="mt-12 flex flex-col items-center justify-center text-center p-8 rounded-3xl sm:rounded-[2rem] bg-zinc-50/50 border border-dashed border-zinc-200">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-5">
              <Bell className="h-8 w-8 text-zinc-300" />
            </div>
            <h3 className="font-display text-xl font-bold text-zinc-900">All caught up!</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm">
              You don't have any new notifications right now. We'll let you know when there's an update.
            </p>
          </div>
        )}

      </div>
    </RoleShell>
  );
}

/**
 * Swipe the card left OR right past the threshold to delete it. A red
 * "Delete" layer is revealed underneath as you drag; releasing early snaps
 * back. Vertical scrolling is left untouched.
 */
function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const THRESHOLD = 96;

  const finish = (finalOffset: number) => {
    dragging.current = false;
    if (Math.abs(finalOffset) >= THRESHOLD) {
      // Fly the card out in the swipe direction, then delete.
      setLeaving(true);
      setOffset(finalOffset > 0 ? window.innerWidth : -window.innerWidth);
      if (navigator.vibrate) navigator.vibrate(40);
      window.setTimeout(onDelete, 180);
    } else {
      setOffset(0);
    }
  };

  const revealed = Math.min(1, Math.abs(offset) / THRESHOLD);

  return (
    <div className="relative">
      {/* Delete layer behind the card */}
      <div
        className="absolute inset-0 flex items-center justify-between rounded-[1.75rem] bg-red-500 px-6 text-white"
        style={{ opacity: offset === 0 ? 0 : 0.35 + revealed * 0.65 }}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <Trash2 className="h-4 w-4" /> Delete
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          Delete <Trash2 className="h-4 w-4" />
        </span>
      </div>
      <div
        className="relative touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 0.18s ease-out",
          opacity: leaving ? 0.4 : 1,
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
          startY.current = e.touches[0].clientY;
          dragging.current = true;
        }}
        onTouchMove={(e) => {
          if (!dragging.current) return;
          const dx = e.touches[0].clientX - startX.current;
          const dy = e.touches[0].clientY - startY.current;
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 12) {
            // Vertical scroll — abandon the swipe.
            setOffset(0);
            dragging.current = false;
            return;
          }
          setOffset(dx);
        }}
        onTouchEnd={() => finish(offset)}
        onTouchCancel={() => {
          dragging.current = false;
          setOffset(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}
