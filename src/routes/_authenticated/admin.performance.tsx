// @ts-nocheck
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
import {
  UberPageTitle,
  UberKpi,
  formatMoney,
} from "@/components/admin/AdminUI";
import { TrendingUp, CheckCircle2, XCircle, Clock, Calendar, BarChart3, Activity } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/performance")({
  component: AdminPerformance,
});

function AdminPerformance() {
  const { region, currency: regionCurrency, symbol } = useAdminRegion();
  const perfCurrency = regionCurrency ?? "NGN";
  const [days, setDays] = useState(30);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-performance-orders", days, region],
    staleTime: 60_000,
    queryFn: async () => {
      const past = new Date();
      past.setDate(past.getDate() - days);
      let q = supabase
        .from("orders")
        .select("id, total, currency, status, created_at, vendor_id")
        .gte("created_at", past.toISOString());
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { chartData, kpis } = useMemo(() => {
    if (!orders) return { chartData: [], kpis: { gmv: 0, count: 0, cancelRate: 0, completeRate: 0 } };
    
    let gmv = 0;
    let cancelled = 0;
    let completed = 0;

    // Group by day for the chart
    const byDay: Record<string, { date: string; gmv: number; orders: number }> = {};
    
    // Initialize last N days to 0
    for(let i=days-1; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      byDay[key] = { date: key, gmv: 0, orders: 0 };
    }

    orders.forEach(o => {
      const key = new Date(o.created_at).toISOString().split('T')[0];
      
      if (o.status !== 'cancelled' && o.status !== 'rejected') {
        gmv += Number(o.total || 0);
        if (byDay[key]) {
          byDay[key].gmv += Number(o.total || 0);
          byDay[key].orders += 1;
        }
      }

      if (o.status === 'cancelled' || o.status === 'rejected') cancelled++;
      if (o.status === 'delivered') completed++;
    });

    return {
      chartData: Object.values(byDay),
      kpis: {
        gmv,
        count: orders.length,
        cancelRate: orders.length ? (cancelled / orders.length) * 100 : 0,
        completeRate: orders.length ? (completed / orders.length) * 100 : 0,
      }
    };
  }, [orders, days]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Platform Performance"
          description="High-level metrics across all vendors, riders, and customers."
          actions={
            <select 
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 outline-none"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Gross Merchandise Value" value={isLoading ? "…" : formatMoney(kpis.gmv, perfCurrency)} Icon={TrendingUp} accent="green" />
          <UberKpi label="Total Orders" value={isLoading ? "…" : kpis.count} Icon={Activity} />
          <UberKpi label="Completion Rate" value={isLoading ? "…" : `${kpis.completeRate.toFixed(1)}%`} Icon={CheckCircle2} accent="green" />
          <UberKpi label="Cancellation Rate" value={isLoading ? "…" : `${kpis.cancelRate.toFixed(1)}%`} Icon={XCircle} accent="red" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* GMV Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-core" />
              Revenue Over Time
            </h3>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#008751" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#008751" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.substring(5)} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${symbol}${(v/1000)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatMoney(value, perfCurrency), "Revenue"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="gmv" stroke="#008751" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Volume Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-neutral-600" />
              Order Volume
            </h3>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.substring(5)} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: number) => [value, "Orders"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f5f5f5' }}
                    />
                    <Bar dataKey="orders" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
