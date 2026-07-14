import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, useMap } from "react-leaflet";
import L, { Icon as LeafletIcon } from "leaflet";
import { MapPinOff, X, LocateFixed, CornerUpRight } from "lucide-react";
import {
  geocodeAddress,
  fetchDrivingRoute,
  haversineM,
  type LatLng,
  type DrivingRoute,
} from "@/lib/geo";
import "leaflet/dist/leaflet.css";

/**
 * Live in-app map for the rider's active delivery. Geocodes the real pickup
 * and drop-off addresses, draws the actual road route with distance and ETA,
 * and tracks the rider's own GPS position as they move. Everything runs on
 * free OSM services — no API keys.
 */
export function RiderDeliveryMap({
  pickupAddress,
  dropoffAddress,
  phase,
  country,
}: {
  pickupAddress: string;
  dropoffAddress: string;
  phase: "to_pickup" | "to_dropoff";
  country: "NG" | "UK";
}) {
  const countryCodes = country === "UK" ? "gb" : "ng";

  const { data, isLoading } = useQuery({
    queryKey: ["rider-map", pickupAddress, dropoffAddress, countryCodes],
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      // Sequential lookups keep us polite to Nominatim's rate limits; both
      // hit the localStorage cache on every visit after the first.
      const pickup = await geocodeAddress(pickupAddress, countryCodes);
      const dropoff = await geocodeAddress(dropoffAddress, countryCodes);
      if (!pickup || !dropoff) return { pickup, dropoff, route: null };
      const route = await fetchDrivingRoute(pickup, dropoff);
      return { pickup, dropoff, route };
    },
  });

  // Rider's own live position — a courier app wants this on by default; if
  // the rider declines the permission prompt we just skip the blue dot.
  const [myPos, setMyPos] = useState<LatLng | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMyPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (isLoading) {
    return <div className="h-52 rounded-xl bg-zinc-100 animate-pulse" />;
  }

  if (!data?.pickup || !data?.dropoff) {
    return (
      <div className="flex h-24 items-center justify-center gap-2 rounded-xl bg-muted/40 text-sm text-muted-foreground">
        <MapPinOff className="h-4 w-4" />
        Map unavailable for these addresses — use the Navigate buttons below.
      </div>
    );
  }

  const { pickup, dropoff, route } = data;
  const fitPoints: LatLng[] = [pickup, dropoff, ...(myPos ? [myPos] : [])];

  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-border">
      <MapContainer
        center={pickup}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-52 w-full sm:h-64"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {route ? (
          <Polyline
            positions={route.coords}
            pathOptions={{ color: "#ff4d4d", weight: 4, opacity: 0.85 }}
          />
        ) : (
          <Polyline
            positions={[pickup, dropoff]}
            pathOptions={{ color: "#ff4d4d", weight: 3, dashArray: "8 8", opacity: 0.7 }}
          />
        )}
        <Marker position={pickup} icon={pinIcon("#1d1d1b")} title="Pickup" />
        <Marker position={dropoff} icon={pinIcon("#ff4d4d")} title="Drop-off" />
        {myPos && (
          <CircleMarker
            center={myPos}
            radius={8}
            pathOptions={{ color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}
          />
        )}
        <FitBounds points={fitPoints} />
      </MapContainer>

      {route && (
        <div className="absolute left-2 top-2 z-[500] rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md ring-1 ring-black/5">
          {route.distanceKm.toFixed(1)} km · ~{Math.max(1, Math.round(route.durationMin))} min drive
        </div>
      )}
      <div className="absolute bottom-1 right-2 z-[500] text-[9px] text-zinc-500">
        © OpenStreetMap
      </div>
      <div className="absolute right-2 top-2 z-[500] rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold shadow-md ring-1 ring-black/5">
        {phase === "to_pickup" ? "Head to pickup" : "Delivering to customer"}
      </div>
    </div>
  );
}

/**
 * Full-screen in-app navigation. Routes from the rider's live GPS position
 * to the target address, follows them as they move, re-routes when they
 * stray from the plan, and shows the next turn instruction — all inside the
 * app, no hand-off to Google Maps.
 */
