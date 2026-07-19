// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
  formatMoney
} from "@/components/admin/AdminUI";
import { FileText, Percent, Calendar, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { printHtml } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  component: AdminInvoices,
});

type Invoice = {
  id: string;
  vendor_id: string;
  status: string;
  total_sales: number;
  commission_amount: number;
  tax_amount: number;
  payout_amount: number;
  period_start: string;
  period_end: string;
  due_date: string;
  vendors?: { name: string };
};

function AdminInvoices() {
  const qc = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_invoices")
        .select(`
          *,
          vendors (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any) as Invoice[];
    },
  });

  // Generate last month's statements from delivered orders, using the
  // commission/tax rates configured in Invoice Settings.
  const generateRun = useMutation({
    mutationFn: async () => {
      const { data: cfg } = await supabase
        .from("platform_config")
        .select("value")
        .eq("key", "invoice_settings")
        .maybeSingle();
      const commissionPct = Number(cfg?.value?.default_commission_percent ?? 15);
      const taxPct = Number(cfg?.value?.tax_rate_percent ?? 7.5);
      const termsDays = Number(cfg?.value?.payment_terms_days ?? 14);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
      const dueDate = new Date(periodEnd);
      dueDate.setDate(dueDate.getDate() + termsDays);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("vendor_id,total,currency,created_at")
        .eq("status", "delivered")
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", new Date(periodEnd.getTime() + 86_399_000).toISOString());
      if (error) throw error;

      const byVendor = new Map<string, { sales: number; currency: string }>();
      for (const o of orders ?? []) {
        if (!o.vendor_id) continue;
        const cur = byVendor.get(o.vendor_id) ?? { sales: 0, currency: o.currency || "NGN" };
        cur.sales += Number(o.total ?? 0);
        byVendor.set(o.vendor_id, cur);
      }
      if (byVendor.size === 0) throw new Error("No delivered orders found for last month — nothing to invoice.");

      const rows = [...byVendor.entries()].map(([vendorId, v]) => {
        const commission = v.sales * (commissionPct / 100);
        const tax = commission * (taxPct / 100);
        return {
          vendor_id: vendorId,
          status: "unpaid",
          total_sales: Number(v.sales.toFixed(2)),
          commission_amount: Number(commission.toFixed(2)),
          tax_amount: Number(tax.toFixed(2)),
          payout_amount: Number((v.sales - commission - tax).toFixed(2)),
          currency: v.currency,
          period_start: periodStart.toISOString().slice(0, 10),
          period_end: periodEnd.toISOString().slice(0, 10),
          due_date: dueDate.toISOString().slice(0, 10),
        };
      });

      // The (vendor_id, period) unique constraint makes re-runs safe.
      const { error: insErr, data: inserted } = await supabase
        .from("vendor_invoices")
        .upsert(rows, { onConflict: "vendor_id,period_start,period_end", ignoreDuplicates: true })
        .select("id");
      if (insErr) throw insErr;
      return (inserted ?? []).length;
    },
    onSuccess: (count) => {
      toast.success(
        count > 0
          ? `Generated ${count} statement${count === 1 ? "" : "s"} for last month`
          : "Statements for last month already exist — nothing new to generate",
      );
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to generate invoices"),
  });

  const printInvoice = (inv: Invoice) => {
    const cur = (inv as any).currency || "NGN";
    const ok = printHtml(
      `Statement — ${inv.vendors?.name ?? "Vendor"}`,
      `<h1>NaijaEats — Vendor Statement</h1>
       <div class="muted">Statement #${String(inv.id).slice(0, 8)} · Generated ${format(new Date(), "MMM d, yyyy")}</div>
       <h2>${inv.vendors?.name ?? "Unknown vendor"}</h2>
       <div class="muted">Period: ${format(new Date(inv.period_start), "MMM d, yyyy")} – ${format(new Date(inv.period_end), "MMM d, yyyy")}
         · Due: ${inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"} · Status: ${inv.status}</div>
       <table>
         <tr><th>Item</th><th class="right">Amount</th></tr>
         <tr><td>Total sales</td><td class="right">${formatMoney(Number(inv.total_sales), cur)}</td></tr>
         <tr><td>Platform commission</td><td class="right">-${formatMoney(Number(inv.commission_amount), cur)}</td></tr>
         <tr><td>Tax (VAT)</td><td class="right">-${formatMoney(Number(inv.tax_amount), cur)}</td></tr>
         <tr><th>Net payout</th><th class="right">${formatMoney(Number(inv.payout_amount), cur)}</th></tr>
       </table>`,
    );
    if (!ok) toast.error("Popup blocked — allow popups to print statements");
  };

  const kpis = {
    total: invoices?.length || 0,
    unpaid: invoices?.filter(i => i.status === 'unpaid' || i.status === 'overdue').length || 0,
    commission: invoices?.reduce((sum, i) => sum + Number(i.commission_amount || 0), 0) || 0,
    tax: invoices?.reduce((sum, i) => sum + Number(i.tax_amount || 0), 0) || 0,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finance"
          title="Invoices & Statements"
          description="Monthly statements detailing vendor sales, platform commission, and VAT."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Total Invoices" value={isLoading ? "…" : kpis.total} Icon={FileText} accent="blue" />
          <UberKpi label="Pending / Overdue" value={isLoading ? "…" : kpis.unpaid} Icon={AlertCircle} accent="red" />
          <UberKpi label="Total Commission" value={isLoading ? "…" : formatMoney(kpis.commission, "NGN")} Icon={Percent} accent="green" />
          <UberKpi label="Total Tax Collected" value={isLoading ? "…" : formatMoney(kpis.tax, "NGN")} Icon={Calendar} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5 bg-neutral-50/50">
              <h3 className="font-semibold text-lg">Recent Statements</h3>
              <button
                onClick={() => generateRun.mutate()}
                disabled={generateRun.isPending}
                className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {generateRun.isPending ? "Generating…" : "Generate Run (last month)"}
              </button>
            </div>
            
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Vendor</UberTh>
                  <UberTh>Period</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh>Total Sales</UberTh>
                  <UberTh>Commission + Tax</UberTh>
                  <UberTh>Net Payout</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={7} className="text-center py-8">Loading invoices...</UberTd></UberTr>
                ) : !invoices || invoices.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <FileText className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No invoices generated yet</p>
                        <p className="text-sm mt-1">Invoices are automatically generated at the end of the billing period.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  invoices.map((inv) => (
                    <UberTr key={inv.id}>
                      <UberTd className="font-medium text-neutral-900">{inv.vendors?.name || 'Unknown'}</UberTd>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(inv.period_start), "MMM d")} - {format(new Date(inv.period_end), "MMM d, yyyy")}</span>
                          <span className="text-xs text-neutral-500">Due {format(new Date(inv.due_date), "MMM d, yyyy")}</span>
                        </div>
                      </UberTd>
                      <UberTd>
                        <UberStatus 
                          status={inv.status} 
                          variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'error' : inv.status === 'draft' ? 'neutral' : 'warning'}
                        />
                      </UberTd>
                      <UberTd className="font-medium">{formatMoney(inv.total_sales, "NGN")}</UberTd>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatMoney(inv.commission_amount, "NGN")} fee</span>
                          <span className="text-xs text-neutral-500">{formatMoney(inv.tax_amount, "NGN")} tax</span>
                        </div>
                      </UberTd>
                      <UberTd className="font-medium text-green-700">{formatMoney(inv.payout_amount, "NGN")}</UberTd>
                      <UberTd>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => printInvoice(inv)}
                            className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500"
                            title="Print / Save as PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </UberTd>
                    </UberTr>
                  ))
                )}
              </tbody>
            </UberTable>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
