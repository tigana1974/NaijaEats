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
  uberBtn,
  formatMoney
} from "@/components/admin/AdminUI";
import { Megaphone, Eye, MousePointerClick, Wallet, Plus, Play, Pause, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

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
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const { data: vendorOptions } = useQuery({
    queryKey: ["admin-ads-vendor-options"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vendor_ads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Campaign ${vars.status === "active" ? "activated" : vars.status}`);
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update campaign"),
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from("vendor_ads").insert({
        vendor_id: formData.vendor_id,
        title: formData.title,
        type: formData.type,
        status: "active",
        budget: Number(formData.budget || 0),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(`${formData.end_date}T23:59:59`).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ad campaign created and active");
      setIsCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
    },
    onError: (err: any) => toast.error(`Failed to create ad: ${err.message}`),
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
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-clay px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-neutral-800"
              >
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
                        <p className="text-base font-medium text-neutral-900">No ad campaigns yet</p>
                        <p className="text-sm mt-1">Use "New Ad Setup" to create the first sponsored placement.</p>
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
                            <button
                              onClick={() => setStatus.mutate({ id: ad.id, status: "paused" })}
                              disabled={setStatus.isPending}
                              className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500"
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          ) : ad.status === 'completed' ? (
                            <span className="p-2 text-neutral-300" title="Completed">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              onClick={() => setStatus.mutate({ id: ad.id, status: "active" })}
                              disabled={setStatus.isPending}
                              className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500"
                              title="Activate"
                            >
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

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle>New Ad Setup</SheetTitle>
            <SheetDescription>
              Create a sponsored placement for a vendor. It goes live immediately.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate(Object.fromEntries(fd));
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <select required name="vendor_id" defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" disabled>Select a vendor…</option>
                {(vendorOptions ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Title</label>
              <input required name="title" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Homepage boost — December" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Placement</label>
                <select name="type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="featured">Featured slot</option>
                  <option value="banner">Banner</option>
                  <option value="search_boost">Search boost</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget (₦)</label>
                <input required name="budget" type="number" min="0" step="0.01" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="50000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <input name="start_date" type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <input name="end_date" type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>

            <SheetFooter className="mt-8 pt-4 border-t">
              <SheetClose asChild>
                <button type="button" className={uberBtn.secondary}>Cancel</button>
              </SheetClose>
              <button type="submit" disabled={createMutation.isPending} className={uberBtn.primary}>
                {createMutation.isPending ? "Creating..." : "Launch Campaign"}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
