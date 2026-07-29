import { createFileRoute } from "@tanstack/react-router";

/**
 * Server-side driving-directions proxy backed by the Google Directions API.
 *
 * Returns a Leaflet-ready shape ([lat, lng] coords, distance, duration, and
 * optional turn-by-turn steps) so it is a drop-in for the previous OSRM call.
 * `src/lib/geo.ts` falls back to the public OSRM server when this is non-OK.
 * Query: /api/directions?from=lat,lng&to=lat,lng&steps=1
 */
export const Route = createFileRoute("/api/directions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env.GOOGLE_MAPS_API_KEY;
        if (!key) return json({ error: "maps_not_configured" }, 503);

        const url = new URL(request.url);
        const from = url.searchParams.get("from")?.trim();
        const to = url.searchParams.get("to")?.trim();
        const withSteps = url.searchParams.get("steps") === "1";
        if (!from || !to) return json({ error: "missing_points" }, 400);

        const params = new URLSearchParams({
          origin: from,
          destination: to,
          mode: "driving",
          key,
        });

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?${params}`,
          );
          const data = (await res.json()) as any;
          const route = data?.routes?.[0];
          const leg = route?.legs?.[0];
          if (!route || !leg) return json({ error: data?.status ?? "no_route" }, 404);

          return json({
            coords: decodePolyline(route.overview_polyline?.points ?? ""),
            distanceKm: (leg.distance?.value ?? 0) / 1000,
            durationMin: (leg.duration?.value ?? 0) / 60,
            steps: withSteps
              ? (leg.steps ?? []).map((s: any) => ({
                  instruction: stripHtml(String(s.html_instructions ?? "")),
                  location: [s.start_location.lat, s.start_location.lng] as [number, number],
                }))
              : undefined,
          });
        } catch {
          return json({ error: "directions_failed" }, 502);
        }
      },
    },
  },
});

/** Decode a Google encoded polyline into [lat, lng] pairs. */
function decodePolyline(str: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: [number, number][] = [];
  while (index < str.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
