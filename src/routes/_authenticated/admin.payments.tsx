import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTabs,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  formatMoney,
  uberBtn
} from "@/components/admin/AdminUI";
import { CreditCard, AlertOctagon, RotateCcw, ReceiptText, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

type Tab = "all" | "success" | "pending" | "failed" | "refunded";

function AdminPayments() {
  const [tab, setTab] = useState<Tab>("all");

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, currency, status, provider, created_at, provider_reference, order_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const list = payments || [];
  
  const stats = useMemo(() => {
    let successVol = 0;
    let refundVol = 0;
    let failedCount = 0;
    for (const p of list) {
      if (p.status === "success") successVol += Number(p.amount);
      if (p.status === "refunded") refundVol += Number(p.amount);
      if (p.status === "failed") failedCount++;
    }
    return { successVol, refundVol, failedCount };
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      return true;
    });
  }, [list, tab]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finances"
          title="Payments"
          description="Track incoming customer payments via Paystack and Stripe."
          actions={
            <button type="button" className={uberBtn.secondary} onClick={() => refetch()}>
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UberKpi label="Total Payments" value={isLoading ? "…" : list.length.toLocaleString()} />
          <UberKpi label="Success Volume" value={isLoading ? "…" : formatMoney(stats.successVol, list[0]?.currency || "GBP")} />
          <UberKpi label="Failed" value={isLoading ? "…" : stats.failedCount.toLocaleString()} />
          <UberKpi label="Refund Volume" value={isLoading ? "…" : formatMoney(stats.refundVol, list[0]?.currency || "GBP")} />
        </div>

        <div className="mt-8">
          <UberTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "All", count: list.length },
              { id: "success", label: "Successful", count: list.filter(p => p.status === "success").length },
              { id: "pending", label: "Pending", count: list.filter(p => p.status === "pending").length },
              { id: "failed", label: "Failed", count: stats.failedCount },
              { id: "refunded", label: "Refunded", count: list.filter(p => p.status === "refunded").length },
            ]}
          />

          <UberTable>
            <UberThead>
              <tr>
                <UberTh>Payment ID</UberTh>
                <UberTh>Status</UberTh>
                <UberTh>Provider</UberTh>
                <UberTh>Order</UberTh>
                <UberTh>Amount</UberTh>
                <UberTh>Date</UberTh>
              </tr>
            </UberThead>
            <tbody>
              {isLoading ? (
                <UberTr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">Loading payments…</td>
                </UberTr>
              ) : filtered.length === 0 ? (
                <UberTr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">No payments match the filter.</td>
                </UberTr>
              ) : (
                filtered.map((p: any) => (
                  <UberTr key={p.id}>
                    <UberTd>
                      <div className="font-medium text-[oklch(0.18_0.006_260)]">{p.provider_reference || "No ref"}</div>
                      <div className="font-mono text-[11px] text-neutral-500">#{String(p.id).slice(0, 8)}</div>
                    </UberTd>
                    <UberTd><UberStatus status={p.status} /></UberTd>
                    <UberTd className="capitalize text-neutral-700 font-medium">{p.provider}</UberTd>
                    <UberTd className="font-mono text-xs text-neutral-500">#{String(p.order_id).slice(0, 8)}</UberTd>
                    <UberTd className="font-medium text-neutral-900">{formatMoney(Number(p.amount ?? 0), p.currency || "GBP")}</UberTd>
                    <UberTd className="text-neutral-500">
                      {new Date(p.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
