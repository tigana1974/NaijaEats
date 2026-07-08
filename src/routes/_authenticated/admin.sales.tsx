import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  formatMoney,
} from "@/components/admin/AdminUI";
import { DollarSign, Store, ShoppingBasket, ChefHat, BarChart3, PieChart } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/sales")({
  component: AdminSales,
});

const COLORS = ['#1e40af', '#008751', '#f59e0b', '#ef4444', '#8b5cf6'];

function AdminSales() {
  const [days, setDays] = useState(30);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-sales-orders", days],
    staleTime: 60_000,
    queryFn: async () => {
      const past = new Date();
      past.setDate(past.getDate() - days);
      // Fetch orders alongside vendor details
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, total, created_at, status,
          vendors (type)
        `)
        .gte("created_at", past.toISOString())
        .in('status', ['delivered', 'accepted', 'preparing', 'ready', 'picked_up']);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { typeChart, timeChart, kpis } = useMemo(() => {
    if (!orders) return { typeChart: [], timeChart: [], kpis: { rest: 0, groc: 0, chef: 0 } };
    
    const byType: Record<string, number> = { restaurant: 0, grocery: 0, chef: 0 };
    const byHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) byHour[i] = 0;

    orders.forEach(o => {
      const amount = Number(o.total || 0);
      const vtype = (o.vendors as any)?.type || 'restaurant';
      
      // Group by type
      if (vtype === 'restaurant') byType.restaurant += amount;
      else if (vtype === 'grocery') byType.grocery += amount;
      else byType.chef += amount;

      // Group by hour
      const hour = new Date(o.created_at).getHours();
      byHour[hour] += amount;
    });

    const typeData = [
      { name: 'Restaurants', value: byType.restaurant },
      { name: 'Groceries', value: byType.grocery },
      { name: 'Chefs', value: byType.chef },
    ].filter(d => d.value > 0); // Only show non-zero

    const timeData = Object.keys(byHour).map(hour => ({
      hour: `${hour.padStart(2, '0')}:00`,
      sales: byHour[Number(hour)]
    }));

    return {
      typeChart: typeData,
      timeChart: timeData,
      kpis: byType
    };
  }, [orders]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Sales Breakdown"
          description="Revenue distribution by vendor category and time of day."
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <UberKpi label="Restaurant Sales" value={isLoading ? "…" : formatMoney(kpis.rest, "NGN")} Icon={Store} accent="blue" />
          <UberKpi label="Grocery Sales" value={isLoading ? "…" : formatMoney(kpis.groc, "NGN")} Icon={ShoppingBasket} accent="green" />
          <UberKpi label="Chef Sales" value={isLoading ? "…" : formatMoney(kpis.chef, "NGN")} Icon={ChefHat} accent="orange" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Pie Chart: Sales by Type */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-neutral-600" />
              Sales by Category
            </h3>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : typeChart.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">No sales data found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={typeChart}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatMoney(val, "NGN")} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bar Chart: Sales by Time of Day */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-core" />
              Sales by Time of Day
            </h3>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="hour" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v/1000)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatMoney(value, "NGN"), "Sales"]}
                      cursor={{ fill: '#f5f5f5' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#008751" radius={[4, 4, 0, 0]} />
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
