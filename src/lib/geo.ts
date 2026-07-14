/**
 * Free, no-API-key geo helpers for the rider map:
 * - Geocoding via OpenStreetMap Nominatim (results cached in localStorage —
 *   the same vendor address gets looked up once, ever, per device).
 * - Driving routes via the public OSRM demo server, which returns the real
 *   road polyline plus distance and duration.
 */

export type LatLng = [number, number];

const GEO_CACHE_PREFIX = "geo:v1:";
// Session-scoped negative cache so a bad address doesn't get re-queried on
// every render, without permanently blacklisting it across sessions.
const failedThisSession = new Set<string>();

export async function geocodeAddress(
  address: string,
  countryCodes?: string,
): Promise<LatLng | null> {
  const query = address.trim();
  if (!query || failedThisSession.has(query)) return null;

  const cacheKey = GEO_CACHE_PREFIX + query.toLowerCase();
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as LatLng;
  } catch {
    /* corrupt cache entry — fall through to a fresh lookup */
  }

  const params = new URLSearchParams({ format: "json", limit: "1", q: query });
  if (countryCodes) params.set("countrycodes", countryCodes);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as { lat: string; lon: string }[];
    if (!results?.[0]) {
      failedThisSession.add(query);
      return null;
    }
    const point: LatLng = [Number(results[0].lat), Number(results[0].lon)];
    try {
      localStorage.setItem(cacheKey, JSON.stringify(point));
    } catch {
      /* storage full — lookup still succeeded */
    }
    return point;
  } catch {
    return null;
  }
}

export type RouteStep = {
  /** Human instruction, e.g. "Turn left onto Allen Avenue". */
  instruction: string;
  /** Where the maneuver happens. */
  location: LatLng;
};

export type DrivingRoute = {
  /** Road polyline as [lat, lng] points, ready for Leaflet. */
  coords: LatLng[];
  distanceKm: number;
  durationMin: number;
  /** Turn-by-turn maneuvers (only when requested). */
  steps?: RouteStep[];
};

export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
  withSteps = false,
): Promise<DrivingRoute | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson${withSteps ? "&steps=true" : ""}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    return {
      // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
      coords: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as LatLng),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps: withSteps
        ? (route.legs?.[0]?.steps ?? []).map((s: any) => ({
            instruction: stepInstruction(s),
            location: [s.maneuver.location[1], s.maneuver.location[0]] as LatLng,
          }))
        : undefined,
    };
  } catch {
    return null;
  }
}

/** Compose a readable instruction from an OSRM step. */
function stepInstruction(step: any): string {
  const type = step?.maneuver?.type ?? "";
  const modifier = step?.maneuver?.modifier ?? "";
  const name = step?.name ? ` onto ${step.name}` : "";
  switch (type) {
    case "depart":
      return step?.name ? `Head out on ${step.name}` : "Head out";
    case "arrive":
      return "Arrive at your destination";
    case "roundabout":
    case "rotary":
      return `At the roundabout, take exit ${step?.maneuver?.exit ?? ""}`.trim();
    case "merge":
      return `Merge${modifier ? ` ${modifier}` : ""}${name}`;
    case "on ramp":
      return `Take the ramp${name}`;
    case "off ramp":
      return `Take the exit${name}`;
    case "fork":
      return `Keep ${modifier || "ahead"} at the fork${name}`;
    case "continue":
    case "new name":
      return step?.name ? `Continue on ${step.name}` : "Continue straight";
    default:
      return `${modifier ? `Turn ${modifier}` : "Continue"}${name}`;
  }
}

/** Straight-line distance in meters between two points. */
export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
