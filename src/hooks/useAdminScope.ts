import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminRegion = "all" | "uk" | "ng";

/** Region id used by the AdminShell selector → DB country code. */
export function regionToCountry(region: AdminRegion): "NG" | "UK" | null {
  if (region === "ng") return "NG";
  if (region === "uk") return "UK";
  return null;
}

/**
 * Whether the signed-in admin is the parent admin (full access, both
 * countries, mints access codes) or a country manager (must redeem a code).
 */
export function useAdminScope() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-scope"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_admin_scope");
      if (error) {
        // The access-control migration isn't applied yet (or the call
        // transiently failed). Fall back to legacy single-admin behaviour so
        // the panel isn't bricked — RLS still guards every table, and
        // managers can only exist once the migration is live.
        console.warn("get_my_admin_scope unavailable, assuming parent admin:", error.message);
        return { is_admin: true, is_parent: true };
      }
      return data as { is_admin: boolean; is_parent: boolean };
    },
  });
  return {
    loading: isLoading,
    isAdmin: Boolean((data as any)?.is_admin),
    isParent: Boolean((data as any)?.is_parent),
  };
}

// Unlocks live in sessionStorage on purpose: a manager must re-enter their
// code every new browser session, so each working session shows up in the
// audit log as a `panel_unlocked` event.
const UNLOCK_KEY = "admin_unlocked_regions";

export function getUnlockedRegions(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(UNLOCK_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isRegionUnlocked(region: AdminRegion): boolean {
  return getUnlockedRegions().includes(region);
}

export function unlockRegion(region: AdminRegion) {
  const set = new Set(getUnlockedRegions());
  set.add(region);
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify([...set]));
}
