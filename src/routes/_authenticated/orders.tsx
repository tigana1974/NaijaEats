import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerShell } from "@/components/naija/CustomerShell";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const statusTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-900",
  accepted: "bg-amber-50 text-amber-900",
  preparing: "bg-amber-50 text-amber-900",
  ready: "bg-amber-50 text-amber-900",
  picked_up: "bg-blue-50 text-blue-900",
  delivered: "bg-emerald-50 text-emerald-900",
  cancelled: "bg-zinc-100 text-zinc-600",
};

const paymentTone: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
  refunded: "bg-zinc-100 text-zinc-600",
  failed: "bg-red-50 text-red-700",
};

const fmt = (n: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

function OrdersPage() {
  const { user } = Route.useRouteContext();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, payment_status, total, currency, created_at, scheduled_for, vendor:vendors(name, logo_url)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <CustomerShell topBar={<h1 className="font-display text-lg font-bold">My Orders</h1>}>
      <div className="pt-3">
        <h1 className="hidden lg:block font-display text-2xl font-bold tracking-tight mb-5">My Orders</h1>
        {isLoading ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-3xl bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {orders.map((o: any) => (
              <li key={o.id}>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-zinc-100 hover:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] transition"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 shrink-0 overflow-hidden">
                    {o.vendor?.logo_url ? (
                      <img src={o.vendor.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-zinc-500" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{o.vendor?.name ?? "Order"}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {o.scheduled_for ? (
                        <span className="font-bold text-[var(--brand-clay)]">📅 Scheduled: {new Date(o.scheduled_for).toLocaleString()}</span>
                      ) : (
                        <>{new Date(o.created_at).toLocaleString()}</>
                      )}
                      {" · #"}{o.id.slice(0, 6).toUpperCase()}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone[o.status] ?? "bg-zinc-100 text-zinc-600"}`}
                      >
                        {o.status}
                      </span>
                      {o.payment_status && o.payment_status !== "paid" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${paymentTone[o.payment_status] ?? "bg-zinc-100 text-zinc-600"}`}
                        >
                          {o.payment_status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums">{fmt(Number(o.total), o.currency)}</div>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-zinc-400" />
            <h2 className="font-display text-xl mt-3">No orders yet</h2>
            <p className="text-sm text-zinc-500 mt-1">Discover vendors and place your first order.</p>
            <Link
              to="/discover"
              className="inline-block mt-4 rounded-full bg-[var(--brand-clay)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-4px_rgba(255,77,77,0.6)] hover:opacity-95"
            >
              Browse vendors
            </Link>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
