import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTabs,
  UberFilterBar,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  uberBtn,
  formatMoney,
} from "@/components/admin/AdminUI";
import { RefreshCcw, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

// Matches the actual order_status enum in Supabase.
const LIVE_STATUSES = new Set(["pending", "accepted", "preparing", "ready", "picked_up"]);

type Tab = "all" | "live" | "pending" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";

function AdminOrders() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState<string>("");

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,subtotal,delivery_fee,currency,created_at,customer_id,payment_status,delivery_address,vendors(name,city)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  const list = orders ?? [];

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: list.length, live: 0, pending: 0, preparing: 0, ready: 0, picked_up: 0, delivered: 0, cancelled: 0,
    };
    for (const o of list) {
      if (LIVE_STATUSES.has(o.status)) c.live++;
      if (o.status in c) c[o.status as Tab]++;
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((o: any) => {
      if (tab === "live" && !LIVE_STATUSES.has(o.status)) return false;
      if (tab !== "all" && tab !== "live" && o.status !== tab) return false;
      if (search) {
        const hay = `${o.id} ${o.status} ${o.payment_status} ${o.delivery_address ?? ""} ${o.vendors?.name ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [list, tab, search]);

  const stats = useMemo(() => {
    const completed = list.filter((o: any) => o.status === "delivered");
    const cancelled = list.filter((o: any) => o.status === "cancelled");
    const total = completed.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const currency = (list[0]?.currency as string) || "GBP";
    return {
      currency,
      totalCount: list.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      grossSales: total,
    };
  }, [list]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Orders"
          title="Orders"
          description="Real-time view of every order across vendors, riders and payment channels."
          actions={
            <button type="button" className={uberBtn.secondary} onClick={() => refetch()}>
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total orders" value={isLoading ? "…" : stats.totalCount.toLocaleString()} hint="Last 200 orders" />
          <UberKpi label="Delivered" value={isLoading ? "…" : stats.completedCount.toLocaleString()} hint="Completed deliveries" />
          <UberKpi label="Gross sales" value={isLoading ? "…" : formatMoney(stats.grossSales, stats.currency)} hint="From delivered orders" />
          <UberKpi label="Cancellations" value={isLoading ? "…" : stats.cancelledCount.toLocaleString()} hint="Cancelled orders" />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "live", label: "Live", count: counts.live },
              { id: "pending", label: "New", count: counts.pending },
              { id: "preparing", label: "Preparing", count: counts.preparing },
              { id: "ready", label: "Ready", count: counts.ready },
              { id: "picked_up", label: "On the way", count: counts.picked_up },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            ]}
          />

          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Store" }, { label: "City" }, { label: "Payment" }, { label: "Date range" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Order</UberTh>
                <UberTh>Store</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Payment</UberTh>
                <UberTh>Total</UberTh>
                <UberTh>Delivery</UberTh>
                <UberTh>Created</UberTh>
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading orders…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No orders match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((o: any) => (
                  <UberTr key={o.id}>
                    <UberTd className="font-mono text-xs text-neutral-700">#{o.id.slice(0, 8)}</UberTd>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{o.vendors?.name ?? "—"}</div>
                      <div className="text-[11px] text-neutral-500">{o.vendors?.city ?? ""}</div>
                    </UberTd>
                    <UberTd><UberStatus status={o.status} /></UberTd>
                    <UberTd><UberStatus status={o.payment_status ?? "unpaid"} /></UberTd>
                    <UberTd className="font-medium">{formatMoney(Number(o.total ?? 0), o.currency || "GBP")}</UberTd>
                    <UberTd className="max-w-[200px] truncate text-neutral-600">{o.delivery_address || "—"}</UberTd>
                    <UberTd className="text-neutral-500">
                      {new Date(o.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </UberTd>
                    <UberTd>
                      <button className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]">
                        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                      </button>
                    </UberTd>
                  </UberTr>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>
    </AdminShell>
  );
}
