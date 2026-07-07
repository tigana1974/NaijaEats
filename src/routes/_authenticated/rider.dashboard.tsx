import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
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
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("rider_online") === "true";
  });
  useEffect(() => {
    localStorage.setItem("rider_online", String(online));
  }, [online]);

  const { data, isLoading } = useQuery({
    queryKey: ["rider-dashboard"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const [{ data: active }, { data: today }, { data: completed }] = await Promise.all([
        supabase
          .from("deliveries")
          .select("*, orders(*)")
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

  const advance = async (id: string, status: "picked_up" | "delivered") => {
    const patch: any = { status };
    if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("deliveries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    // Also push order status
    const orderStatus = status === "delivered" ? "delivered" : "picked_up";
    const { data: d } = await supabase.from("deliveries").select("order_id").eq("id", id).maybeSingle();
    if (d?.order_id) {
      const orderPatch: any = { status: orderStatus };
      if (status === "delivered") orderPatch.delivered_at = new Date().toISOString();
      await supabase.from("orders").update(orderPatch).eq("id", d.order_id);
    }
    toast.success(status === "delivered" ? "Delivery complete" : "Picked up");
    qc.invalidateQueries({ queryKey: ["rider-dashboard"] });
  };

  const symbol = data?.currency === "GBP" ? "£" : "₦";

  if (!roleLoading && role !== "rider") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold">Rider hub</h1>
            <p className="text-muted-foreground mt-1">Pick up. Drop off. Get paid.</p>
          </div>
          <button
            onClick={() => setOnline((v) => !v)}
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

function ActiveCard({ delivery, symbol, onAdvance }: { delivery: any; symbol: string; onAdvance: (id: string, s: "picked_up" | "delivered") => void }) {
  const phase = delivery.status === "assigned" ? "to_pickup" : "to_dropoff";
  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground">Order #{delivery.order_id.slice(0, 8)}</div>
          <div className="font-display text-xl font-semibold mt-1">
            Earn {symbol}{Number(delivery.fee).toLocaleString()}
          </div>
        </div>
        <span className="text-xs rounded-full px-2 py-0.5 bg-muted capitalize">{delivery.status}</span>
      </div>
      <ol className="mt-4 space-y-3 text-sm">
        <li className="flex gap-3">
          <MapPin className={`h-5 w-5 mt-0.5 ${phase === "to_pickup" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}`} />
          <div>
            <div className="font-semibold">Pickup</div>
            <div className="text-muted-foreground">{delivery.pickup_address || "—"}</div>
          </div>
        </li>
        <li className="flex gap-3">
          <MapPin className={`h-5 w-5 mt-0.5 ${phase === "to_dropoff" ? "text-[var(--brand-clay)]" : "text-muted-foreground"}`} />
          <div>
            <div className="font-semibold">Drop-off</div>
            <div className="text-muted-foreground">{delivery.dropoff_address || delivery.orders?.delivery_address || "—"}</div>
          </div>
        </li>
      </ol>
      <div className="mt-5 flex gap-2">
        {delivery.status === "assigned" && (
          <button onClick={() => onAdvance(delivery.id, "picked_up")} className="flex-1 rounded-lg bg-[var(--brand-clay)] text-[var(--brand-cream)] py-2.5 font-semibold">
            Confirm pickup
          </button>
        )}
        {delivery.status === "picked_up" && (
          <button onClick={() => onAdvance(delivery.id, "delivered")} className="flex-1 rounded-lg bg-green-600 text-white py-2.5 font-semibold">
            Mark delivered
          </button>
        )}
      </div>
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