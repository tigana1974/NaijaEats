import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, ChevronRight, Clock3, PackageCheck, XCircle } from "lucide-react";
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
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    n,
  );

function OrdersPage() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, status, payment_status, total, currency, created_at, scheduled_for, vendor:vendors(name, logo_url)",
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const activeStatuses = ["pending", "accepted", "preparing", "ready", "picked_up"];
  const filteredOrders = (orders ?? []).filter((order: any) => {
    if (filter === "active") return activeStatuses.includes(order.status);
    if (filter === "delivered") return order.status === "delivered";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });
  const activeCount = (orders ?? []).filter((order: any) =>
    activeStatuses.includes(order.status),
  ).length;
  const deliveredCount = (orders ?? []).filter((order: any) => order.status === "delivered").length;

  return (
    <CustomerShell
      containerClassName="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16"
      topBar={<h1 className="font-display text-lg font-bold">My Orders</h1>}
    >
      <div>
        <section className="overflow-hidden rounded-lg bg-[#171714] px-5 py-7 text-white sm:px-7 sm:py-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0bd43]">
                Order history
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-normal sm:text-4xl">
                My Orders
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Track meals on the way and revisit everything you have ordered from NaijaEats.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/10 p-px text-center">
              <div className="bg-white/[0.04] px-4 py-3">
                <div className="text-xl font-bold">{orders?.length ?? 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/45">All</div>
              </div>
              <div className="bg-white/[0.04] px-4 py-3">
                <div className="text-xl font-bold text-[#f0bd43]">{activeCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/45">Active</div>
              </div>
              <div className="bg-white/[0.04] px-4 py-3">
                <div className="text-xl font-bold">{deliveredCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/45">Delivered</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(
            [
              ["all", "All orders", ShoppingBag],
              ["active", "Active", Clock3],
              ["delivered", "Delivered", PackageCheck],
              ["cancelled", "Cancelled", XCircle],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                filter === id
                  ? "border-[#171714] bg-[#171714] text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-2">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-100" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {filteredOrders.map((o: any) => (
                <li key={o.id}>
                  <Link
                    to="/orders/$orderId"
                    params={{ orderId: o.id }}
                    className="group flex min-h-28 items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-[0_14px_34px_-26px_rgba(0,0,0,0.5)]"
                  >
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-100">
                      {o.vendor?.logo_url ? (
                        <img
                          src={o.vendor.logo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-zinc-500" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {o.vendor?.name ?? "Order"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {o.scheduled_for ? (
                          <span className="font-bold text-[var(--brand-clay)]">
                            📅 Scheduled: {new Date(o.scheduled_for).toLocaleString()}
                          </span>
                        ) : (
                          <>{new Date(o.created_at).toLocaleString()}</>
                        )}
                        {" · #"}
                        {o.id.slice(0, 6).toUpperCase()}
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
                    <div className="text-sm font-bold tabular-nums">
                      {fmt(Number(o.total), o.currency)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-zinc-400" />
              <h2 className="mt-3 font-display text-xl">
                {filter === "all" ? "No orders yet" : `No ${filter} orders`}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {filter === "all"
                  ? "Discover vendors and place your first order."
                  : "Try another order filter."}
              </p>
              <Link
                to="/discover"
                className="mt-4 inline-block rounded-lg bg-[#171714] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Browse vendors
              </Link>
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
