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
import { RefreshCcw, Plus, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const LIVE_STATUSES = new Set([
  "new",
  "awaiting_acceptance",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "assigned",
  "picked_up",
  "on_the_way",
]);

type Tab = "all" | "live" | "new" | "preparing" | "on_the_way" | "delivered" | "cancelled" | "refunded";

function AdminOrders() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState<string>("");

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,currency,created_at,vendor_id,customer_id,payment_status,delivery_address")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = orders ?? [];

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: list.length,
      live: 0,
      new: 0,
      preparing: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };
    for (const o of list) {
      if (LIVE_STATUSES.has(o.status)) c.live++;
      if ((["new", "preparing", "on_the_way", "delivered", "cancelled", "refunded"] as Tab[]).includes(o.status as Tab)) {
        c[o.status as Tab]++;
      }
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((o: any) => {
      if (tab === "live" && !LIVE_STATUSES.has(o.status)) return false;
      if (tab !== "all" && tab !== "live" && o.status !== tab) return false;
      if (search && !JSON.stringify(o).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, tab, search]);

  const stats = useMemo(() => {
    const completed = list.filter((o: any) => ["delivered", "completed"].includes(o.status));
    const cancelled = list.filter((o: any) => ["cancelled", "refunded"].includes(o.status));
    const total = completed.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const currency = (list[0]?.currency as string) || "GBP";
    return {
      currency,
      totalCount: list.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      grossSales: total,
      avgTicket: completed.length ? total / completed.length : 0,
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
            <>
              <button type="button" className={uberBtn.secondary} onClick={() => refetch()}>
                <RefreshCcw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button type="button" className={uberBtn.primary}>
                <Plus className="h-3.5 w-3.5" /> Manual order
              </button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total orders" value={isLoading ? "…" : stats.totalCount.toLocaleString()} hint="Last 200 orders" />
          <UberKpi label="Completed" value={isLoading ? "…" : stats.completedCount.toLocaleString()} hint="Delivered or fully completed" />
          <UberKpi label="Gross sales" value={isLoading ? "…" : formatMoney(stats.grossSales, stats.currency)} hint="From completed orders" />
          <UberKpi label="Cancellations" value={isLoading ? "…" : stats.cancelledCount.toLocaleString()} hint="Cancelled or refunded" />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "live", label: "Live", count: counts.live },
              { id: "new", label: "New", count: counts.new },
              { id: "preparing", label: "Preparing", count: counts.preparing },
              { id: "on_the_way", label: "On the way", count: counts.on_the_way },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
              { id: "refunded", label: "Refunded", count: counts.refunded },
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
                  <UberTd className="py-8 text-center text-neutral-500" >Loading orders…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">
                    No orders match the current filter.
                  </UberTd>
                </UberTr>
              ) : (
                filtered.map((o: any) => (
                  <UberTr key={o.id}>
                    <UberTd className="font-mono text-xs text-neutral-700">#{o.id.slice(0, 8)}</UberTd>
                    <UberTd><UberStatus status={humanise(o.status)} /></UberTd>
                    <UberTd><UberStatus status={humanise(o.payment_status ?? "pending")} /></UberTd>
                    <UberTd className="font-medium">{formatMoney(Number(o.total ?? 0), o.currency || "GBP")}</UberTd>
                    <UberTd className="max-w-[220px] truncate text-neutral-600">
                      {formatAddress(o.delivery_address)}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {new Date(o.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

function humanise(s?: string) {
  return (s || "").replaceAll("_", " ");
}
function formatAddress(a: any) {
  if (!a) return "—";
  if (typeof a === "string") return a;
  return [a.line1, a.city, a.postcode].filter(Boolean).join(", ") || "—";
}
