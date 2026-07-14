import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, CreditCard, ChevronDown, ChevronUp, Bike, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadWallet, addWalletTxn } from "@/lib/wallet";
import { OrderStatusTracker, statusHeadlineFor } from "@/components/naija/OrderTracking";
import { LiveOrderMap } from "@/components/naija/LiveOrderMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({
  component: OrderDetailPage,
});

const fmt = (n: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Live-ish: refetch every 20s while the order is still active so the
  // status pills and map pin advance without a manual reload. Cheap.
  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), vendor:vendors(name, logo_url, city, country, prep_time_minutes, address_line)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
    refetchInterval: (q) => {
      const status = (q.state.data as any)?.status;
      if (!status || status === "delivered" || status === "cancelled") return false;
      return 20_000;
    },
  });

  // Pop the details sheet up by default on first view of an active order;
  // collapse it on Delivered/Cancelled so the map breathes.
  useEffect(() => {
    if (!data) return;
    const isActive = data.status !== "delivered" && data.status !== "cancelled";
    setDetailsOpen(isActive);
  }, [data?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const payNow = async () => {
    if (!data) return;
    const w = loadWallet();
    if (w.balance < data.total) {
      toast.error("Insufficient wallet balance. Please top up your wallet.");
      return;
    }

    setPaying(true);
    try {
      addWalletTxn({
        type: "order",
        title: "Order Payment",
        amount: -data.total,
      });

      const { error } = await supabase.rpc("mark_order_paid", { p_order_id: orderId });
      if (error) throw error;

      toast.success("Paid successfully from wallet");
      qc.invalidateQueries({ queryKey: ["order-detail", orderId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete payment");
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white grid place-items-center text-zinc-500">Loading…</div>
    );
  }
  if (!data) return null;

  const isCancelled = data.status === "cancelled";
  const isDelivered = data.status === "delivered";
  const { headline } = statusHeadlineFor(data.status);
  const etaMinutes = data.vendor?.prep_time_minutes ?? 30;
  const etaTime = new Date(new Date(data.created_at).getTime() + etaMinutes * 60_000)
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      {/* Map fills the full screen behind everything */}
      <div className="absolute inset-0 z-0">
        {isCancelled ? (
          <div className="absolute inset-0 bg-zinc-100" />
        ) : (
          <LiveOrderMap
            orderId={data.id}
            currency={data.currency}
            status={data.status}
            vendorAddress={[data.vendor?.address_line, data.vendor?.city].filter(Boolean).join(", ") || null}
            deliveryAddress={typeof data.delivery_address === "string" ? data.delivery_address : null}
          />
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-20 px-4 sm:px-6 pt-3 flex items-center gap-3">
        <Link
          to="/orders"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-zinc-50"
          aria-label="Back to orders"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 flex items-center gap-2 rounded-full bg-white shadow-md ring-1 ring-zinc-100 px-4 py-2.5">
          <Bike className="h-4 w-4 text-[var(--brand-clay)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">Order</div>
            <div className="text-sm font-semibold truncate">
              #{data.id.slice(0, 8).toUpperCase()} · {data.vendor?.name ?? "Vendor"}
            </div>
          </div>
        </div>
      </div>

      {/* OpenStreetMap attribution (required by tile usage policy) */}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-1 left-1 z-10 text-[9px] bg-white/70 px-1 rounded text-zinc-600"
      >
        © OpenStreetMap
      </a>

      {/* Floating tracking sheet — collapses/expands */}
      <div className="absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),1rem)] px-3">
        <div className="mx-auto max-w-md rounded-3xl bg-white shadow-[0_-12px_30px_-8px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100">
          {/* Drag handle */}
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="w-full pt-2 pb-1 grid place-items-center"
            aria-label={detailsOpen ? "Collapse details" : "Expand details"}
          >
            <div className="h-1 w-10 rounded-full bg-zinc-200" />
          </button>

          {/* Headline */}
          <div className="px-5 pt-2">
            <div className="text-center">
              <h2 className="font-display text-xl font-bold">{headline}</h2>
              {!isCancelled && !isDelivered && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  Estimated delivery time at {etaTime}
                </p>
              )}
              {isDelivered && (
                <p className="text-xs text-emerald-700 mt-0.5">
                  Delivered at {new Date(data.delivered_at ?? data.updated_at ?? data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          {/* Pill-shaped progress timeline */}
          {!isCancelled && (
            <div className="px-4 pt-4 pb-3">
              <OrderStatusTracker status={data.status} />
            </div>
          )}

          {/* Payment banner */}
          {data.payment_status === "unpaid" && !isCancelled && (
            <div className="mx-4 mb-3 rounded-2xl bg-amber-50 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-900">Payment not completed</p>
                <p className="text-[11px] text-amber-800 truncate">Finish paying to confirm this order.</p>
              </div>
              <button
                type="button"
                onClick={payNow}
                disabled={paying}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-clay)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5" /> {paying ? "…" : "Pay now"}
              </button>
            </div>
          )}

          {/* Toggle row */}
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-sm font-semibold text-zinc-600"
          >
            <span>View all details</span>
            {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {/* Collapsible details */}
          {detailsOpen && (
            <div className="px-5 pb-5 space-y-4 max-h-[55vh] overflow-y-auto">
              {isCancelled && (
                <div className="rounded-2xl bg-zinc-100 p-4 text-center text-sm font-semibold">
                  This order was cancelled.
                </div>
              )}

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Items</h3>
                <ul className="divide-y divide-zinc-100 rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100">
                  {(data.order_items ?? []).map((it: any) => (
                    <li key={it.id} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="truncate pr-2">
                        {it.quantity}× {it.name}
                      </span>
                      <span className="text-zinc-600 font-semibold tabular-nums">
                        {fmt(Number(it.subtotal), data.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Summary</h3>
                <div className="rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3 space-y-1.5 text-sm">
                  <Row label="Subtotal" value={fmt(Number(data.subtotal), data.currency)} />
                  <Row label="Delivery fee" value={fmt(Number(data.delivery_fee), data.currency)} />
                  <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{fmt(Number(data.total), data.currency)}</span>
                  </div>
                </div>
              </section>

              {data.delivery_address && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Delivering to</h3>
                  <p className="text-sm rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3">{data.delivery_address}</p>
                </section>
              )}

              {data.customer_note && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Your note</h3>
                  <p className="text-sm italic rounded-2xl bg-zinc-50/50 ring-1 ring-zinc-100 px-4 py-3">{data.customer_note}</p>
                </section>
              )}

              {isDelivered && (
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-[var(--brand-clay)] py-3 text-sm font-bold text-white shadow-[0_8px_22px_-6px_rgba(255,77,77,0.6)]"
                >
                  <ShoppingCart className="h-4 w-4" /> Order again
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
