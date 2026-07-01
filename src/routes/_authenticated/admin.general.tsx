import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, PageBody, Card, CardHeader, btn } from "@/components/admin/AdminUI";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/general")({
  component: AdminGeneral,
});

type FormValues = {
  platform_name: string;
  default_currency: string;
  default_service_charge_pct: number;
  default_commission_pct: number;
  cash_on_delivery_enabled: boolean;
  wallet_payments_enabled: boolean;
  referral_program_enabled: boolean;
};

function AdminGeneral() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: settings || {
      platform_name: "Naija Eats",
      default_currency: "NGN",
      default_service_charge_pct: 5,
      default_commission_pct: 15,
      cash_on_delivery_enabled: true,
      wallet_payments_enabled: true,
      referral_program_enabled: true,
    }
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("platform_settings").update(values).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings");
    }
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <AdminShell>
      <PageHeader
        title="General Settings"
        description="Configure core platform settings and feature flags."
        breadcrumb={["Admin", "Settings", "General"]}
      />
      <PageBody>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl grid gap-6">
          <Card>
            <CardHeader title="Platform Details" description="Basic information about the platform." />
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Platform Name</label>
                <input
                  {...register("platform_name", { required: true })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Default Currency</label>
                <select
                  {...register("default_currency", { required: true })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Default Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("default_commission_pct", { required: true, valueAsNumber: true })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Default Service Charge (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("default_service_charge_pct", { required: true, valueAsNumber: true })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Feature Flags" description="Toggle platform-wide features." />
            <div className="p-5 grid gap-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register("cash_on_delivery_enabled")}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--naija-green)] focus:ring-[var(--naija-green)]"
                />
                <span className="text-sm font-medium">Enable Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register("wallet_payments_enabled")}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--naija-green)] focus:ring-[var(--naija-green)]"
                />
                <span className="text-sm font-medium">Enable Wallet Payments</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register("referral_program_enabled")}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--naija-green)] focus:ring-[var(--naija-green)]"
                />
                <span className="text-sm font-medium">Enable Referral Programme</span>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className={btn.primary}
            >
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </PageBody>
    </AdminShell>
  );
}
