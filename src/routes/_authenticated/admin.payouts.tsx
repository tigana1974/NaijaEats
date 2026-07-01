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
import { Banknote, Clock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: AdminPayouts,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "requested", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
];

function AdminPayouts() {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("id,user_id,amount,currency,status,created_at,requested_at,payout_method")
        .order("requested_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (tab !== "all") list = list.filter((p: any) => p.status === tab);
    if (search) list = list.filter((p: any) => JSON.stringify(p).toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [data, tab, search]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const sum = (rs: any[]) => rs.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const requested = list.filter((p: any) => p.status === "requested");
    const paid = list.filter((p: any) => p.status === "paid");
    const failed = list.filter((p: any) => p.status === "failed");
    const currency = (list[0]?.currency as string) || "GBP";
    return {
      currency,
      totalCount: list.length,
      pending: sum(requested),
      paid: sum(paid),
      failed: failed.length,
    };
  }, [data]);

  return (
    <AdminShell>
      <PageHeader
        title="Payouts"
        description="Review, approve and settle payouts to vendors and riders."
        actions={
          <>
            <button className={btn.secondary}>Payout schedule</button>
            <button className={btn.primary}>Process pending</button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total payouts" value={stats.totalCount} Icon={Banknote} accent="green" />
          <KpiCard
            label="Pending amount"
            value={formatMoney(stats.pending, stats.currency)}
            Icon={Clock}
            accent="orange"
          />
          <KpiCard
            label="Paid amount"
            value={formatMoney(stats.paid, stats.currency)}
            Icon={CheckCircle2}
            accent="green"
          />
          <KpiCard label="Failed" value={stats.failed} Icon={XCircle} accent="ink" />
        </div>

        <div className="mt-6">
          <Card>
            <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
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
                filters={[{ label: "Payee type" }, { label: "Currency" }, { label: "Date" }]}
              />

              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading payouts…</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No payouts match"
                  description="Vendor and rider payouts appear here once requested."
                />
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Payout</Th>
                      <Th>Method</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Requested</Th>
                      <Th>Processed</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map((p: any) => (
                      <Tr key={p.id}>
                        <Td className="font-mono text-xs">#{p.id.slice(0, 8)}</Td>
                        <Td className="capitalize">{p.payout_method || "bank transfer"}</Td>
                        <Td className="font-medium">
                          {formatMoney(Number(p.amount ?? 0), p.currency || "GBP")}
                        </Td>
                        <Td>
                          <StatusBadge status={p.status || "requested"} />
                        </Td>
                        <Td className="text-muted-foreground">
                          {p.requested_at ? new Date(p.requested_at).toLocaleString() : "—"}
                        </Td>
                        <Td className="text-muted-foreground">
                          {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
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
