import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, PageBody, KpiCard, Card, CardHeader, btn, formatMoney } from "@/components/admin/AdminUI";
import { TrendingUp, ShoppingBag, Store, Users, Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

const CHART_COLORS = [
  "var(--naija-green)",
  "var(--naija-orange)",
  "oklch(0.7 0.15 260)",
  "oklch(0.7 0.15 320)",
  "oklch(0.7 0.15 20)",
];

function AdminReports() {
  const { data: orders } = useQuery({
    queryKey: ["admin-reports-orders"],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("orders")
        .select("id,status,total,currency,created_at,vendor_id")
        .gte("created_at", since.toISOString())
        .limit(1000);
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const list = orders ?? [];
    const currency = (list[0]?.currency as string) || "GBP";
    const bucket = new Map<string, { day: string; sales: number; orders: number }>();
    const statusBucket = new Map<string, number>();
    list.forEach((o: any) => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const cur = bucket.get(day) ?? { day, sales: 0, orders: 0 };
      cur.sales += Number(o.total ?? 0);
      cur.orders += 1;
      bucket.set(day, cur);
      statusBucket.set(o.status, (statusBucket.get(o.status) ?? 0) + 1);
    });
    const byDay = Array.from(bucket.values()).sort((a, b) => a.day.localeCompare(b.day));
    const byStatus = Array.from(statusBucket.entries()).map(([name, value]) => ({
      name: name.replaceAll("_", " "),
      value,
    }));
    const totalSales = list
      .filter((o: any) => !["cancelled", "refunded"].includes(o.status))
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { currency, byDay, byStatus, totalSales, totalOrders: list.length };
  }, [orders]);

  return (
    <AdminShell>
      <PageHeader
        title="Reports"
        description="Sales, orders, vendors, riders, customers, payments — export in CSV or PDF."
        actions={
          <>
            <button className={btn.secondary}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button className={btn.primary}>
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Sales (30d)"
            value={formatMoney(stats.totalSales, stats.currency)}
            Icon={TrendingUp}
            accent="green"
          />
          <KpiCard label="Orders (30d)" value={stats.totalOrders} Icon={ShoppingBag} accent="orange" />
          <KpiCard label="Active stores" value="—" Icon={Store} accent="ink" />
          <KpiCard label="Repeat customers" value="—" Icon={Users} accent="green" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Sales trend" description="Daily gross sales over the last 30 days" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="var(--naija-green)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardHeader title="Order volume" description="Daily order counts" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="var(--naija-orange)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Order status breakdown" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={40}
                    label
                  >
                    {stats.byStatus.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Available report templates"
              description="One-click export of any report as CSV or PDF"
            />
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                "Sales by day",
                "Sales by store",
                "Sales by city",
                "Orders by status",
                "Top vendors",
                "Top customers",
                "Rider earnings",
                "Refunds & chargebacks",
                "Commission summary",
                "Payment method mix",
              ].map((r) => (
                <button
                  key={r}
                  className="rounded-lg border border-border bg-card px-3 py-3 text-left text-sm hover:border-[var(--naija-green)]"
                >
                  {r}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </PageBody>
    </AdminShell>
  );
}
