import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
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
import { useState } from "react";
import { exportCsv, printHtml } from "@/lib/csv";

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
  "Refunds & cancellations",
  "Commission summary",
  "Payment method mix",
] as const;

type ReportTemplate = (typeof REPORT_TEMPLATES)[number];

function AdminReports() {
  const { region, currency: regionCurrency } = useAdminRegion();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports-orders-30d", region],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      let q = supabase
        .from("orders")
        .select("id,status,total,currency,created_at")
        .gte("created_at", since.toISOString());
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
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
      currency: regionCurrency ?? ((orders[0]?.currency as string) || "NGN"),
    };
  }, [data]);

  const [runningTemplate, setRunningTemplate] = useState<string | null>(null);

  const exportSummaryCsv = () => {
    exportCsv("sales_report_last30.csv", trend, {
      Day: "day",
      "Gross sales": (r: any) => r.sales.toFixed(2),
      Orders: "count",
    });
    toast.success("sales_report_last30.csv downloaded");
  };

  const exportSummaryPdf = () => {
    const rowsHtml = trend
      .map((t) => `<tr><td>${t.day}</td><td class="right">${formatMoney(t.sales, currency)}</td><td class="right">${t.count}</td></tr>`)
      .join("");
    const statusHtml = statusBreakdown
      .map((s) => `<tr><td>${s.status}</td><td class="right">${s.count}</td></tr>`)
      .join("");
    const ok = printHtml(
      "NaijaEats — Sales report (last 30 days)",
      `<h1>NaijaEats — Sales report</h1>
       <div class="muted">Last 30 days · Generated ${new Date().toLocaleString()}</div>
       <h2>Summary</h2>
       <table>
         <tr><th>Gross sales</th><th>Orders</th><th>Avg ticket</th><th>Refunds / cancels</th></tr>
         <tr><td>${formatMoney(kpiTotal, currency)}</td><td>${kpiOrders}</td><td>${formatMoney(kpiAvg, currency)}</td><td>${kpiRefund}</td></tr>
       </table>
       <h2>Daily sales</h2>
       <table><tr><th>Day</th><th class="right">Sales</th><th class="right">Orders</th></tr>${rowsHtml}</table>
       <h2>Status breakdown</h2>
       <table><tr><th>Status</th><th class="right">Orders</th></tr>${statusHtml}</table>`,
    );
    if (!ok) toast.error("Popup blocked — allow popups to export PDF");
  };

  const runTemplate = async (template: ReportTemplate) => {
    setRunningTemplate(template);
    const tId = toast.loading(`Building "${template}"…`);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();
      const stamp = new Date().toISOString().slice(0, 10);
      const file = (name: string) => `${name}_${stamp}.csv`;

      switch (template) {
        case "Sales by day": {
          exportCsv(file("sales_by_day"), trend, {
            Day: "day",
            Sales: (r: any) => r.sales.toFixed(2),
            Orders: "count",
          });
          break;
        }
        case "Sales by store":
        case "Top vendors":
        case "Commission summary":
        case "Sales by city": {
          let q = supabase
            .from("orders")
            .select("total,currency,status,created_at,vendors(name,city)")
            .gte("created_at", sinceIso)
            .neq("status", "cancelled");
          if (regionCurrency) q = q.eq("currency", regionCurrency);
          const { data, error } = await q;
          if (error) throw error;
          const orders = data ?? [];

          if (template === "Sales by city") {
            const byCity = new Map<string, { sales: number; orders: number }>();
            for (const o of orders as any[]) {
              const city = o.vendors?.city || "Unknown";
              const cur = byCity.get(city) ?? { sales: 0, orders: 0 };
              cur.sales += Number(o.total ?? 0);
              cur.orders += 1;
              byCity.set(city, cur);
            }
            exportCsv(
              file("sales_by_city"),
              [...byCity.entries()].map(([city, v]) => ({ city, sales: v.sales.toFixed(2), orders: v.orders })),
            );
          } else {
            const byStore = new Map<string, { sales: number; orders: number }>();
            for (const o of orders as any[]) {
              const store = o.vendors?.name || "Unknown";
              const cur = byStore.get(store) ?? { sales: 0, orders: 0 };
              cur.sales += Number(o.total ?? 0);
              cur.orders += 1;
              byStore.set(store, cur);
            }
            let rows = [...byStore.entries()]
              .map(([store, v]) => ({ store, sales: v.sales, orders: v.orders }))
              .sort((a, b) => b.sales - a.sales);
            if (template === "Top vendors") rows = rows.slice(0, 20);
            if (template === "Commission summary") {
              const { data: settings } = await supabase.from("platform_settings").select("default_commission_pct").maybeSingle();
              const pct = Number(settings?.default_commission_pct ?? 15);
              exportCsv(
                file("commission_summary"),
                rows.map((r) => ({
                  store: r.store,
                  sales: r.sales.toFixed(2),
                  commission_pct: pct,
                  commission: ((r.sales * pct) / 100).toFixed(2),
                })),
              );
            } else {
              exportCsv(file(template === "Top vendors" ? "top_vendors" : "sales_by_store"),
                rows.map((r) => ({ store: r.store, sales: r.sales.toFixed(2), orders: r.orders })));
            }
          }
          break;
        }
        case "Orders by status": {
          exportCsv(file("orders_by_status"), statusBreakdown);
          break;
        }
        case "Top customers": {
          let q = supabase
            .from("orders")
            .select("customer_id,total,currency,status,created_at")
            .gte("created_at", sinceIso)
            .neq("status", "cancelled");
          if (regionCurrency) q = q.eq("currency", regionCurrency);
          const { data, error } = await q;
          if (error) throw error;
          const byCustomer = new Map<string, { spend: number; orders: number }>();
          for (const o of (data ?? []) as any[]) {
            if (!o.customer_id) continue;
            const cur = byCustomer.get(o.customer_id) ?? { spend: 0, orders: 0 };
            cur.spend += Number(o.total ?? 0);
            cur.orders += 1;
            byCustomer.set(o.customer_id, cur);
          }
          const top = [...byCustomer.entries()].sort((a, b) => b[1].spend - a[1].spend).slice(0, 50);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .in("id", top.map(([id]) => id));
          const names = new Map((profiles ?? []).map((p: any) => [p.id, p]));
          exportCsv(
            file("top_customers"),
            top.map(([id, v]) => ({
              customer: names.get(id)?.full_name || id.slice(0, 8),
              phone: names.get(id)?.phone || "",
              spend: v.spend.toFixed(2),
              orders: v.orders,
            })),
          );
          break;
        }
        case "Rider earnings": {
          const { data, error } = await supabase
            .from("deliveries")
            .select("rider_id, fee, currency, delivered_at")
            .gte("created_at", sinceIso)
            .not("rider_id", "is", null);
          if (error) throw error;
          const byRider = new Map<string, { fees: number; deliveries: number }>();
          for (const d of (data ?? []) as any[]) {
            const cur = byRider.get(d.rider_id) ?? { fees: 0, deliveries: 0 };
            cur.fees += Number(d.fee ?? 0);
            cur.deliveries += 1;
            byRider.set(d.rider_id, cur);
          }
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", [...byRider.keys()]);
          const names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
          exportCsv(
            file("rider_earnings"),
            [...byRider.entries()].map(([id, v]) => ({
              rider: names.get(id) || id.slice(0, 8),
              deliveries: v.deliveries,
              delivery_fees: v.fees.toFixed(2),
            })),
          );
          break;
        }
        case "Refunds & cancellations": {
          let q = supabase
            .from("orders")
            .select("id,total,currency,status,payment_status,created_at")
            .gte("created_at", sinceIso)
            .or("status.eq.cancelled,payment_status.eq.refunded");
          if (regionCurrency) q = q.eq("currency", regionCurrency);
          const { data, error } = await q;
          if (error) throw error;
          exportCsv(
            file("refunds_cancellations"),
            ((data ?? []) as any[]).map((o) => ({
              order: o.id,
              status: o.status,
              payment_status: o.payment_status,
              total: o.total,
              currency: o.currency,
              created: o.created_at,
            })),
          );
          break;
        }
        case "Payment method mix": {
          const { data, error } = await supabase
            .from("payments")
            .select("provider, status, amount, currency, created_at")
            .gte("created_at", sinceIso);
          if (error) throw error;
          const byProvider = new Map<string, { count: number; volume: number }>();
          for (const p of (data ?? []) as any[]) {
            const key = `${p.provider} (${p.status})`;
            const cur = byProvider.get(key) ?? { count: 0, volume: 0 };
            cur.count += 1;
            cur.volume += Number(p.amount ?? 0);
            byProvider.set(key, cur);
          }
          exportCsv(
            file("payment_method_mix"),
            [...byProvider.entries()].map(([provider, v]) => ({
              provider,
              transactions: v.count,
              volume: v.volume.toFixed(2),
            })),
          );
          break;
        }
      }
      toast.success(`"${template}" exported`, { id: tId });
    } catch (err: any) {
      toast.error(err.message || `Failed to build "${template}"`, { id: tId });
    } finally {
      setRunningTemplate(null);
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Analytics"
          title="Reports"
          description="Last 30 days across every vendor, rider and city — exportable to CSV or PDF."
          actions={
            <>
              <button type="button" className={uberBtn.secondary} onClick={exportSummaryCsv}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button type="button" className={uberBtn.primary} onClick={exportSummaryPdf}>
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

          <ChartCard title="Report templates" description="One-tap CSV exports for finance, ops and marketing teams">
            <div className="grid grid-cols-2 gap-2 p-4">
              {REPORT_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => runTemplate(t)}
                  disabled={runningTemplate !== null}
                  className="flex items-center justify-between rounded-lg border border-[oklch(0.92_0.003_260)] bg-white px-3 py-2 text-left text-[13px] hover:border-[var(--naija-green)] disabled:opacity-50"
                >
                  <span className="truncate">{runningTemplate === t ? "Building…" : t}</span>
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
