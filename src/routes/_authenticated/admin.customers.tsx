import { useMemo, useState } from "react";
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
  EmptyState,
  formatMoney,
  btn,
} from "@/components/admin/AdminUI";
import { Users, UserPlus, Star, TrendingUp, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [search, setSearch] = useState<string>("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      return profiles ?? [];
    },
  });

  const { data: orderAgg } = useQuery({
    queryKey: ["admin-customers-orders-agg"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("customer_id,total,currency,created_at");
      const map = new Map<string, { count: number; spend: number; currency: string; last?: string }>();
      (data ?? []).forEach((o: any) => {
        const cid = o.customer_id;
        if (!cid) return;
        const cur = map.get(cid) ?? { count: 0, spend: 0, currency: o.currency || "GBP", last: o.created_at };
        cur.count += 1;
        cur.spend += Number(o.total ?? 0);
        if (!cur.last || new Date(o.created_at) > new Date(cur.last)) cur.last = o.created_at;
        map.set(cid, cur);
      });
      return map;
    },
  });

  const filtered = useMemo(() => {
    const list = customers ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((c: any) =>
      [c.full_name, c.email, c.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const list = customers ?? [];
    const now = new Date();
    const newThisMonth = list.filter(
      (c: any) => c.created_at && new Date(c.created_at).getMonth() === now.getMonth()
    ).length;
    let repeat = 0;
    let totalCustomers = 0;
    let totalSpend = 0;
    let currency = "GBP";
    orderAgg?.forEach((agg) => {
      totalCustomers += 1;
      totalSpend += agg.spend;
      currency = agg.currency;
      if (agg.count > 1) repeat += 1;
    });
    return {
      total: list.length,
      newThisMonth,
      repeat,
      ltv: totalCustomers ? totalSpend / totalCustomers : 0,
      currency,
    };
  }, [customers, orderAgg]);

  return (
    <AdminShell>
      <PageHeader
        title="Customers"
        description="Every customer on Naija Eats, with wallet balance, order history and complaints."
        actions={
          <>
            <button className={btn.secondary}>Segment</button>
            <button className={btn.primary}>Message customers</button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total customers" value={stats.total} Icon={Users} accent="green" />
          <KpiCard label="New this month" value={stats.newThisMonth} Icon={UserPlus} accent="orange" />
          <KpiCard label="Repeat customers" value={stats.repeat} Icon={Star} accent="green" />
          <KpiCard
            label="Avg. customer LTV"
            value={formatMoney(stats.ltv, stats.currency)}
            Icon={TrendingUp}
            accent="ink"
          />
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader
              title="Customer directory"
              description="Search, segment, and manage individual customer records"
            />
            <div className="p-4">
              <FilterBar
                onSearch={setSearch}
                filters={[{ label: "City" }, { label: "Country" }, { label: "Segment" }]}
              />

              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading customers…</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No customers yet"
                  description="When people sign up and place their first order they'll show up here."
                />
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Customer</Th>
                      <Th>Contact</Th>
                      <Th>Orders</Th>
                      <Th>Spend</Th>
                      <Th>Last order</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map((c: any) => {
                      const agg = orderAgg?.get(c.id);
                      return (
                        <Tr key={c.id}>
                          <Td className="font-medium">{c.full_name || "Unnamed customer"}</Td>
                          <Td className="text-muted-foreground">
                            <div>{c.email}</div>
                            {c.phone && <div className="text-xs">{c.phone}</div>}
                          </Td>
                          <Td>{agg?.count ?? 0}</Td>
                          <Td>{formatMoney(agg?.spend ?? 0, agg?.currency || "GBP")}</Td>
                          <Td className="text-muted-foreground">
                            {agg?.last ? new Date(agg.last).toLocaleDateString() : "—"}
                          </Td>
                          <Td>
                            <StatusBadge status={agg && agg.count > 0 ? "active" : "inactive"} />
                          </Td>
                          <Td className="text-right">
                            <button className="rounded-md p-1.5 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </Td>
                        </Tr>
                      );
                    })}
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
