import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L, { Icon as LeafletIcon, DivIcon } from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { geocodeAddress, fetchDrivingRoute, type LatLng } from "@/lib/geo";
import { OrderTrackingMap } from "@/components/naija/OrderTracking";
import "leaflet/dist/leaflet.css";

/** Rider positions older than this are treated as stale and hidden. */
const LOCATION_FRESH_MS = 5 * 60 * 1000;

/**
 * Customer order-tracking map with the real driver position. The rider app
 * streams GPS onto the delivery row; this component receives each update
 * instantly over realtime (with 15s polling as backstop) and moves the
 * driver marker along the actual road route from the vendor to the customer.
 *
 * Falls back to the illustrative OrderTrackingMap when the addresses can't
 * be geocoded, so the page never shows a broken map.
 */
export function LiveOrderMap({
  orderId,
  currency,
  status,
  vendorAddress,
  deliveryAddress,
}: {
  orderId: string;
  currency: string;
  status: string;
  vendorAddress?: string | null;
  deliveryAddress?: string | null;
}) {
  const qc = useQueryClient();

  // Leaflet needs DOM globals; defer to client like OrderTrackingMap does.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const countryCodes = currency === "GBP" ? "gb" : "ng";
  const active = status !== "delivered" && status !== "cancelled";

  const { data: geo, isLoading: geoLoading } = useQuery({
    queryKey: ["order-map-geo", orderId, vendorAddress, deliveryAddress],
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: mounted && Boolean(vendorAddress && deliveryAddress),
    queryFn: async () => {
      const vendor = await geocodeAddress(vendorAddress!, countryCodes);
      const customer = await geocodeAddress(deliveryAddress!, countryCodes);
      if (!vendor || !customer) return { vendor, customer, route: null };
      const route = await fetchDrivingRoute(vendor, customer);
      return { vendor, customer, route };
    },
  });

  const { data: delivery } = useQuery({
    queryKey: ["order-delivery-live", orderId],
    enabled: mounted,
    refetchInterval: active ? 15_000 : false,
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("id, status, rider_lat, rider_lng, rider_location_at")
        .eq("order_id", orderId)
        .maybeSingle();
      return data ?? null;
    },
  });

  // Realtime: every rider GPS write lands here the moment it happens.
  useEffect(() => {
    if (!mounted || !active) return;
    const channel = supabase
      .channel(`order-delivery-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deliveries", filter: `order_id=eq.${orderId}` },
        (payload) => {
          qc.setQueryData(["order-delivery-live", orderId], payload.new);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, active, orderId, qc]);

  if (!mounted || geoLoading) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e9efe5,transparent_60%),radial-gradient(circle_at_70%_70%,#f4ecde,transparent_60%)] bg-zinc-50" />
    );
  }

  // No real coordinates available — keep the honest illustrative map.
  if (!geo?.vendor || !geo?.customer) {
    return <OrderTrackingMap currency={currency} status={status} />;
  }

  const { vendor, customer, route } = geo;

  const locationAge = delivery?.rider_location_at
    ? Date.now() - new Date(delivery.rider_location_at).getTime()
    : Infinity;
  const riderPos: LatLng | null =
    delivery?.rider_lat != null &&
    delivery?.rider_lng != null &&
    locationAge < LOCATION_FRESH_MS &&
    (delivery.status === "assigned" || delivery.status === "picked_up")
      ? [delivery.rider_lat, delivery.rider_lng]
      : null;

  const fitPoints: LatLng[] = [vendor, customer, ...(riderPos ? [riderPos] : [])];

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={vendor}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {route ? (
          <Polyline positions={route.coords} pathOptions={{ color: "#ff4d4d", weight: 4, opacity: 0.85 }} />
        ) : (
          <Polyline
            positions={[vendor, customer]}
            pathOptions={{ color: "#ff4d4d", weight: 3, dashArray: "8 8", opacity: 0.7 }}
          />
        )}
        <Marker position={vendor} icon={pinIcon("#1d1d1b")} title="Vendor" />
        <Marker position={customer} icon={pinIcon("#ff4d4d")} title="Delivery address" />
        {riderPos && <Marker position={riderPos} icon={riderIcon()} title="Your rider" />}
        <FitLivePoints points={fitPoints} />
      </MapContainer>

      {riderPos && (
        <div className="absolute left-1/2 top-16 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold shadow-md ring-1 ring-black/5 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live driver location{locationAge < 30_000 ? " · just now" : ` · ${Math.round(locationAge / 60_000) || 1} min ago`}
        </div>
      )}
    </div>
  );
}

/** Re-frame the map as the driver moves so they never wander off-screen. */
function FitLivePoints({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => p.map((n) => n.toFixed(4)).join(",")).join(";");
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function pinIcon(color: string) {
  return new LeafletIcon({
    iconUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 34 44"><path fill="${color}" d="M17 0C7.6 0 0 7.6 0 17c0 12.3 17 27 17 27s17-14.7 17-27C34 7.6 26.4 0 17 0z"/><circle cx="17" cy="17" r="6" fill="white"/></svg>`,
      ),
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

/** The driver: a scooter badge that reads instantly at any zoom. */
function riderIcon() {
  return new DivIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:38px;height:38px;border-radius:9999px;background:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,.45);border:3px solid #fff;font-size:18px;line-height:1">🛵</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}
