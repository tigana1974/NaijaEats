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
import { ReceiptText, PercentCircle, Truck, Building2, Search, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/payouts-orders")({
  component: AdminPayoutsByOrder,
});

function AdminPayoutsByOrder() {
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-payouts-orders"],
    queryFn: async () => {
      // In a real app we would paginate this heavily. 
      // For the demo we fetch the most recent 100 delivered orders.
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, total, delivery_fee, created_at, status, payment_method,
          vendors (name)
        `)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  const processedOrders = (orders || [])
    .filter(o => 
      o.id.toLowerCase().includes(search.toLowerCase()) || 
      (o.vendors as any)?.name.toLowerCase().includes(search.toLowerCase())
    )
    .map(o => {
      // Simulate backend financial splits for the UI
      const total = Number(o.total || 0);
      const delFee = Number(o.delivery_fee || 0);
      const subtotal = total - delFee; // assuming total includes delivery for this calc
      
      const commission = subtotal * 0.15; // 15% platform take
      const vendorNet = subtotal - commission;
      const riderPayout = delFee * 0.8; // rider gets 80% of delivery fee
      const platformNet = commission + (delFee * 0.2); // platform gets commission + 20% of delivery fee

      return {
        ...o,
        financials: {
          subtotal,
          delFee,
          total,
          commission,
          vendorNet,
          riderPayout,
          platformNet
        }
      };
    });

  const kpis = {
    volume: orders?.length || 0,
    commission: processedOrders.reduce((sum, o) => sum + o.financials.commission, 0),
    riderShare: processedOrders.reduce((sum, o) => sum + o.financials.riderPayout, 0),
    platformNet: processedOrders.reduce((sum, o) => sum + o.financials.platformNet, 0),
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finance"
          title="Order Reconciliation"
          description="Per-order breakdown of commission, delivery fees, and platform earnings."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Total Orders (Shown)" value={isLoading ? "…" : kpis.volume} Icon={ReceiptText} accent="blue" />
          <UberKpi label="Total Commission" value={isLoading ? "…" : formatMoney(kpis.commission, "NGN")} Icon={PercentCircle} accent="green" />
          <UberKpi label="Rider Payouts" value={isLoading ? "…" : formatMoney(kpis.riderShare, "NGN")} Icon={Truck} accent="orange" />
          <UberKpi label="Net Platform Earnings" value={isLoading ? "…" : formatMoney(kpis.platformNet, "NGN")} Icon={Building2} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-5 bg-neutral-50/50 gap-4">
              <h3 className="font-semibold text-lg">Order Splits</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search order ID or vendor..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-core"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <UberTable>
                <UberThead>
                  <tr>
                    <UberTh>Order Details</UberTh>
                    <UberTh>Vendor</UberTh>
                    <UberTh>Customer Paid</UberTh>
                    <UberTh>Vendor Net</UberTh>
                    <UberTh>Rider Share</UberTh>
                    <UberTh>Platform Net</UberTh>
                    <UberTh></UberTh>
                  </tr>
                </UberThead>
                <tbody>
                  {isLoading ? (
                    <UberTr><UberTd colSpan={7} className="text-center py-8">Loading orders...</UberTd></UberTr>
                  ) : processedOrders.length === 0 ? (
                    <UberTr><UberTd colSpan={7} className="text-center py-12 text-neutral-500">No delivered orders match your search.</UberTd></UberTr>
                  ) : (
                    processedOrders.map((o) => (
                      <UberTr key={o.id}>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs font-mono text-neutral-900">{o.id.substring(0, 8)}...</span>
                            <span className="text-xs text-neutral-500">{format(new Date(o.created_at), "MMM d, h:mm a")}</span>
                          </div>
                        </UberTd>
                        <UberTd className="font-medium text-neutral-900">{(o.vendors as any)?.name || 'Unknown'}</UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatMoney(o.financials.total, "NGN")}</span>
                            <span className="text-xs text-neutral-500 capitalize">{o.payment_method.replace('_', ' ')}</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-green-700">{formatMoney(o.financials.vendorNet, "NGN")}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">Less 15% Comm.</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-orange-600">{formatMoney(o.financials.riderPayout, "NGN")}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">80% of Del. Fee</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-brand-core">{formatMoney(o.financials.platformNet, "NGN")}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">Comm. + 20% Fee</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex items-center gap-2 justify-end">
                            <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="View Order">
                              <ArrowRight className="h-4 w-4" />
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
      </div>
    </AdminShell>
  );
}
