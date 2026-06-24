import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const CHART_COLORS = ["#E86A2C", "#2A1810", "#5B7C4A", "#F4B942"];

function AdminReports() {
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    enabled: role === "admin",
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("id,status,total,currency,vendor_id,created_at,vendors(name)")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return orders ?? [];
    },
  });

  const currencies = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((o: any) => set.add(o.currency));
    return Array.from(set);
  }, [data]);

  const revenueByDay = useMemo(() => {
    const byDay: Record<string, Record<string, number>> = {};
    (data ?? []).forEach((o: any) => {
      if (o.status === "cancelled") return;
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      byDay[day] ||= {};
      byDay[day][o.currency] = (byDay[day][o.currency] ?? 0) + Number(o.total || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, byCurrency]) => ({
        day: new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        ...byCurrency,
      }));
  }, [data]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    (data ?? []).forEach((o: any) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: STATUS_LABEL[status] ?? status,
      count,
    }));
  }, [data]);

  const topVendors = useMemo(() => {
    const byVendor: Record<string, { name: string; revenue: Record<string, number>; orders: number }> = {};
    (data ?? []).forEach((o: any) => {
      if (o.status === "cancelled") return;
      byVendor[o.vendor_id] ||= { name: o.vendors?.name ?? "Unknown vendor", revenue: {}, orders: 0 };
      byVendor[o.vendor_id].orders++;
      byVendor[o.vendor_id].revenue[o.currency] =
        (byVendor[o.vendor_id].revenue[o.currency] ?? 0) + Number(o.total || 0);
    });
    return Object.values(byVendor)
      .sort((a, b) => Object.values(b.revenue).reduce((s, n) => s + n, 0) - Object.values(a.revenue).reduce((s, n) => s + n, 0))
      .slice(0, 8);
  }, [data]);

  const totals = useMemo(() => {
    const revenue: Record<string, number> = {};
    let orderCount = 0;
    let cancelled = 0;
    (data ?? []).forEach((o: any) => {
      orderCount++;
      if (o.status === "cancelled") {
        cancelled++;
        return;
      }
      revenue[o.currency] = (revenue[o.currency] ?? 0) + Number(o.total || 0);
    });
    return { revenue, orderCount, cancelled };
  }, [data]);

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Sales & performance</h1>
        <p className="text-muted-foreground mb-6">Last 30 days across the platform.</p>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No orders in the last 30 days.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {Object.entries(totals.revenue).map(([currency, amount]) => (
                <div key={currency} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4" /> Revenue ({currency})
                  </div>
                  <div className="mt-2 text-2xl font-display font-semibold">
                    {currency} {amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="text-muted-foreground text-sm">Orders (30d)</div>
                <div className="mt-2 text-2xl font-display font-semibold">{totals.orderCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="text-muted-foreground text-sm">Cancellation rate</div>
                <div className="mt-2 text-2xl font-display font-semibold">
                  {totals.orderCount > 0 ? ((totals.cancelled / totals.orderCount) * 100).toFixed(1) : "0"}%
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold mb-4">Revenue over time</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {currencies.map((c, i) => (
                        <Line
                          key={c}
                          type="monotone"
                          dataKey={c}
                          name={c}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold mb-4">Orders by status</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--brand-clay)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <h2 className="font-display text-lg font-semibold p-5 pb-3">Top vendors by revenue</h2>
              <div className="divide-y divide-border">
                {topVendors.map((v, i) => (
                  <div key={v.name + i} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" /> {v.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{v.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right shrink-0">
                      {Object.entries(v.revenue)
                        .map(([c, amount]) => `${c} ${(amount as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
                        .join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
