import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * While a rider has an active delivery, stream their GPS position onto the
 * delivery row so the customer's tracking map can show the driver moving.
 * Writes are throttled to one every ~12 seconds; the customer side receives
 * them instantly over realtime. Pass null/undefined to stop publishing.
 */
export function usePublishRiderLocation(deliveryId: string | null | undefined) {
  useEffect(() => {
    if (!deliveryId || typeof navigator === "undefined" || !navigator.geolocation) return;

    let lastWrite = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastWrite < 12_000) return;
        lastWrite = now;
        supabase
          .from("deliveries")
          .update({
            rider_lat: pos.coords.latitude,
            rider_lng: pos.coords.longitude,
            rider_location_at: new Date().toISOString(),
          })
          .eq("id", deliveryId)
          .then(({ error }) => {
            // Non-fatal: tracking degrades to the last known position.
            if (error) console.warn("rider location publish failed:", error.message);
          });
      },
      () => {
        /* permission denied — the customer map simply won't show a live dot */
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [deliveryId]);
}