export function RiderNavigationOverlay({
  targetAddress,
  targetLabel,
  country,
  onClose,
}: {
  targetAddress: string;
  targetLabel: string;
  country: "NG" | "UK";
  onClose: () => void;
}) {
  const countryCodes = country === "UK" ? "gb" : "ng";
  const [riderPos, setRiderPos] = useState<LatLng | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [follow, setFollow] = useState(true);
  const routeOriginRef = useRef<LatLng | null>(null);
  const routingRef = useRef(false);

  const { data: target } = useQuery({
    queryKey: ["nav-target", targetAddress, countryCodes],
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () => geocodeAddress(targetAddress, countryCodes),
  });

  // Live GPS.
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsDenied(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => setRiderPos([p.coords.latitude, p.coords.longitude]),
      () => setGpsDenied(true),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Route from the rider to the target; re-route after drifting ~150m from
  // where the current route was calculated (covers wrong turns).
  useEffect(() => {
    if (!riderPos || !target || routingRef.current) return;
    const origin = routeOriginRef.current;
    if (origin && route && haversineM(riderPos, origin) < 150) return;
    routingRef.current = true;
    fetchDrivingRoute(riderPos, target, true)
      .then((r) => {
        if (r) {
          setRoute(r);
          routeOriginRef.current = riderPos;
        }
      })
      .finally(() => {
        routingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderPos, target]);

  // Next maneuver: the step after the one the rider is currently closest to.
  let nextInstruction: string | null = null;
  let nextDistanceM: number | null = null;
  if (route?.steps?.length && riderPos) {
    let nearest = 0;
    let nearestDist = Infinity;
    route.steps.forEach((s, i) => {
      const d = haversineM(riderPos, s.location);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    const next = route.steps[Math.min(nearest + (nearestDist < 40 ? 1 : 0), route.steps.length - 1)];
    nextInstruction = next.instruction;
    nextDistanceM = haversineM(riderPos, next.location);
  }

  const center = riderPos ?? target ?? null;

  return (
    <div className="fixed inset-0 z-[80] bg-zinc-900">
      {center ? (
        <MapContainer
          center={center}
          zoom={16}
          zoomControl={false}
          attributionControl={false}
          className="absolute inset-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {route && (
            <Polyline positions={route.coords} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} />
          )}
          {target && <Marker position={target} icon={pinIcon("#ff4d4d")} title={targetLabel} />}
          {riderPos && (
            <CircleMarker
              center={riderPos}
              radius={9}
              pathOptions={{ color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 4 }}
            />
          )}
          <FollowRider pos={riderPos} follow={follow} onUserPan={() => setFollow(false)} />
        </MapContainer>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-zinc-300">
          {gpsDenied
            ? "Turn on location access to navigate."
            : target === null
              ? "Couldn't locate that address on the map."
              : "Getting your position…"}
        </div>
      )}

      {/* Next turn banner */}
      {nextInstruction && (
        <div className="absolute left-3 right-3 top-3 z-[500] flex items-center gap-3 rounded-2xl bg-zinc-900/95 px-4 py-3 text-white shadow-xl">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600">
            <CornerUpRight className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-zinc-400">
              {nextDistanceM != null ? formatMeters(nextDistanceM) : ""}
            </div>
            <div className="truncate text-sm font-semibold">{nextInstruction}</div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute inset-x-3 bottom-3 z-[500] rounded-2xl bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 truncate">{targetLabel}</div>
            <div className="text-sm font-bold">
              {route
                ? `${route.distanceKm.toFixed(1)} km · ~${Math.max(1, Math.round(route.durationMin))} min`
                : "Calculating route…"}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!follow && (
              <button
                type="button"
                onClick={() => setFollow(true)}
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white shadow-md"
                aria-label="Re-center on me"
              >
                <LocateFixed className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <X className="h-4 w-4" /> End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Keeps the camera on the rider; panning by hand hands control back. */
function FollowRider({
  pos,
  follow,
  onUserPan,
}: {
  pos: LatLng | null;
  follow: boolean;
  onUserPan: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onUserPan();
    map.on("dragstart", handler);
    return () => {
      map.off("dragstart", handler);
    };
  }, [map, onUserPan]);
  useEffect(() => {
    if (pos && follow) map.setView(pos, Math.max(map.getZoom(), 16), { animate: true });
  }, [map, pos, follow]);
  return null;
}

function formatMeters(m: number) {
  return m >= 1000 ? `In ${(m / 1000).toFixed(1)} km` : `In ${Math.max(10, Math.round(m / 10) * 10)} m`;
}

/** Re-fit the viewport whenever the tracked points change (e.g. GPS moves). */
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join(";");
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** Inline SVG pin so we don't ship leaflet's default PNGs (broken in bundlers). */
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
