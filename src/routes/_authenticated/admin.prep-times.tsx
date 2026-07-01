import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { UberPageTitle } from "@/components/admin/AdminUI";
import { Clock, Timer, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/prep-times")({
  component: AdminPrepTimes,
});

function AdminPrepTimes() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    default_prep_time: 15,
    busy_multiplier: 1.5,
    auto_extend_backlog: true,
    max_prep_time: 90,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-prep-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select(`*`)
        .eq('key', 'prep_settings')
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
          key: 'prep_settings', 
          value: formData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prep time settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-prep-settings"] });
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
          title="Preparation Times"
          description="Configure global defaults for order preparation and busy-period automation."
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
              <Clock className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Default Times</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Default Prep Time (Minutes)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.default_prep_time}
                  onChange={(e) => setFormData({...formData, default_prep_time: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Base preparation time for restaurants.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Max Allowed Prep Time (Minutes)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.max_prep_time}
                  onChange={(e) => setFormData({...formData, max_prep_time: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Hard limit on what vendors can set.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <Timer className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Automation & Busy Periods</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Busy Period Multiplier</label>
                <input 
                  type="number" step="0.1"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.busy_multiplier}
                  onChange={(e) => setFormData({...formData, busy_multiplier: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">How much to multiply prep time when store is busy (e.g., 1.5x).</p>
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <input 
                    type="checkbox"
                    className="rounded border-neutral-300 text-brand-core focus:ring-brand-core"
                    checked={formData.auto_extend_backlog}
                    onChange={(e) => setFormData({...formData, auto_extend_backlog: e.target.checked})}
                  />
                  Auto-extend prep time during backlogs
                </label>
                <p className="text-xs text-neutral-500 ml-6">Automatically delay new orders if queue exceeds 10 active orders.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
