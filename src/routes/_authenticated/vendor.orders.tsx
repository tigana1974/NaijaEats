import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/vendor/orders")({
  component: VendorOrders,
});

type Status = "pending" | "accepted" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";

const STATUS_LABEL: Record<Status, string> = {
  pending: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  picked_up: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function getNextActions(vendorType?: string): Partial<Record<Status, { to: Status; label: string }>> {
  const isChef = vendorType === "home_chef" || vendorType === "personal_chef";
  const isGrocery = vendorType === "grocery";
  return {
    pending: { to: "accepted", label: "Accept" },
    accepted: { to: "preparing", label: isGrocery ? "Start packing" : isChef ? "Start cooking" : "Start preparing" },
    preparing: { to: "ready", label: isGrocery ? "Ready for pickup" : "Mark ready" },
  };
}

function VendorOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return { vendor: null, orders: [] as any[] };
      const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", uid).maybeSingle();
      if (!vendor) return { vendor: null, orders: [] };
      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });
      return { vendor, orders: orders ?? [] };
    },
  });

  const setStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    if (status === "ready") patch.ready_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${STATUS_LABEL[status].toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["vendor-orders"] });
    qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
  };

  const orders = (data?.orders ?? []).filter((o: any) =>
    filter === "open" ? !["delivered", "cancelled"].includes(o.status) : true,
  );

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage incoming orders.</p>
          </div>
          <div className="inline-flex rounded-full bg-muted p-1">
            {(["open", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full capitalize transition ${
                  filter === f ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && !data?.vendor && (
            <p className="text-muted-foreground">Create your shop first to receive orders.</p>
          )}
          {!isLoading && data?.vendor && orders.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No {filter} orders.
            </div>
          )}
          {orders.map((o: any) => {
            const symbol = o.currency === "GBP" ? "£" : "₦";
            const next = getNextActions(data?.vendor?.type)[o.status as Status];
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                      <span className="text-xs rounded-full px-2 py-0.5 bg-muted">{STATUS_LABEL[o.status as Status]}</span>
                    </div>
                    <div className="font-display text-xl font-semibold mt-1">
                      {symbol}{Number(o.total).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {next && (
                      <button
                        onClick={() => setStatus(o.id, next.to)}
                        className="rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold"
                      >
                        {next.label}
                      </button>
                    )}
                    {["pending", "accepted"].includes(o.status) && (
                      <button
                        onClick={() => setStatus(o.id, "cancelled")}
                        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {o.order_items?.length > 0 && (
                  <ul className="mt-4 text-sm space-y-1 border-t border-border pt-3">
                    {o.order_items.map((it: any) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}× {it.name}
                        </span>
                        <span className="text-muted-foreground">
                          {symbol}{Number(it.subtotal).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {o.customer_note && (
                  <p className="mt-3 text-sm italic text-muted-foreground">Note: {o.customer_note}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}