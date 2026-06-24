import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { Users, Repeat, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("customer_id,total,currency,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const customerIds = Array.from(new Set((orders ?? []).map((o: any) => o.customer_id)));
      const { data: profiles } = customerIds.length
        ? await supabase.from("profiles").select("id,full_name,created_at").in("id", customerIds)
        : { data: [] as any[] };
      const profileById: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => (profileById[p.id] = p));

      return { orders: orders ?? [], profileById };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { orders, profileById } = data;
    const byCustomer: Record<
      string,
      { orders: number; spend: Record<string, number>; lastOrder: string; firstOrder: string }
    > = {};
    orders.forEach((o: any) => {
      byCustomer[o.customer_id] ||= { orders: 0, spend: {}, lastOrder: o.created_at, firstOrder: o.created_at };
      const c = byCustomer[o.customer_id];
      c.orders++;
      if (o.status !== "cancelled") {
        c.spend[o.currency] = (c.spend[o.currency] ?? 0) + Number(o.total || 0);
      }
      if (o.created_at > c.lastOrder) c.lastOrder = o.created_at;
      if (o.created_at < c.firstOrder) c.firstOrder = o.created_at;
    });

    const totalCustomers = Object.keys(byCustomer).length;
    const repeatCustomers = Object.values(byCustomer).filter((c) => c.orders > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers30d = Object.values(byCustomer).filter(
      (c) => new Date(c.firstOrder) >= thirtyDaysAgo,
    ).length;

    const topCustomers = Object.entries(byCustomer)
      .map(([id, c]) => ({
        id,
        name: profileById[id]?.full_name ?? "Unnamed customer",
        ...c,
      }))
      .sort(
        (a, b) =>
          Object.values(b.spend).reduce((s, n) => s + n, 0) - Object.values(a.spend).reduce((s, n) => s + n, 0),
      )
      .slice(0, 10);

    return { totalCustomers, repeatCustomers, repeatRate, newCustomers30d, topCustomers };
  }, [data]);

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Customer insights</h1>
        <p className="text-muted-foreground mb-6">Based on every order placed on the platform.</p>

        {isLoading || !stats ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : stats.totalCustomers === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No customer orders yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" /> Customers with orders
                </div>
                <div className="mt-2 text-2xl font-display font-semibold">{stats.totalCustomers}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Repeat className="h-4 w-4" /> Repeat rate
                </div>
                <div className="mt-2 text-2xl font-display font-semibold">{stats.repeatRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stats.repeatCustomers} customers, 2+ orders</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <UserPlus className="h-4 w-4" /> New customers (30d)
                </div>
                <div className="mt-2 text-2xl font-display font-semibold">{stats.newCustomers30d}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <h2 className="font-display text-lg font-semibold p-5 pb-3">Top customers by spend</h2>
              <div className="divide-y divide-border">
                {stats.topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.orders} orders · last on {new Date(c.lastOrder).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right shrink-0">
                      {Object.entries(c.spend)
                        .map(([cur, amt]) => `${cur} ${(amt as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
