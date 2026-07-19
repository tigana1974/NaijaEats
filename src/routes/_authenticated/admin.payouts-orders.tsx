// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
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
  const { region, currency: regionCurrency, countryLabel } = useAdminRegion();
  const kpiCurrency = regionCurrency ?? "NGN";
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts-orders", region],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select(`
          id, total, delivery_fee, currency, created_at, status, payment_method,
          vendors (name)
        `)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(100);
      if (regionCurrency) q = q.eq("currency", regionCurrency);

      // Split rates come from live platform configuration, not hardcoded values.
      const [ordersRes, settingsRes, deliveryRes] = await Promise.all([
        q,
        supabase.from("platform_settings").select("default_commission_pct").maybeSingle(),
        supabase
          .from("delivery_settings")
          .select("country, rider_cut_percentage")
          .then((r) => r),
      ]);
      if (ordersRes.error) throw ordersRes.error;

      const commissionPct = Number(settingsRes.data?.default_commission_pct ?? 15);
      const riderCuts = new Map(
        (deliveryRes.data ?? []).map((d: any) => [d.country, Number(d.rider_cut_percentage ?? 80)]),
      );
      const riderCutPct =
        (regionCurrency === "GBP" ? riderCuts.get("UK") : riderCuts.get("NG")) ??
        [...riderCuts.values()][0] ??
        80;

      return { orders: ordersRes.data ?? [], commissionPct, riderCutPct };
    },
  });

  const orders = data?.orders;
  const commissionPct = data?.commissionPct ?? 15;
  const riderCutPct = data?.riderCutPct ?? 80;

  const processedOrders = (orders || [])
    .filter(o =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.vendors as any)?.name.toLowerCase().includes(search.toLowerCase())
    )
    .map(o => {
      const total = Number(o.total || 0);
      const delFee = Number(o.delivery_fee || 0);
      const subtotal = total - delFee;

      const commission = subtotal * (commissionPct / 100);
      const vendorNet = subtotal - commission;
      const riderPayout = delFee * (riderCutPct / 100);
      const platformNet = commission + delFee * (1 - riderCutPct / 100);

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
          title={`Order Reconciliation — ${countryLabel}`}
          description={`Per-order breakdown using your configured rates: ${commissionPct}% commission, ${riderCutPct}% rider share of delivery fees.`}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Total Orders (Shown)" value={isLoading ? "…" : kpis.volume} Icon={ReceiptText} accent="blue" />
          <UberKpi label="Total Commission" value={isLoading ? "…" : formatMoney(kpis.commission, kpiCurrency)} Icon={PercentCircle} accent="green" />
          <UberKpi label="Rider Payouts" value={isLoading ? "…" : formatMoney(kpis.riderShare, kpiCurrency)} Icon={Truck} accent="orange" />
          <UberKpi label="Net Platform Earnings" value={isLoading ? "…" : formatMoney(kpis.platformNet, kpiCurrency)} Icon={Building2} accent="ink" />
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
                            <span className="font-medium">{formatMoney(o.financials.total, o.currency || kpiCurrency)}</span>
                            <span className="text-xs text-neutral-500 capitalize">{o.payment_method.replace('_', ' ')}</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-green-700">{formatMoney(o.financials.vendorNet, o.currency || kpiCurrency)}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">Less 15% Comm.</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-orange-600">{formatMoney(o.financials.riderPayout, o.currency || kpiCurrency)}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">80% of Del. Fee</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-brand-core">{formatMoney(o.financials.platformNet, o.currency || kpiCurrency)}</span>
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
