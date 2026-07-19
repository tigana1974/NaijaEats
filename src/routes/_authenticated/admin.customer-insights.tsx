// @ts-nocheck
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
} from "@/components/admin/AdminUI";
import { Users, Heart, ArrowUpRight, ShieldCheck, UserCheck } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/customer-insights")({
  component: AdminCustomerInsights,
});

function AdminCustomerInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer-insights"],
    staleTime: 60_000,
    queryFn: async () => {
      const [profilesRes, rolesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("orders").select("customer_id, status"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      return {
        profiles: profilesRes.data ?? [],
        roles: rolesRes.data ?? [],
        orders: ordersRes.data ?? [],
      };
    },
  });

  const { chartData, kpis } = useMemo(() => {
    if (!data) return { chartData: [], kpis: { total: 0, customers: 0, retention: 0 } };
    const { profiles, roles, orders } = data;

    // A "customer" is anyone without a staff/vendor/rider role.
    const nonCustomerIds = new Set(
      roles.filter((r: any) => r.role !== "customer").map((r: any) => r.user_id),
    );

    let customerCount = 0;

    // Group users by month joined
    const byMonth: Record<string, number> = {};
    const last6Months: string[] = [];
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      byMonth[key] = 0;
      last6Months.push(key);
    }

    profiles.forEach((u: any) => {
      if (!nonCustomerIds.has(u.id)) {
        customerCount++;
        const d = new Date(u.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (byMonth[key] !== undefined) {
          byMonth[key]++;
        }
      }
    });

    // Retention = share of ordering customers who came back for a 2nd order.
    const orderCounts = new Map<string, number>();
    for (const o of orders as any[]) {
      if (!o.customer_id || o.status === "cancelled") continue;
      orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) ?? 0) + 1);
    }
    const ordering = orderCounts.size;
    const repeat = [...orderCounts.values()].filter((c) => c >= 2).length;

    const plot = last6Months.map(month => {
      const [y, m] = month.split('-');
      const date = new Date(Number(y), Number(m)-1, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      return {
        month: monthName,
        signups: byMonth[month]
      };
    });

    return {
      chartData: plot,
      kpis: {
        total: profiles.length,
        customers: customerCount,
        retention: ordering > 0 ? Math.round((repeat / ordering) * 100) : 0,
      }
    };
  }, [data]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Customer Insights"
          description="User acquisition, retention, and growth metrics."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <UberKpi label="Total Platform Users" value={isLoading ? "…" : kpis.total} Icon={Users} accent="blue" />
          <UberKpi label="Total Customers" value={isLoading ? "…" : kpis.customers} Icon={UserCheck} />
          <UberKpi label="Repeat Order Rate" value={isLoading ? "…" : `${kpis.retention}%`} Icon={Heart} accent="green" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-brand-core" />
              New Customer Signups (Last 6 Months)
            </h3>
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f5f5f5' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="signups" fill="#1e40af" radius={[4, 4, 0, 0]} />
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
