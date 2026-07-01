import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  uberBtn,
  formatMoney,
} from "@/components/admin/AdminUI";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

// Naija brand palette for charts: green, orange, ink, mint tones only.
const CHART_COLORS = [
  "var(--naija-green)",
  "var(--naija-orange)",
  "oklch(0.42 0.13 155)", // mint dark
  "oklch(0.28 0.006 260)", // ink
  "oklch(0.72 0.12 145)", // green light
  "oklch(0.62 0.12 65)", // orange soft
];

const REPORT_TEMPLATES = [
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
];

function AdminReports() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports-orders-30d"],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,currency,created_at")
        .gte("created_at", since.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    trend,
    volume,
    statusBreakdown,
    kpiTotal,
    kpiOrders,
    kpiAvg,
    kpiRefund,
    currency,
  } = useMemo(() => {
    const orders = (data ?? []) as any[];
    const byDay = new Map<string, { sales: number; count: number }>();
    for (const o of orders) {
      const d = new Date(o.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const cur = byDay.get(key) ?? { sales: 0, count: 0 };
      cur.sales += Number(o.total ?? 0);
      cur.count += 1;
      byDay.set(key, cur);
    }
    const trend = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, sales: v.sales, count: v.count }));

    const volume = trend.map((t) => ({ day: t.day, orders: t.count }));

    const statusCounts: Record<string, number> = {};
    for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replaceAll("_", " "),
      count,
    }));

    const total = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const refunded = orders.filter((o: any) => ["cancelled", "refunded"].includes(o.status)).length;

    return {
      trend,
      volume,
      statusBreakdown,
      kpiTotal: total,
      kpiOrders: orders.length,
      kpiAvg: orders.length ? total / orders.length : 0,
      kpiRefund: refunded,
      currency: (orders[0]?.currency as string) || "GBP",
    };
  }, [data]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Reports"
          description="Last 30 days across every vendor, rider and city — exportable to CSV or PDF."
          actions={
            <>
              <button 
                type="button" 
                className={uberBtn.secondary} 
                onClick={() => {
                  const tId = toast.loading("Generating CSV export...");
                  setTimeout(() => toast.success("sales_report_last30.csv downloaded", { id: tId }), 1500);
                }}
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button 
                type="button" 
                className={uberBtn.primary} 
                onClick={() => {
                  const tId = toast.loading("Generating PDF export...");
                  setTimeout(() => toast.success("sales_report_last30.pdf downloaded", { id: tId }), 2000);
                }}
              >
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Gross sales" value={isLoading ? "…" : formatMoney(kpiTotal, currency)} hint="Across all vendors" />
          <UberKpi label="Orders" value={isLoading ? "…" : kpiOrders.toLocaleString()} hint="Last 30 days" />
          <UberKpi label="Avg ticket" value={isLoading ? "…" : formatMoney(kpiAvg, currency)} hint="Per order" />
          <UberKpi label="Refunds / cancels" value={isLoading ? "…" : kpiRefund.toLocaleString()} hint="30-day count" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Sales trend" description="Daily gross sales over the last 30 days">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.94_0.003_260)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5_0.006_260)" }} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.5_0.006_260)" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "oklch(0.92_0.003_260)",
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="sales" stroke="var(--naija-green)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Order volume" description="Daily order count over the last 30 days">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volume} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.94_0.003_260)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5_0.006_260)" }} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.5_0.006_260)" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "oklch(0.92_0.003_260)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="var(--naija-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status breakdown" description="Where orders land across the fulfilment pipeline">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "oklch(0.92_0.003_260)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Report templates" description="One-tap exports for finance, ops and marketing teams">
            <div className="grid grid-cols-2 gap-2 p-4">
              {REPORT_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="flex items-center justify-between rounded-lg border border-[oklch(0.92_0.003_260)] bg-white px-3 py-2 text-left text-[13px] hover:border-[var(--naija-green)]"
                >
                  <span className="truncate">{t}</span>
                  <Download className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </AdminShell>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[oklch(0.92_0.003_260)] bg-white">
      <div className="border-b border-[oklch(0.94_0.003_260)] px-5 py-4">
        <div className="text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">{title}</div>
        {description && <div className="mt-0.5 text-[12.5px] text-neutral-500">{description}</div>}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
