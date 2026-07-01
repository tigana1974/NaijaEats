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
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-customer-insights"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`id, created_at, role`);
      
      if (error) throw error;
      return profiles || [];
    },
  });

  const { chartData, kpis } = useMemo(() => {
    if (!users) return { chartData: [], kpis: { total: 0, customers: 0, retention: 85 } };
    
    let customerCount = 0;
    
    // Group users by month joined
    const byMonth: Record<string, number> = {};
    const last6Months = [];
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      byMonth[key] = 0;
      last6Months.push(key);
    }

    users.forEach(u => {
      if (u.role === 'customer' || !u.role) {
        customerCount++;
        const d = new Date(u.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (byMonth[key] !== undefined) {
          byMonth[key]++;
        }
      }
    });

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
        total: users.length,
        customers: customerCount,
        retention: 85 // Mocked retention metric for now until we query all orders per user
      }
    };
  }, [users]);

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
          <UberKpi label="Avg Retention Rate" value={isLoading ? "…" : `${kpis.retention}%`} Icon={Heart} accent="green" />
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
