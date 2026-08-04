import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the unread-notification count across every app
 * shell (customer / vendor / rider / admin).
 *
 * - Counts rows in `notifications` where `user_id = me` and `is_unread = true`.
 * - Subscribes to Supabase Realtime so the number updates the moment a row
 *   is inserted OR flipped to read.
 * - Cached under a stable react-query key so every mount reuses the same
 *   data — no redundant round-trips when multiple components consume it.
 */
export function useUnreadNotifications(): { count: number; refetch: () => void } {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_unread", true);
      return count ?? 0;
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    let uid: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      uid = u.user?.id ?? null;
      if (!uid || cancelled) return;

      // The effect can re-run (StrictMode, remounts) before the previous async
      // setup finished. supabase.channel() returns the EXISTING channel for a
      // topic, and calling .on() on an already-subscribed channel throws
      // "cannot add postgres_changes callbacks ... after subscribe()".
      // Drop any channel already holding this topic first.
      const topic = `notifications:${uid}`;
      for (const existing of supabase.getChannels()) {
        if (existing.topic === topic || existing.topic === `realtime:${topic}`) {
          await supabase.removeChannel(existing);
        }
      }
      if (cancelled) return;

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["unread-notifications"] });
            qc.invalidateQueries({ queryKey: ["notifications-list"] });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  return { count: query.data ?? 0, refetch: () => query.refetch() };
}

/** Small helper for the badge itself — cap the visible number at 99+. */
export function formatBadgeCount(n: number): string {
  if (n <= 0) return "";
  if (n > 99) return "99+";
  return String(n);
}
