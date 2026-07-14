import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useRiderOnline, useRiderVerification } from "@/hooks/useRiderStatus";
import { RiderVerificationBanner, RiderVerifiedBadge } from "@/components/naija/RiderVerificationBanner";
import { RiderDeliveryMap, RiderNavigationOverlay } from "@/components/naija/RiderDeliveryMap";
import { useState } from "react";
import { usePublishRiderLocation } from "@/hooks/useRiderLocation";
import { toast } from "sonner";
import { MapPin, Navigation, ChefHat } from "lucide-react";
import {
  PiMopedDuotone,
  PiPackageDuotone,
  PiCheckCircleDuotone,
  PiWalletDuotone,
  PiFilesDuotone,
  PiChartLineUpDuotone,
} from "react-icons/pi";

export const Route = createFileRoute("/_authenticated/rider/dashboard")({
  component: RiderDashboard,
});

function RiderDashboard() {
  const qc = useQueryClient();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const [online, setOnline] = useRiderOnline();
  const verification = useRiderVerification(role === "rider");

  const { data, isLoading } = useQuery({
    queryKey: ["rider-dashboard"],
    // Keeps the active card in step with vendor-side changes (e.g. the order
    // flipping to "ready") without the rider having to refresh.
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const [{ data: active }, { data: today }, { data: completed }] = await Promise.all([
        supabase
          .from("deliveries")
          .select("*, orders(*, order_items(name, quantity), vendors(name, address_line, city))")
          .eq("rider_id", uid)
          .in("status", ["assigned", "picked_up"])
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("deliveries")
          .select("fee, currency, delivered_at")
          .eq("rider_id", uid)
          .eq("status", "delivered")
          .gte("delivered_at", startOfToday()),
        supabase
          .from("deliveries")
          .select("id")
          .eq("rider_id", uid)
          .eq("status", "delivered"),
      ]);
      const earnings = (today ?? []).reduce((s, d) => s + Number(d.fee || 0), 0);
      const currency = (today ?? [])[0]?.currency ?? "NGN";
      return {
        active: (active ?? [])[0] ?? null,
        earningsToday: earnings,
        currency,
        deliveriesToday: today?.length ?? 0,
        totalDeliveries: completed?.length ?? 0,
      };
    },
  });

  // Stream GPS onto the active delivery so the customer sees the driver move.
  usePublishRiderLocation(data?.active?.id ?? null);

  const advance = async (delivery: any, status: "picked_up" | "delivered") => {
    // The DB only lets riders move an order ready→picked_up, so confirming
    // pickup while the vendor is still cooking would strand the order status.
    if (status === "picked_up" && delivery.orders && delivery.orders.status !== "ready") {
      toast.error("The vendor hasn't marked this order as ready yet. Hang on a moment.");
      return;
    }
    const patch: any = { status };
    if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("deliveries").update(patch).eq("id", delivery.id);
    if (error) return toast.error(error.message);
    // Push the order along too so customer tracking stays truthful.
    const orderPatch: any = { status: status === "delivered" ? "delivered" : "picked_up" };
    if (status === "delivered") orderPatch.delivered_at = new Date().toISOString();
    const { error: orderErr } = await supabase.from("orders").update(orderPatch).eq("id", delivery.order_id);
    if (orderErr) toast.error(`Delivery updated, but the order status didn't sync: ${orderErr.message}`);
    else toast.success(status === "delivered" ? "Delivery complete — payout credited" : "Picked up. Safe ride!");
    qc.invalidateQueries({ queryKey: ["rider-dashboard"] });
    qc.invalidateQueries({ queryKey: ["rider-earnings"] });
  };

  const symbol = data?.currency === "GBP" ? "£" : "₦";

  if (!roleLoading && role !== "rider") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold">Rider hub</h1>
              {verification.status === "verified" && <RiderVerifiedBadge />}
            </div>
            <p className="text-muted-foreground mt-1">Pick up. Drop off. Get paid.</p>
          </div>
          <button
            onClick={() => setOnline(!online)}
            className={`rounded-full px-5 py-2.5 font-semibold inline-flex items-center gap-2 transition-all duration-200 ${
              online
                ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                : "bg-muted text-foreground ring-1 ring-border hover:ring-green-600/40"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${online ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
            {online ? "Online" : "Offline"}
          </button>
        </div>

        <div className="mt-6">
          <RiderVerificationBanner verification={verification} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Earnings today" value={`${symbol}${(data?.earningsToday ?? 0).toLocaleString()}`} Icon={PiWalletDuotone} tone="green" />
          <Stat label="Deliveries today" value={data?.deliveriesToday ?? 0} Icon={PiPackageDuotone} tone="clay" />
          <Stat label="Total deliveries" value={data?.totalDeliveries ?? 0} Icon={PiCheckCircleDuotone} tone="blue" />
        </div>

        {/* Active delivery */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Active delivery</h2>
          {isLoading ? (
            <p className="mt-2 text-muted-foreground">Loading…</p>
          ) : !data?.active ? (
            <div className="mt-3 rounded-2xl border border-border bg-card p-6 text-center">
              <PiMopedDuotone className="h-9 w-9 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No active delivery.</p>
              {online ? (
                <Link to="/rider/available" className="mt-4 inline-block rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold">
                  Find a job
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">Go online to receive jobs.</p>
              )}
            </div>
          ) : (
            <ActiveCard delivery={data.active} symbol={symbol} onAdvance={advance} />
          )}
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <QuickLink to="/rider/available" Icon={PiPackageDuotone} title="Available jobs" desc="Browse pickups nearby." />
          <QuickLink to="/rider/earnings" Icon={PiChartLineUpDuotone} title="Earnings" desc="View your payouts." />
          <QuickLink to="/rider/documents" Icon={PiFilesDuotone} title="Documents" desc="Upload for verification." />
        </div>
      </div>
    </AppShell>
  );
}

function ActiveCard({ delivery, symbol, onAdvance }: { delivery: any; symbol: string; onAdvance: (d: any, s: "picked_up" | "delivered") => void }) {
  const phase = delivery.status === "assigned" ? "to_pickup" : "to_dropoff";
  // In-app navigation overlay target (null = closed).
  const [navTarget, setNavTarget] = useState<{ address: string; label: string } | null>(null);
  const order = delivery.orders;
  const vendor = order?.vendors;
  const items: { name: string; quantity: number }[] = order?.order_items ?? [];
  const pickupAddress = delivery.pickup_address || [vendor?.address_line, vendor?.city].filter(Boolean).join(", ");
  const dropoffAddress = delivery.dropoff_address || order?.delivery_address || "";
  const orderReady = !order || order.status === "ready" || order.status === "picked_up" || order.status === "delivered";

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground">Order #{delivery.order_id.slice(0, 8)}</div>
          <div className="font-display text-xl font-semibold mt-1">
            Earn {symbol}{Number(delivery.fee).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {delivery.status === "assigned" && (
            <span className={`text-xs rounded-full px-2.5 py-1 font-medium inline-flex items-center gap-1 ${
              orderReady ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
            }`}>
              <ChefHat className="h-3 w-3" />
              {orderReady ? "Ready for pickup" : `Vendor ${order?.status ?? "preparing"}`}
            </span>
          )}
          <span className="text-xs rounded-full px-2 py-0.5 bg-muted capitalize">{delivery.status.replace("_", " ")}</span>
        </div>
      </div>

      {pickupAddress && dropoffAddress && (
        <div className="mt-4">
          <RiderDeliveryMap
            pickupAddress={pickupAddress}
            dropoffAddress={dropoffAddress}
            phase={phase}
            country={delivery.currency === "GBP" ? "UK" : "NG"}
          />
        </div>
      )}

      <ol className="mt-4 space-y-3 text-sm">
        <li className="flex gap-3 items-start">
          <MapPin className={`h-5 w-5 mt-0.5 shrink-0 ${phase === "to_pickup" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}`} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Pickup{vendor?.name ? ` · ${vendor.name}` : ""}</div>
            <div className="text-muted-foreground">{pickupAddress || "—"}</div>
          </div>
          {pickupAddress && phase === "to_pickup" && (
            <button
              type="button"
              onClick={() => setNavTarget({ address: pickupAddress, label: `Pickup${vendor?.name ? ` · ${vendor.name}` : ""}` })}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              <Navigation className="h-3 w-3" /> Navigate
            </button>
          )}
        </li>
        <li className="flex gap-3 items-start">
          <MapPin className={`h-5 w-5 mt-0.5 shrink-0 ${phase === "to_dropoff" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}`} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Drop-off</div>
            <div className="text-muted-foreground">{dropoffAddress || "—"}</div>
          </div>
          {dropoffAddress && phase === "to_dropoff" && (
            <button
              type="button"
              onClick={() => setNavTarget({ address: dropoffAddress, label: "Drop-off" })}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              <Navigation className="h-3 w-3" /> Navigate
            </button>
          )}
        </li>
      </ol>

      {items.length > 0 && (
        <div className="mt-4 rounded-xl bg-muted/40 p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What you're carrying</div>
          <ul className="mt-1.5 space-y-0.5 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{it.name}</span>
                <span className="text-muted-foreground shrink-0">×{it.quantity}</span>
              </li>
            ))}
          </ul>
          {order?.customer_note && (
            <p className="mt-2 text-xs text-muted-foreground border-t border-border/60 pt-2">
              Note from customer: {order.customer_note}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {delivery.status === "assigned" && (
          <button
            onClick={() => onAdvance(delivery, "picked_up")}
            disabled={!orderReady}
            className="flex-1 rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orderReady ? "Confirm pickup" : "Waiting for vendor…"}
          </button>
        )}
        {delivery.status === "picked_up" && (
          <button onClick={() => onAdvance(delivery, "delivered")} className="flex-1 rounded-lg bg-green-600 text-white py-2.5 font-semibold">
            Mark delivered
          </button>
        )}
      </div>

      {navTarget && (
        <RiderNavigationOverlay
          targetAddress={navTarget.address}
          targetLabel={navTarget.label}
          country={delivery.currency === "GBP" ? "UK" : "NG"}
          onClose={() => setNavTarget(null)}
        />
      )}
    </div>
  );
}

const statTones = {
  clay: "bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)]",
  green: "bg-[oklch(0.95_0.04_145)] text-[oklch(0.52_0.16_145)]",
  blue: "bg-[oklch(0.95_0.03_250)] text-[oklch(0.55_0.15_250)]",
} as const;

function Stat({ label, value, Icon, tone = "clay" }: { label: string; value: string | number; Icon: React.ComponentType<{ className?: string }>; tone?: keyof typeof statTones }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${statTones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2.5 font-display text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function QuickLink({ to, Icon, title, desc }: { to: string; Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:border-[var(--brand-clay)]/30 hover:-translate-y-0.5 flex gap-3 items-center"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)] transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
