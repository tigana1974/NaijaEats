import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { T as notFound } from "../_libs/tanstack__router-core.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, i as initiatePayment } from "./payments.functions-CXhOIQlE.mjs";
import { s as supabase } from "./client-BLGsQl0B.mjs";
import { l as leafletSrcExports } from "../_libs/leaflet.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { i as Route$a } from "./router-LlhGIoeI.mjs";
import "../_libs/seroval.mjs";
import "../_libs/stripe.mjs";
import { e as ChevronLeft, ab as Bike, J as CreditCard, V as ChevronDown, am as ChevronUp, $ as ShoppingCart, an as ClipboardCheck, L as ShoppingBag, ao as Soup, C as ChefHat, ap as PackageCheck } from "../_libs/lucide-react.mjs";
import { M as MapContainer, T as TileLayer, P as Polyline, a as Marker, C as CircleMarker } from "../_libs/react-leaflet.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__query-core.mjs";
import "./server-BJNcc7UM.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C7uuE0z7.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "./payments.config.server-C-tqAA0S.mjs";
import "node:process";
import "node:crypto";
import "os";
import "events";
import "http";
import "https";
import "../_libs/react-leaflet__core.mjs";
const STAGES = [
  { status: "pending", label: "Placed", short: "Placed", Icon: ClipboardCheck },
  { status: "accepted", label: "Accepted", short: "Accepted", Icon: ShoppingBag },
  { status: "preparing", label: "Preparing", short: "Cooking", Icon: Soup },
  { status: "ready", label: "Ready", short: "Ready", Icon: ChefHat },
  { status: "picked_up", label: "On the way", short: "En route", Icon: Bike },
  { status: "delivered", label: "Delivered", short: "Delivered", Icon: PackageCheck }
];
function statusHeadlineFor(status) {
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
function OrderStatusTracker({ status }) {
  const currentIndex = STAGES.findIndex((s) => s.status === status);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-2", children: STAGES.map((stage, i) => {
    const Icon2 = stage.Icon;
    const completed = currentIndex > i;
    const current = currentIndex === i;
    const dotClass = current ? "bg-[var(--brand-clay)] text-white shadow-[0_4px_14px_-2px_rgba(255,77,77,0.55)] ring-4 ring-[var(--brand-clay)]/15" : completed ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center w-full", children: [
        i > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `flex-1 h-0.5 ${completed || current ? "bg-[var(--brand-clay)]" : "bg-zinc-200"}`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `grid h-9 w-9 place-items-center rounded-full transition ${dotClass}`,
            "aria-label": stage.label,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: "h-4 w-4", strokeWidth: current ? 2.4 : 2 })
          }
        ),
        i < STAGES.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `flex-1 h-0.5 ${completed ? "bg-[var(--brand-clay)]" : "bg-zinc-200"}`
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `text-[10px] leading-tight text-center ${current ? "text-zinc-900 font-semibold" : "text-zinc-500"}`,
          children: stage.short
        }
      )
    ] }, stage.status);
  }) });
}
const DEFAULT_CENTERS = {
  NGN: {
    // Lagos, NG. Markers are intentionally close so the route line reads as
    // an in-city delivery, not a cross-continental one.
    city: [6.4541, 3.3947],
    vendor: [6.4541, 3.3947],
    customer: [6.4474, 3.4072]
  },
  GBP: {
    // London, UK.
    city: [51.5074, -0.1278],
    vendor: [51.5074, -0.1278],
    customer: [51.5155, -0.1411]
  }
};
function OrderTrackingMap({
  currency,
  status
}) {
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e9efe5,transparent_60%),radial-gradient(circle_at_70%_70%,#f4ecde,transparent_60%)] bg-zinc-50" });
  }
  const points = DEFAULT_CENTERS[currency] ?? DEFAULT_CENTERS.NGN;
  const fraction = status === "picked_up" ? 0.55 : status === "ready" ? 0.1 : status === "delivered" ? 1 : 0;
  const riderPin = [
    points.vendor[0] + (points.customer[0] - points.vendor[0]) * fraction,
    points.vendor[1] + (points.customer[1] - points.vendor[1]) * fraction
  ];
  const makeMarker = (color) => new leafletSrcExports.Icon({
    iconUrl: "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44"><path fill="${color}" d="M17 0C7.6 0 0 7.6 0 17c0 12.3 17 27 17 27s17-14.7 17-27C34 7.6 26.4 0 17 0z"/><circle cx="17" cy="17" r="6" fill="white"/></svg>`
    ),
    iconSize: [34, 44],
    iconAnchor: [17, 44]
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    MapContainer,
    {
      center: points.city,
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
      className: "absolute inset-0",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TileLayer,
          {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Polyline,
          {
            positions: [points.vendor, points.customer],
            pathOptions: { color: "#ff4d4d", weight: 3, dashArray: "8 8", opacity: 0.85 }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Marker, { position: points.vendor, icon: makeMarker("#1d1d1b") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Marker, { position: points.customer, icon: makeMarker("#ff4d4d") }),
        fraction > 0 && fraction < 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CircleMarker,
          {
            center: riderPin,
            radius: 9,
            pathOptions: { color: "#ff4d4d", fillColor: "#fff", fillOpacity: 1, weight: 4 }
          }
        )
      ]
    }
  );
}
const fmt = (n, currency = "NGN") => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency,
  maximumFractionDigits: 0
}).format(n);
function OrderDetailPage() {
  const {
    orderId
  } = Route$a.useParams();
  const initiatePaymentFn = useServerFn(initiatePayment);
  const [paying, setPaying] = reactExports.useState(false);
  const [detailsOpen, setDetailsOpen] = reactExports.useState(false);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const {
        data: data2,
        error
      } = await supabase.from("orders").select("*, order_items(*), vendor:vendors(name, logo_url, city, country, prep_time_minutes)").eq("id", orderId).maybeSingle();
      if (error) throw error;
      if (!data2) throw notFound();
      return data2;
    },
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (!status || status === "delivered" || status === "cancelled") return false;
      return 2e4;
    }
  });
  reactExports.useEffect(() => {
    if (!data) return;
    const isActive = data.status !== "delivered" && data.status !== "cancelled";
    setDetailsOpen(isActive);
  }, [data?.status]);
  const payNow = async () => {
    setPaying(true);
    try {
      const {
        checkoutUrl
      } = await initiatePaymentFn({
        data: {
          orderId
        }
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment");
      setPaying(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-dvh bg-white grid place-items-center text-zinc-500", children: "Loading…" });
  }
  if (!data) return null;
  const isCancelled = data.status === "cancelled";
  const isDelivered = data.status === "delivered";
  const {
    headline
  } = statusHeadlineFor(data.status);
  const etaMinutes = data.vendor?.prep_time_minutes ?? 30;
  const etaTime = new Date(new Date(data.created_at).getTime() + etaMinutes * 6e4).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-0", children: isCancelled ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-zinc-100" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(OrderTrackingMap, { currency: data.currency, status: data.status }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-20 px-4 sm:px-6 pt-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/orders", className: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-zinc-50", "aria-label": "Back to orders", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex items-center gap-2 rounded-full bg-white shadow-md ring-1 ring-zinc-100 px-4 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-4 w-4 text-[var(--brand-clay)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wide text-zinc-500", children: "Order" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold truncate", children: [
            "#",
            data.id.slice(0, 8).toUpperCase(),
            " · ",
            data.vendor?.name ?? "Vendor"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://www.openstreetmap.org/copyright", target: "_blank", rel: "noopener noreferrer", className: "absolute bottom-1 left-1 z-10 text-[9px] bg-white/70 px-1 rounded text-zinc-600", children: "© OpenStreetMap" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),1rem)] px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md rounded-3xl bg-white shadow-[0_-12px_30px_-8px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDetailsOpen((v) => !v), className: "w-full pt-2 pb-1 grid place-items-center", "aria-label": detailsOpen ? "Collapse details" : "Expand details", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-10 rounded-full bg-zinc-200" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-bold", children: headline }),
        !isCancelled && !isDelivered && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-zinc-500 mt-0.5", children: [
          "Estimated delivery time at ",
          etaTime
        ] }),
        isDelivered && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-emerald-700 mt-0.5", children: [
          "Delivered at ",
          new Date(data.delivered_at ?? data.updated_at ?? data.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        ] })
      ] }) }),
      !isCancelled && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pt-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrderStatusTracker, { status: data.status }) }),
      data.payment_status === "unpaid" && !isCancelled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-4 mb-3 rounded-2xl bg-amber-50 p-3 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-amber-900", children: "Payment not completed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-amber-800 truncate", children: "Finish paying to confirm this order." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: payNow, disabled: paying, className: "inline-flex items-center gap-1 rounded-full bg-[var(--brand-clay)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-3.5 w-3.5" }),
          " ",
          paying ? "…" : "Pay now"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setDetailsOpen((v) => !v), className: "w-full px-5 py-2.5 flex items-center justify-between text-sm font-semibold text-zinc-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "View all details" }),
        detailsOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
      ] }),
      detailsOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 space-y-4 max-h-[55vh] overflow-y-auto", children: [
        isCancelled && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl bg-zinc-100 p-4 text-center text-sm font-semibold", children: "This order was cancelled." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2", children: "Items" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-zinc-100 rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100", children: (data.order_items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between px-4 py-2.5 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate pr-2", children: [
              it.quantity,
              "× ",
              it.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-600 font-semibold tabular-nums", children: fmt(Number(it.subtotal), data.currency) })
          ] }, it.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2", children: "Summary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3 space-y-1.5 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Subtotal", value: fmt(Number(data.subtotal), data.currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Delivery fee", value: fmt(Number(data.delivery_fee), data.currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-zinc-200 pt-2 mt-2 flex justify-between text-base font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(Number(data.total), data.currency) })
            ] })
          ] })
        ] }),
        data.delivery_address && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2", children: "Delivering to" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3", children: data.delivery_address })
        ] }),
        data.customer_note && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2", children: "Your note" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm italic rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3", children: data.customer_note })
        ] }),
        isDelivered && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "inline-flex items-center justify-center gap-2 w-full rounded-full bg-[var(--brand-clay)] py-3 text-sm font-bold text-white shadow-[0_8px_22px_-6px_rgba(255,77,77,0.6)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-4 w-4" }),
          " Order again"
        ] })
      ] })
    ] }) })
  ] });
}
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-zinc-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums", children: value })
  ] });
}
export {
  OrderDetailPage as component
};
