import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ONLINE_KEY = "rider_online";
const ONLINE_EVENT = "naijaeats:rider-online-changed";

/**
 * Shared online/offline switch for the rider portal. Persists to the same
 * `rider_online` localStorage key the dashboard already used, and broadcasts
 * changes so the dashboard toggle and the job board stay in sync.
 */
export function useRiderOnline(): [boolean, (v: boolean) => void] {
  const [online, setOnlineState] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(ONLINE_KEY) === "true",
  );

  useEffect(() => {
    const sync = () => setOnlineState(localStorage.getItem(ONLINE_KEY) === "true");
    window.addEventListener(ONLINE_EVENT, sync);
    window.addEventListener("storage", sync); // cross-tab
    return () => {
      window.removeEventListener(ONLINE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setOnline = (v: boolean) => {
    localStorage.setItem(ONLINE_KEY, String(v));
    setOnlineState(v);
    window.dispatchEvent(new Event(ONLINE_EVENT));
  };

  return [online, setOnline];
}

/** Documents a rider must have verified before they can claim jobs. */
export const REQUIRED_RIDER_DOCS: { key: string; label: string }[] = [
  { key: "drivers_license", label: "Driver's license" },
  { key: "id_document", label: "Government ID" },
  { key: "vehicle_registration", label: "Vehicle registration" },
  { key: "insurance", label: "Insurance" },
];

export type RiderVerification = {
  /** loading | incomplete (docs missing/rejected) | pending (uploaded, awaiting admin) | verified */
  status: "loading" | "incomplete" | "pending" | "verified";
  /** Labels of required docs that are missing or were rejected. */
  missing: string[];
  /** Number of required docs uploaded and awaiting admin review. */
  pendingCount: number;
};

/**
 * Computes whether the signed-in rider is cleared to claim delivery jobs.
 * A rider is verified once every required document has at least one
 * admin-verified upload.
 */
export function useRiderVerification(enabled = true): RiderVerification {
  const { data, isLoading } = useQuery({
    queryKey: ["rider-verification"],
    enabled,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("rider_documents")
        .select("doc_type, status")
        .eq("rider_id", uid);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !enabled) return { status: "loading", missing: [], pendingCount: 0 };

  const missing: string[] = [];
  let pendingCount = 0;
  for (const doc of REQUIRED_RIDER_DOCS) {
    const uploads = (data ?? []).filter((d) => d.doc_type === doc.key);
    if (uploads.some((d) => d.status === "verified")) continue;
    if (uploads.some((d) => d.status === "pending")) pendingCount += 1;
    else missing.push(doc.label);
  }

  const status = missing.length > 0 ? "incomplete" : pendingCount > 0 ? "pending" : "verified";
  return { status, missing, pendingCount };
}
