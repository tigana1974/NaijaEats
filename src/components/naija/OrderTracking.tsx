import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline } from "react-leaflet";
import { Icon as LeafletIcon } from "leaflet";
import { ChefHat, Bike, PackageCheck, ClipboardCheck, Soup, ShoppingBag } from "lucide-react";
import "leaflet/dist/leaflet.css";

/**
 * Real order status values mapped to friendly labels and icons. Status order
 * mirrors the existing flow in orders.$orderId.tsx so nothing in the data
 * pipeline changes — just the visual presentation.
 *
 * "cancelled" is handled separately by the caller.
 */
const STAGES = [
  { status: "pending", label: "Placed", short: "Placed", Icon: ClipboardCheck },
  { status: "accepted", label: "Accepted", short: "Accepted", Icon: ShoppingBag },
  { status: "preparing", label: "Preparing", short: "Cooking", Icon: Soup },
  { status: "ready", label: "Ready", short: "Ready", Icon: ChefHat },
  { status: "picked_up", label: "On the way", short: "En route", Icon: Bike },
  { status: "delivered", label: "Delivered", short: "Delivered", Icon: PackageCheck },
] as const;

export type OrderStage = (typeof STAGES)[number]["status"];

export function statusHeadlineFor(status: string): { headline: string; eta?: string } {
  switch (status) {
    case "pending":
      return { headline: "Order placed" };
    case "accepted":
      return { headline: "Vendor accepted your order" };
    case "preparing":
      return { headline: "Preparing your order" };
    case "ready":
      return { headline: "Ready for pickup" };
    case "picked_up":
      return { headline: "Rider is on the way" };
    case "delivered":
      return { headline: "Delivered" };
    case "cancelled":
      return { headline: "Order cancelled" };
    default:
      return { headline: status };
  }
}

/**
 * Horizontal status timeline — pill icons connected by a thin track that
 * "fills" up to the current stage. Active stage gets a filled icon and brand
 * orange; completed stages get a check mark in green; future stages stay
 * outline-grey. Matches the "filled active, outline inactive" pattern.
 */
export function OrderStatusTracker({ status }: { status: string }) {
  const currentIndex = STAGES.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center justify-between gap-2">
      {STAGES.map((stage, i) => {
        const Icon = stage.Icon;
        const completed = currentIndex > i;
        const current = currentIndex === i;
        const dotClass = current
          ? "bg-[var(--brand-clay)] text-white shadow-[0_4px_14px_-2px_rgba(255,77,77,0.55)] ring-4 ring-[var(--brand-clay)]/15"
          : completed
            ? "bg-emerald-500 text-white"
            : "bg-zinc-100 text-zinc-400";
        return (
          <div key={stage.status} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className={`flex-1 h-0.5 ${completed || current ? "bg-[var(--brand-clay)]" : "bg-zinc-200"}`}
                />
              )}
              <div
                className={`grid h-9 w-9 place-items-center rounded-full transition ${dotClass}`}
                aria-label={stage.label}
              >
                <Icon className="h-4 w-4" strokeWidth={current ? 2.4 : 2} />
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${completed ? "bg-[var(--brand-clay)]" : "bg-zinc-200"}`}
                />
              )}
            </div>
            <span
              className={`text-[10px] leading-tight text-center ${current ? "text-zinc-900 font-semibold" : "text-zinc-500"}`}
            >
              {stage.short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Order tracking map.
 *
 * Important: we deliberately do NOT geocode or store real coordinates for
 * orders today — `deliveries`/`vendors` have no lat/long columns. This map
 * is therefore intentionally illustrative: it centers on a city based on the
 * order currency (Lagos for NGN, London for GBP), shows two markers
 * representing "vendor here-ish" and "you here-ish" and a dashed route
 * line between them.
 *
 * This is honest about its limitations: it gives the customer a visual
 * sense of "there's an active delivery" without inventing data we don't
 * have. When real geocoding is wired up later, the only thing that changes
 * is the lat/lng inputs to this component.
 */
type LatLng = [number, number];

const DEFAULT_CENTERS: Record<string, { city: LatLng; vendor: LatLng; customer: LatLng }> = {
  NGN: {
    // Lagos, NG. Markers are intentionally close so the route line reads as
    // an in-city delivery, not a cross-continental one.
    city: [6.4541, 3.3947],
    vendor: [6.4541, 3.3947],
    customer: [6.4474, 3.4072],
  },
  GBP: {
    // London, UK.
    city: [51.5074, -0.1278],
    vendor: [51.5074, -0.1278],
    customer: [51.5155, -0.1411],
  },
};

export function OrderTrackingMap({
  currency,
  status,
}: {
  currency: string;
  status: string;
}) {
  // Leaflet doesn't SSR cleanly without DOM globals. Defer mount to client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e9efe5,transparent_60%),radial-gradient(circle_at_70%_70%,#f4ecde,transparent_60%)] bg-zinc-50" />
    );
  }

  const points = DEFAULT_CENTERS[currency] ?? DEFAULT_CENTERS.NGN;
  // After dispatch, the rider's pin "advances" along the dashed line. We
  // don't have a real position so we just pick a fraction based on status.
  const fraction =
    status === "picked_up" ? 0.55 : status === "ready" ? 0.1 : status === "delivered" ? 1 : 0;
  const riderPin: LatLng = [
    points.vendor[0] + (points.customer[0] - points.vendor[0]) * fraction,
    points.vendor[1] + (points.customer[1] - points.vendor[1]) * fraction,
  ];

  // Inline SVG -> data URL marker so we don't have to ship leaflet's default
  // PNG assets that break in modern bundlers.
  const makeMarker = (color: string) =>
    new LeafletIcon({
      iconUrl:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44"><path fill="${color}" d="M17 0C7.6 0 0 7.6 0 17c0 12.3 17 27 17 27s17-14.7 17-27C34 7.6 26.4 0 17 0z"/><circle cx="17" cy="17" r="6" fill="white"/></svg>`,
        ),
      iconSize: [34, 44],
      iconAnchor: [17, 44],
    });

  return (
    <MapContainer
      center={points.city}
      zoom={14}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="absolute inset-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // Required attribution for OSM tiles even when control is hidden,
        // surfaced in a small footer label on the tracking page itself.
      />
      <Polyline
        positions={[points.vendor, points.customer]}
        pathOptions={{ color: "#ff4d4d", weight: 3, dashArray: "8 8", opacity: 0.85 }}
      />
      <Marker position={points.vendor} icon={makeMarker("#1d1d1b")} />
      <Marker position={points.customer} icon={makeMarker("#ff4d4d")} />
      {fraction > 0 && fraction < 1 && (
        <CircleMarker
          center={riderPin}
          radius={9}
          pathOptions={{ color: "#ff4d4d", fillColor: "#fff", fillOpacity: 1, weight: 4 }}
        />
      )}
    </MapContainer>
  );
}
