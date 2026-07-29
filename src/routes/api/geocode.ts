import { createFileRoute } from "@tanstack/react-router";

/**
 * Server-side geocoding proxy backed by the Google Geocoding API.
 *
 * Kept on the server so the Google key is never exposed to the browser and so
 * we sidestep the CORS limits of Google's web-service APIs. The client calls
 * `/api/geocode?q=...&country=ng`; `src/lib/geo.ts` falls back to OpenStreetMap
 * Nominatim automatically when this returns non-OK (e.g. the key isn't set).
 */
export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env.GOOGLE_MAPS_API_KEY;
        if (!key) return json({ error: "maps_not_configured" }, 503);

        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim();
        if (!q) return json({ error: "missing_query" }, 400);
        const country = url.searchParams.get("country")?.trim();

        const params = new URLSearchParams({ address: q, key });
        if (country) params.set("components", `country:${country.toUpperCase()}`);

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
          );
          const data = (await res.json()) as {
            status?: string;
            results?: { geometry?: { location?: { lat: number; lng: number } } }[];
          };
          const loc = data.results?.[0]?.geometry?.location;
          if (!loc) return json({ error: data.status ?? "not_found" }, 404);
          return json({ lat: loc.lat, lng: loc.lng });
        } catch {
          return json({ error: "geocode_failed" }, 502);
        }
      },
    },
  },
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
