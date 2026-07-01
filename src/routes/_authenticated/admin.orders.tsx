import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  PageBody,
  KpiCard,
  Card,
  CardHeader,
  FilterBar,
  StatusBadge,
  TableWrap,
  Thead,
  Th,
  Tr,
  Td,
  formatMoney,
  EmptyState,
  btn,
} from "@/components/admin/AdminUI";
import { ClipboardList, TrendingUp, XCircle, Clock, RefreshCcw, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

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

function AdminOrders() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data: orders, isLoading } = useQuery({
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

  const filtered = useMemo(() => {
    const list = orders ?? [];
    return list.filter((o: any) => {
      if (tab === "live" && !LIVE_STATUSES.has(o.status)) return false;
      if (tab !== "all" && tab !== "live" && o.status !== tab) return false;
      if (search && !JSON.stringify(o).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, tab, search]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const total = list.length;
    const live = list.filter((o: any) => LIVE_STATUSES.has(o.status)).length;
    const cancelled = list.filter((o: any) => o.status === "cancelled").length;
    const revenue = list
      .filter((o: any) => !["cancelled", "refunded"].includes(o.status))
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const currency = (list[0]?.currency as string) ?? "GBP";
    return { total, live, cancelled, revenue, currency };
  }, [orders]);

  return (
    <AdminShell>
      <PageHeader
        title="Orders"
        description="Monitor every order across the platform. Search, filter, refund, reassign or contact any party."
        actions={
          <>
            <button type="button" className={btn.secondary}>
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" className={btn.primary}>
              Manual order
            </button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total orders" value={stats.total} Icon={ClipboardList} accent="green" />
          <KpiCard label="Live orders" value={stats.live} Icon={Clock} accent="orange" />
          <KpiCard label="Cancelled" value={stats.cancelled} Icon={XCircle} accent="ink" />
          <KpiCard
            label="Revenue (excl. refunds)"
            value={formatMoney(stats.revenue, stats.currency)}
            Icon={TrendingUp}
            accent="green"
          />
        </div>

        <div className="mt-6">
          <Card>
            <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    tab === t.key
                      ? "bg-[var(--naija-green)]/10 text-[var(--naija-green)] font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              <FilterBar
                onSearch={setSearch}
                filters={[
                  { label: "Store" },
                  { label: "City" },
                  { label: "Payment method" },
                  { label: "Date range" },
                ]}
              />

              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading orders…</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No orders match your filters"
                  description="Try widening your date range or clearing filters."
                />
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Order</Th>
                      <Th>Status</Th>
                      <Th>Payment</Th>
                      <Th>Total</Th>
                      <Th>Delivery</Th>
                      <Th>Created</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map((o: any) => (
                      <Tr key={o.id}>
                        <Td className="font-mono text-xs">#{o.id.slice(0, 8)}</Td>
                        <Td>
                          <StatusBadge status={humanise(o.status)} />
                        </Td>
                        <Td>
                          <StatusBadge status={o.payment_status || "pending"} />
                        </Td>
                        <Td className="font-medium">
                          {formatMoney(Number(o.total ?? 0), o.currency || "GBP")}
                        </Td>
                        <Td className="text-muted-foreground max-w-[220px] truncate">
                          {typeof o.delivery_address === "string"
                            ? o.delivery_address
                            : o.delivery_address?.line1 ?? "—"}
                        </Td>
                        <Td className="text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </Td>
                        <Td className="text-right">
                          <button className="rounded-md p-1.5 hover:bg-muted" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </div>
          </Card>
        </div>
      </PageBody>
    </AdminShell>
  );
}

function humanise(s: string) {
  return (s || "").replaceAll("_", " ");
}
