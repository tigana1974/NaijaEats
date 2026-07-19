/**
 * Saved (favourite) vendors. Synced to the `user_favorites` table so they
 * follow the account across devices; localStorage is only a cache that keeps
 * reads synchronous.
 */

import { supabase } from "@/integrations/supabase/client";

const KEY = "naijaeats.favorites.vendors.v2";
export const FAVORITES_EVENT = "naijaeats-favorites-changed";

let lastSync = 0;

function readCache(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeCache(list: string[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

/** Pull the server list into the cache (no-op when signed out). */
export async function syncFavorites(): Promise<string[]> {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return readCache();
    const { data, error } = await (supabase as any)
      .from("user_favorites")
      .select("vendor_id")
      .eq("user_id", u.user.id);
    if (error) throw error;
    const list = (data ?? []).map((r: any) => r.vendor_id as string);
    lastSync = Date.now();
    writeCache(list);
    return list;
  } catch {
    return readCache();
  }
}

export function loadFavorites(): string[] {
  if (typeof window !== "undefined" && Date.now() - lastSync > 30_000) {
    void syncFavorites();
  }
  return readCache();
}

export function isFavorite(vendorId: string): boolean {
  return loadFavorites().includes(vendorId);
}

/** Returns the new state: true = now saved, false = removed. */
export function toggleFavorite(vendorId: string): boolean {
  const list = readCache();
  const has = list.includes(vendorId);
  const next = has ? list.filter((id) => id !== vendorId) : [vendorId, ...list];
  writeCache(next);

  // Mirror to the server in the background.
  void (async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (has) {
        await (supabase as any)
          .from("user_favorites")
          .delete()
          .eq("user_id", u.user.id)
          .eq("vendor_id", vendorId);
      } else {
        await (supabase as any)
          .from("user_favorites")
          .upsert({ user_id: u.user.id, vendor_id: vendorId }, { onConflict: "user_id,vendor_id" });
      }
    } catch {
      // cache still holds the intent; next sync reconciles
    }
  })();

  return !has;
}
