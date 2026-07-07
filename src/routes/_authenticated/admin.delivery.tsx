// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
} from "@/components/admin/AdminUI";
import { Truck, MapPin, Wallet, Save, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  component: AdminDelivery,
});

function AdminDelivery() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    base_fee: 1500,
    per_km_fee: 150,
    max_radius_km: 15,
    free_delivery_threshold: 25000,
    surge_multiplier: 1.0,
    rider_cut_percentage: 80,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-delivery-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select(`*`)
        .eq('key', 'delivery_settings')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.value) {
        setFormData({ ...formData, ...(data.value as any) });
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ 
          key: 'delivery_settings', 
          value: formData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delivery settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-settings"] });
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    }
  });

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Logistics"
          title="Delivery Settings"
          description="Configure global delivery fees, radius limits, and rider compensation."
          actions={
            <button 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-full bg-brand-clay px-6 py-2.5 text-sm font-semibold text-brand-cream hover:bg-neutral-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          }
        />

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Pricing & Fees</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Base Delivery Fee (NGN)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.base_fee}
                  onChange={(e) => setFormData({...formData, base_fee: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Per-Kilometer Fee (NGN)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.per_km_fee}
                  onChange={(e) => setFormData({...formData, per_km_fee: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Free Delivery Threshold (NGN)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.free_delivery_threshold}
                  onChange={(e) => setFormData({...formData, free_delivery_threshold: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Orders above this amount get free delivery.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Active Surge Multiplier</label>
                <input 
                  type="number" step="0.1"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.surge_multiplier}
                  onChange={(e) => setFormData({...formData, surge_multiplier: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">1.0 = normal. 1.5 = 50% increase (bad weather, etc).</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Logistics Rules</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Maximum Delivery Radius (km)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.max_radius_km}
                  onChange={(e) => setFormData({...formData, max_radius_km: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Customers beyond this distance cannot order.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Rider Payout Cut (%)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.rider_cut_percentage}
                  onChange={(e) => setFormData({...formData, rider_cut_percentage: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Percentage of delivery fee that goes to the rider.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
