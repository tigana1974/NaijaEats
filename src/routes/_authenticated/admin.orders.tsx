import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
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
import { RefreshCcw, Plus, MoreHorizontal, CheckCircle, Ban, XCircle, RotateCcw } from "lucide-react";
import { exportCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

// Must match the order_status enum in the database.
const LIVE_STATUSES = new Set([
  "pending",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
]);

type Tab = "all" | "live" | "pending" | "accepted" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";

function AdminOrders() {
  const qc = useQueryClient();
  const { region, currency: regionCurrency, countryLabel } = useAdminRegion();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Vendors for the manual-order picker.
  const { data: vendorOptions } = useQuery({
    queryKey: ["admin-orders-vendor-options", region],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("vendors").select("id,name,currency").eq("status", "approved").order("name");
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const manualOrderMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const vendor = (vendorOptions ?? []).find((v: any) => v.id === formData.vendor_id);
      if (!vendor) throw new Error("Select a vendor");

      const total = Number(formData.total);
      if (!Number.isFinite(total) || total <= 0) throw new Error("Enter a valid total");

      // Parse "2x Jollof Rice" lines into order items.
      const lines = String(formData.items || "")
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean);
      const items = lines.map((line: string) => {
        const m = line.match(/^(\d+)\s*[xX]\s*(.+)$/);
        return { quantity: m ? Number(m[1]) : 1, name: m ? m[2].trim() : line };
      });
      if (items.length === 0) throw new Error("Add at least one item");
      const perItem = total / items.reduce((s: number, i: any) => s + i.quantity, 0);

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: u.user.id, // recorded against the admin who keyed it in
          vendor_id: vendor.id,
          status: "pending",
          subtotal: total,
          delivery_fee: 0,
          total,
          currency: formData.currency || vendor.currency || "NGN",
          customer_note: `Manual order (phone) — customer: ${formData.customer_phone}`,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i: any) => ({
          order_id: order.id,
          name: i.name,
          quantity: i.quantity,
          price: Number(perItem.toFixed(2)),
          subtotal: Number((perItem * i.quantity).toFixed(2)),
        })) as any,
      );
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      toast.success("Manual order created");
      setIsManualOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to create order: ${err.message}`);
    }
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: "pending" | "accepted" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled" }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
      setOpenMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order");
      setOpenMenuId(null);
    }
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string, payment_status: "unpaid" | "paid" | "refunded" | "failed" }) => {
      const { error } = await supabase.from("orders").update({ payment_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
      setOpenMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update payment");
      setOpenMenuId(null);
    }
  });

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders-full", region],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("id,status,total,currency,created_at,vendor_id,customer_id,payment_status,delivery_address,order_items(name,price,quantity,subtotal)")
        .order("created_at", { ascending: false })
        .limit(200);
      // Orders' currency maps 1:1 to market (NGN ↔ Nigeria, GBP ↔ UK).
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = orders ?? [];

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: list.length,
      live: 0,
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of list) {
      if (LIVE_STATUSES.has(o.status)) c.live++;
      if (o.status in c) c[o.status as Tab]++;
    }
    return c;
  }, [list]);

  const [paymentFilter, setPaymentFilter] = useState("");

  const filtered = useMemo(() => {
    return list.filter((o: any) => {
      if (tab === "live" && !LIVE_STATUSES.has(o.status)) return false;
      if (tab !== "all" && tab !== "live" && o.status !== tab) return false;
      if (paymentFilter && (o.payment_status ?? "unpaid") !== paymentFilter) return false;
      if (search && !JSON.stringify(o).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, tab, search, paymentFilter]);

  const stats = useMemo(() => {
    const completed = list.filter((o: any) => ["delivered", "completed"].includes(o.status));
    const cancelled = list.filter((o: any) => ["cancelled", "refunded"].includes(o.status));
    const total = completed.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const currency = regionCurrency ?? ((list[0]?.currency as string) || "NGN");
    return {
      currency,
      totalCount: list.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      grossSales: total,
      avgTicket: completed.length ? total / completed.length : 0,
    };
  }, [list, regionCurrency]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Orders"
          title={`Orders — ${countryLabel}`}
          description="Real-time view of every order across vendors, riders and payment channels."
          actions={
            <>
              <button type="button" className={uberBtn.secondary} onClick={() => refetch()}>
                <RefreshCcw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button type="button" className={uberBtn.primary} onClick={() => setIsManualOpen(true)}>
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
            filters={[
              {
                label: "Payment",
                value: paymentFilter,
                onChange: setPaymentFilter,
                options: [
                  { value: "unpaid", label: "Unpaid" },
                  { value: "paid", label: "Paid" },
                  { value: "refunded", label: "Refunded" },
                  { value: "failed", label: "Failed" },
                ],
              },
            ]}
            onExport={() =>
              exportCsv(`orders_${new Date().toISOString().slice(0, 10)}.csv`, filtered, {
                "Order ID": "id",
                Status: "status",
                Payment: (r: any) => r.payment_status ?? "unpaid",
                Total: "total",
                Currency: "currency",
                Delivery: (r: any) => formatAddress(r.delivery_address),
                Created: "created_at",
              })
            }
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
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500" >Loading orders…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">
                    No orders match the current filter.
                  </UberTd>
                </UberTr>
              ) : (
                filtered.map((o: any) => (
                  <React.Fragment key={o.id}>
                    <UberTr onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="cursor-pointer hover:bg-muted/30">
                      <UberTd className="font-mono text-xs text-neutral-700">#{o.id.slice(0, 8)}</UberTd>
                      <UberTd><UberStatus status={humanise(o.status)} /></UberTd>
                      <UberTd><UberStatus status={humanise(o.payment_status ?? "pending")} /></UberTd>
                      <UberTd className="font-medium">{formatMoney(Number(o.total ?? 0), o.currency || stats.currency)}</UberTd>
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
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === o.id ? null : o.id)}
                            className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]"
                          >
                            <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                          </button>
                          {openMenuId === o.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card shadow-lg py-1">
                              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Status</div>
                              {LIVE_STATUSES.has(o.status) && (
                                <button
                                  onClick={() => updateStatus.mutate({ id: o.id, status: "delivered" })}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-emerald-700"
                                >
                                  <CheckCircle className="h-4 w-4" /> Mark Delivered
                                </button>
                              )}
                              <button
                                onClick={() => updateStatus.mutate({ id: o.id, status: "cancelled" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-rose-600"
                              >
                                <Ban className="h-4 w-4" /> Cancel Order
                              </button>
                              <div className="my-1 border-t border-border" />
                              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</div>
                              <button
                                onClick={() => updatePayment.mutate({ id: o.id, payment_status: "refunded" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-amber-600"
                              >
                                <RotateCcw className="h-4 w-4" /> Mark Refunded
                              </button>
                            </div>
                          )}
                        </div>
                      </UberTd>
                    </UberTr>
                    {expandedId === o.id && (
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="text-sm">
                            <div className="font-medium mb-2">Order Items</div>
                            {o.order_items?.length > 0 ? (
                              <ul className="space-y-1">
                                {o.order_items.map((item: any, i: number) => (
                                  <li key={i} className="flex justify-between max-w-md text-neutral-600">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{formatMoney(item.subtotal || (item.price * item.quantity), o.currency)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-neutral-500">No items found for this order.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>

      <Sheet open={isManualOpen} onOpenChange={setIsManualOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>Create Manual Order</SheetTitle>
            <SheetDescription>
              Enter a phone order or manual override directly into the system.
            </SheetDescription>
          </SheetHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              manualOrderMutation.mutate(Object.fromEntries(fd));
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Phone</label>
              <input required name="customer_phone" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="+234..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <select required name="vendor_id" defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" disabled>Select a vendor…</option>
                {(vendorOptions ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Items (Line separated)</label>
              <textarea 
                required 
                name="items" 
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" 
                placeholder="2x Jollof Rice&#10;1x Plantain" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <input required type="number" name="total" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="5000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select name="currency" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="NGN">NGN (₦)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={manualOrderMutation.isPending} className={uberBtn.primary}>
                {manualOrderMutation.isPending ? "Creating..." : "Create Order"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
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
