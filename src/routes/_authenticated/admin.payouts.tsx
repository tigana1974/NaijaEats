import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  formatMoney,
} from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { Check, X, Loader } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: AdminPayouts,
});

// Matches the actual payout_status enum in Supabase.
type Tab = "all" | "requested" | "processing" | "paid" | "rejected";

function AdminPayouts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts-full"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: payouts, error } = await supabase
        .from("payouts")
        .select("id,user_id,amount,currency,status,payout_method,requested_at,processed_at,admin_note,created_at")
        .order("requested_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (payouts ?? []) as unknown as any[];
      const ids = Array.from(new Set(rows.map((p) => p.user_id).filter(Boolean)));
      let names = new Map<string, string>();
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || "Unnamed"]));
      }
      return rows.map((p) => ({ ...p, payee_name: names.get(p.user_id) ?? "Unnamed" }));
    },
  });

  const list = data ?? [];

  const setStatus = async (id: string, status: "processing" | "paid" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    const patch: any = { status };
    if (status === "paid" || status === "rejected") {
      patch.processed_at = new Date().toISOString();
      patch.processed_by = u.user?.id ?? null;
    }
    const { error } = await supabase.from("payouts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Payout ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-payouts-full"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard-summary"] });
  };

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: list.length, requested: 0, processing: 0, paid: 0, rejected: 0 };
    for (const p of list) if (p.status in c) c[p.status as Tab]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((p: any) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (search) {
        const hay = `${p.id} ${p.payee_name} ${p.status} ${p.payout_method ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [list, tab, search]);

  const stats = useMemo(() => {
    const currency = (list[0]?.currency as string) || "GBP";
    const sum = (s: string) =>
      list.filter((p: any) => p.status === s).reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);
    return {
      currency,
      totalCount: list.length,
      requestedAmount: sum("requested"),
      paidAmount: sum("paid"),
      rejectedCount: counts.rejected,
    };
  }, [list, counts]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Payments"
          title="Payouts"
          description="Vendor, rider and customer wallet payout requests — approve, process or reject."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total payouts" value={isLoading ? "…" : stats.totalCount.toLocaleString()} hint="Last 200 requests" />
          <UberKpi label="Awaiting action" value={isLoading ? "…" : formatMoney(stats.requestedAmount, stats.currency)} hint="Requested, not yet processed" />
          <UberKpi label="Paid out" value={isLoading ? "…" : formatMoney(stats.paidAmount, stats.currency)} hint="Successfully settled" />
          <UberKpi label="Rejected" value={isLoading ? "…" : stats.rejectedCount.toLocaleString()} hint="Declined requests" />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "requested", label: "Requested", count: counts.requested },
              { id: "processing", label: "Processing", count: counts.processing },
              { id: "paid", label: "Paid", count: counts.paid },
              { id: "rejected", label: "Rejected", count: counts.rejected },
            ]}
          />

          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Method" }, { label: "Currency" }, { label: "Date range" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Payout</UberTh>
                <UberTh>Payee</UberTh>
                <UberTh>Amount</UberTh>
                <UberTh>Method</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Requested</UberTh>
                <UberTh>Processed</UberTh>
                <UberTh>Actions</UberTh>
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">Loading payouts…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd className="py-8 text-center text-neutral-500">No payouts match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((p: any) => (
                  <UberTr key={p.id}>
                    <UberTd className="font-mono text-xs text-neutral-700">#{String(p.id).slice(0, 8)}</UberTd>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{p.payee_name}</div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(p.user_id ?? "").slice(0, 8)}</div>
                    </UberTd>
                    <UberTd className="font-medium">{formatMoney(Number(p.amount ?? 0), p.currency || "GBP")}</UberTd>
                    <UberTd className="capitalize text-neutral-600">{(p.payout_method || "—").replaceAll("_", " ")}</UberTd>
                    <UberTd><UberStatus status={p.status} /></UberTd>
                    <UberTd className="text-neutral-500">
                      {p.requested_at ? new Date(p.requested_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {p.processed_at ? new Date(p.processed_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd>
                      <div className="flex items-center gap-1.5">
                        {p.status === "requested" && (
                          <>
                            <PayoutAction label="Process" Icon={Loader} tone="orange" onClick={() => setStatus(p.id, "processing")} />
                            <PayoutAction label="Pay" Icon={Check} tone="green" onClick={() => setStatus(p.id, "paid")} />
                            <PayoutAction label="Reject" Icon={X} tone="red" onClick={() => setStatus(p.id, "rejected")} />
                          </>
                        )}
                        {p.status === "processing" && (
                          <>
                            <PayoutAction label="Mark paid" Icon={Check} tone="green" onClick={() => setStatus(p.id, "paid")} />
                            <PayoutAction label="Reject" Icon={X} tone="red" onClick={() => setStatus(p.id, "rejected")} />
                          </>
                        )}
                      </div>
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

function PayoutAction({
  label,
  Icon,
  tone,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "green" | "red" | "orange";
  onClick: () => void;
}) {
  const cls = {
    green: "border-[var(--naija-green)] text-[var(--naija-green-dark)] hover:bg-[oklch(0.97_0.03_145)]",
    red: "border-[oklch(0.6_0.16_15)] text-[oklch(0.42_0.16_15)] hover:bg-[oklch(0.97_0.02_15)]",
    orange: "border-[var(--naija-orange)] text-[var(--naija-orange-dark)] hover:bg-[oklch(0.97_0.03_65)]",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[12px] font-medium ${cls}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
