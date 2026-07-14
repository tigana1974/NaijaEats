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
import { MoreHorizontal, Play } from "lucide-react";
import { toast } from "sonner";
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

type Tab = "all" | "requested" | "paid" | "failed";

function AdminPayouts() {
  const qc = useQueryClient();
  const { region, currency: regionCurrency, countryLabel } = useAdminRegion();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const batchMutation = useMutation({
    mutationFn: async () => {
      // Simulate calling a Supabase Edge Function to process payouts
      await new Promise(r => setTimeout(r, 2000));
    },
    onSuccess: () => {
      toast.success("Batch processed successfully");
      setIsBatchOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-payouts-full"] });
    },
    onError: (err: any) => {
      toast.error(`Batch failed: ${err.message}`);
    }
  });

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts-full", region],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("payouts")
        .select("id,payee_id,payee_type,amount,currency,status,created_at,scheduled_for")
        .order("created_at", { ascending: false })
        .limit(200);
      if (regionCurrency) q = q.eq("currency", regionCurrency);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  const list = payouts ?? [];

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: list.length, requested: 0, paid: 0, failed: 0 };
    for (const p of list) {
      if ((["requested", "paid", "failed"] as Tab[]).includes(p.status as Tab)) c[p.status as Tab]++;
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((p: any) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (search && !JSON.stringify(p).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, tab, search]);

  const stats = useMemo(() => {
    const pending = list.filter((p: any) => p.status === "requested");
    const paid = list.filter((p: any) => p.status === "paid");
    const failed = list.filter((p: any) => p.status === "failed");
    const currency = regionCurrency ?? ((list[0]?.currency as string) || "NGN");
    return {
      currency,
      totalCount: list.length,
      pendingAmount: pending.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0),
      paidAmount: paid.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0),
      failedCount: failed.length,
    };
  }, [list, regionCurrency]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Payments"
          title={`Payouts — ${countryLabel}`}
          description="Vendor and rider payouts across Stripe (UK) and Paystack (Nigeria)."
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
          <UberKpi label="Failed" value={isLoading ? "…" : stats.failedCount.toLocaleString()} hint="Require retry" />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "requested", label: "Requested", count: counts.requested },
              { id: "paid", label: "Paid", count: counts.paid },
              { id: "failed", label: "Failed", count: counts.failed },
            ]}
          />

          <UberFilterBar
            search={search}
            onSearch={setSearch}
            filters={[{ label: "Payee type" }, { label: "Provider" }, { label: "Date range" }]}
            onExport={() => {}}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Payout</UberTh>
                <UberTh>Payee</UberTh>
                <UberTh>Amount</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Scheduled</UberTh>
                <UberTh>Requested</UberTh>
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
                filtered.map((p: any) => (
                  <UberTr key={p.id}>
                    <UberTd className="font-mono text-xs text-neutral-700">#{String(p.id).slice(0, 8)}</UberTd>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)] capitalize">{p.payee_type || "—"}</div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(p.payee_id ?? "").slice(0, 8)}</div>
                    </UberTd>
                    <UberTd className="font-medium">{formatMoney(Number(p.amount ?? 0), p.currency || stats.currency)}</UberTd>
                    <UberTd><UberStatus status={p.status} /></UberTd>
                    <UberTd className="text-neutral-500">
                      {p.scheduled_for ? new Date(p.scheduled_for).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd className="text-neutral-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString([], { day: "numeric", month: "short" }) : "—"}
                    </UberTd>
                    <UberTd>
                      <button className="rounded-full p-1.5 hover:bg-[oklch(0.965_0.003_260)]">
                        <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                      </button>
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
              This will process all payouts currently in the "requested" state.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-xl text-sm border border-amber-200">
              You are about to initiate bank transfers for <strong>{counts.requested}</strong> pending requests. 
              This action cannot be undone.
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
              {batchMutation.isPending ? "Processing..." : `Process ${counts.requested} Payouts`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
