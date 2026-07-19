import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { MoreHorizontal, Play, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { exportCsv } from "@/lib/csv";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: AdminPayouts,
});

type Tab = "all" | "requested" | "processing" | "paid" | "rejected";

type PayoutRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: Tab;
  payout_method: string | null;
  admin_note: string | null;
  requested_at: string | null;
  processed_at: string | null;
  payeeName: string;
  payeeType: string;
};

function AdminPayouts() {
  const qc = useQueryClient();
  const { region, currency: regionCurrency, countryLabel } = useAdminRegion();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [payeeTypeFilter, setPayeeTypeFilter] = useState("");
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts-full", region],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("payouts")
        .select("id,user_id,amount,currency,status,payout_method,admin_note,requested_at,processed_at")
        .order("requested_at", { ascending: false })
        .limit(200);
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as any[];

      // Resolve payee names and roles (no FK-embed dependency).
      const userIds = [...new Set(rows.map((p) => p.user_id).filter(Boolean))];
      let names = new Map<string, string>();
      let roles = new Map<string, string>();
      if (userIds.length > 0) {
        const [{ data: profiles }, { data: userRoles }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        ]);
        names = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || "Unnamed"]));
        for (const r of userRoles ?? []) {
          // Prefer vendor/rider over customer for display.
          const cur = roles.get(r.user_id);
          if (!cur || cur === "customer") roles.set(r.user_id, r.role);
        }
      }
      return rows.map((p) => ({
        ...p,
        payeeName: names.get(p.user_id) ?? "Unknown",
        payeeType: roles.get(p.user_id) ?? "—",
      })) as PayoutRow[];
    },
  });

  const settleOne = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "paid" | "rejected" | "processing" }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("payouts")
        .update({
          status,
          processed_at: status === "processing" ? null : new Date().toISOString(),
          processed_by: status === "processing" ? null : (u.user?.id ?? null),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Payout marked ${vars.status}`);
      setOpenMenuId(null);
      qc.invalidateQueries({ queryKey: ["admin-payouts-full"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update payout");
      setOpenMenuId(null);
    },
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      let q = supabase
        .from("payouts")
        .update({
          status: "paid",
          processed_at: new Date().toISOString(),
          processed_by: u.user?.id ?? null,
        })
        .eq("status", "requested");
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q.select("id");
      if (error) throw error;
      return (data ?? []).length;
    },
    onSuccess: (count) => {
      toast.success(`${count} payout${count === 1 ? "" : "s"} marked as paid`);
      setIsBatchOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-payouts-full"] });
    },
    onError: (err: any) => {
      toast.error(`Batch failed: ${err.message}`);
    },
  });

  const list = payouts ?? [];

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: list.length, requested: 0, processing: 0, paid: 0, rejected: 0 };
    for (const p of list) {
      if ((["requested", "processing", "paid", "rejected"] as Tab[]).includes(p.status)) c[p.status]++;
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (payeeTypeFilter && p.payeeType !== payeeTypeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![p.id, p.payeeName, p.payout_method ?? ""].some((v) => v.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [list, tab, search, payeeTypeFilter]);

  const stats = useMemo(() => {
    const pending = list.filter((p) => p.status === "requested");
    const paid = list.filter((p) => p.status === "paid");
    const currency = regionCurrency ?? (list[0]?.currency || "NGN");
    return {
      currency,
      totalCount: list.length,
      pendingAmount: pending.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      paidAmount: paid.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      rejectedCount: list.filter((p) => p.status === "rejected").length,
    };
  }, [list, regionCurrency]);

  const onExport = () =>
    exportCsv(`payouts_${new Date().toISOString().slice(0, 10)}.csv`, filtered, {
      "Payout ID": "id",
      Payee: "payeeName",
      "Payee type": "payeeType",
      Amount: "amount",
      Currency: "currency",
      Status: "status",
      Method: (r) => r.payout_method ?? "",
      Requested: (r) => r.requested_at ?? "",
      Processed: (r) => r.processed_at ?? "",
    });

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Payments"
          title={`Payouts — ${countryLabel}`}
          description="Vendor and rider cash-out requests. Settling here records the transfer as paid — move the money via your banking provider."
          actions={
            <button type="button" className={uberBtn.primary} onClick={() => setIsBatchOpen(true)}>
              <Play className="h-3.5 w-3.5" /> Run payout batch
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total payouts" value={isLoading ? "…" : stats.totalCount.toLocaleString()} hint="Last 200 records" />
          <UberKpi label="Pending amount" value={isLoading ? "…" : formatMoney(stats.pendingAmount, stats.currency)} hint="Awaiting settlement" />
          <UberKpi label="Paid amount" value={isLoading ? "…" : formatMoney(stats.paidAmount, stats.currency)} hint="Successfully settled" />
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
            filters={[
              {
                label: "Payee type",
                value: payeeTypeFilter,
                onChange: setPayeeTypeFilter,
                options: [
                  { value: "vendor", label: "Vendors" },
                  { value: "rider", label: "Riders" },
                ],
              },
            ]}
            onExport={onExport}
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
                <UberTh className="w-[1%]" />
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">Loading payouts…</UberTd>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <UberTd colSpan={10} className="py-8 text-center text-neutral-500">No payouts match the current filter.</UberTd>
                </UberTr>
              ) : (
                filtered.map((p) => (
                  <UberTr key={p.id}>
                    <UberTd className="font-mono text-xs text-neutral-700">#{String(p.id).slice(0, 8)}</UberTd>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{p.payeeName}</div>
                      <div className="text-[11px] capitalize text-neutral-500">{p.payeeType}</div>
                    </UberTd>
                    <UberTd className="font-medium">{formatMoney(Number(p.amount ?? 0), p.currency || stats.currency)}</UberTd>
                    <UberTd className="max-w-[180px] truncate text-neutral-600">{p.payout_method || "—"}</UberTd>
                    <UberTd><UberStatus status={p.status} /></UberTd>
                    <UberTd className="text-neutral-500">
                      {p.requested_at ? new Date(p.requested_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {p.processed_at ? new Date(p.processed_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd>
                      {(p.status === "requested" || p.status === "processing") && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                            className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]"
                          >
                            <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                          </button>
                          {openMenuId === p.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card py-1 shadow-lg">
                              <button
                                onClick={() => settleOne.mutate({ id: p.id, status: "paid" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-muted"
                              >
                                <CheckCircle className="h-4 w-4" /> Mark paid
                              </button>
                              <button
                                onClick={() => settleOne.mutate({ id: p.id, status: "rejected" })}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-muted"
                              >
                                <XCircle className="h-4 w-4" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </UberTd>
                  </UberTr>
                ))
              )}
            </tbody>
          </UberTable>
        </div>
      </div>

      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Run Payout Batch</DialogTitle>
            <DialogDescription>
              Marks every payout currently in the "requested" state as paid, with you recorded as the processor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-600">
              You are about to settle <strong>{counts.requested}</strong> pending request{counts.requested === 1 ? "" : "s"}.
              This records them as paid in NaijaEats — make sure the matching bank transfers have been (or will be) sent.
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button type="button" className={uberBtn.secondary}>Cancel</button>
            </DialogClose>
            <button
              type="button"
              onClick={() => batchMutation.mutate()}
              disabled={batchMutation.isPending || counts.requested === 0}
              className={uberBtn.primary}
            >
              {batchMutation.isPending ? "Processing..." : `Settle ${counts.requested} payouts`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
