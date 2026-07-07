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
import { Megaphone, Eye, MousePointerClick, Wallet, Plus, Play, Pause } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ads")({
  component: AdminAds,
});

type VendorAd = {
  id: string;
  vendor_id: string;
  title: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  vendors?: { name: string };
};

function AdminAds() {
  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_ads")
        .select(`
          *,
          vendors (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as any) as VendorAd[];
    },
  });

  const kpis = {
    active: ads?.filter(a => a.status === 'active').length || 0,
    impressions: ads?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0,
    clicks: ads?.reduce((sum, a) => sum + (a.clicks || 0), 0) || 0,
    spend: ads?.reduce((sum, a) => sum + Number(a.spent || 0), 0) || 0,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Marketing & Growth"
          title="Vendor Advertising"
          description="Manage sponsored placements and track vendor ad spend."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Active Campaigns" value={isLoading ? "…" : kpis.active} Icon={Megaphone} accent="green" />
          <UberKpi label="Total Impressions" value={isLoading ? "…" : kpis.impressions.toLocaleString()} Icon={Eye} accent="blue" />
          <UberKpi label="Total Clicks" value={isLoading ? "…" : kpis.clicks.toLocaleString()} Icon={MousePointerClick} accent="orange" />
          <UberKpi label="Ad Spend Generated" value={isLoading ? "…" : formatMoney(kpis.spend, "NGN")} Icon={Wallet} accent="ink" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5 bg-neutral-50/50">
              <h3 className="font-semibold text-lg">Campaigns</h3>
              <button className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800">
                <Plus className="h-4 w-4" />
                New Ad Setup
              </button>
            </div>
            
            <UberTable>
              <UberThead>
                <tr>
                  <UberTh>Vendor</UberTh>
                  <UberTh>Campaign</UberTh>
                  <UberTh>Type</UberTh>
                  <UberTh>Status</UberTh>
                  <UberTh>Budget</UberTh>
                  <UberTh>Performance</UberTh>
                  <UberTh></UberTh>
                </tr>
              </UberThead>
              <tbody>
                {isLoading ? (
                  <UberTr><UberTd colSpan={7} className="text-center py-8">Loading campaigns...</UberTd></UberTr>
                ) : !ads || ads.length === 0 ? (
                  <UberTr>
                    <UberTd colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Megaphone className="h-12 w-12 mb-3 text-neutral-300" />
                        <p className="text-base font-medium text-neutral-900">No active ad campaigns</p>
                        <p className="text-sm mt-1">Vendors can boost their stores from their dashboard.</p>
                      </div>
                    </UberTd>
                  </UberTr>
                ) : (
                  ads.map((ad) => (
                    <UberTr key={ad.id}>
                      <UberTd className="font-medium text-neutral-900">{ad.vendors?.name || 'Unknown'}</UberTd>
                      <UberTd>{ad.title}</UberTd>
                      <UberTd className="capitalize">{ad.type.replace('_', ' ')}</UberTd>
                      <UberTd>
                        <UberStatus 
                          status={ad.status} 
                          variant={ad.status === 'active' ? 'success' : ad.status === 'paused' ? 'warning' : 'neutral'}
                        />
                      </UberTd>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatMoney(ad.budget, "NGN")}</span>
                          <span className="text-xs text-neutral-500">{formatMoney(ad.spent, "NGN")} spent</span>
                        </div>
                      </UberTd>
                      <UberTd>
                        <div className="flex flex-col">
                          <span className="text-sm">{ad.impressions.toLocaleString()} views</span>
                          <span className="text-xs text-neutral-500">{ad.clicks.toLocaleString()} clicks</span>
                        </div>
                      </UberTd>
                      <UberTd>
                        <div className="flex items-center gap-2 justify-end">
                          {ad.status === 'active' ? (
                            <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="Pause">
                              <Pause className="h-4 w-4" />
                            </button>
                          ) : (
                            <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="Activate">
                              <Play className="h-4 w-4" />
                            </button>
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
      </div>
    </AdminShell>
  );
}
