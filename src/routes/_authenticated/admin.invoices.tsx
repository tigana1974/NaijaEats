// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
              <button className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800">
                <FileText className="h-4 w-4" />
                Generate Run
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
                          <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="Download PDF">
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
