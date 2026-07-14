import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
import { UberPageTitle } from "@/components/admin/AdminUI";
import { MapPin, Wallet, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  component: AdminDelivery,
});

type DeliveryForm = {
  base_fee: number;
  per_km_fee: number;
  max_radius_km: number;
  free_delivery_threshold: number;
  surge_multiplier: number;
  rider_cut_percentage: number;
};

const DEFAULTS: Record<"NG" | "UK", DeliveryForm> = {
  NG: { base_fee: 1500, per_km_fee: 150, max_radius_km: 15, free_delivery_threshold: 25000, surge_multiplier: 1.0, rider_cut_percentage: 80 },
  UK: { base_fee: 3.5, per_km_fee: 0.8, max_radius_km: 10, free_delivery_threshold: 30, surge_multiplier: 1.0, rider_cut_percentage: 80 },
};

const COUNTRY_META: Record<"NG" | "UK", { label: string; currency: string; symbol: string }> = {
  NG: { label: "Nigeria", currency: "NGN", symbol: "₦" },
  UK: { label: "United Kingdom", currency: "GBP", symbol: "£" },
};

function AdminDelivery() {
  const queryClient = useQueryClient();
  const { country: regionCountry } = useAdminRegion();
  // When a specific region is selected in the sidebar the editor locks to it;
  // in "All regions" the parent picks which market to edit via the tabs.
  const [editCountry, setEditCountry] = useState<"NG" | "UK">(regionCountry ?? "NG");
  const [formData, setFormData] = useState<DeliveryForm>(DEFAULTS[regionCountry ?? "NG"]);

  useEffect(() => {
    if (regionCountry) setEditCountry(regionCountry);
  }, [regionCountry]);

  const meta = COUNTRY_META[editCountry];

  const { isLoading } = useQuery({
    queryKey: ["admin-delivery-settings", editCountry],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_settings")
        .select("*")
        .eq("country", editCountry)
        .maybeSingle();
      if (error) throw error;
      setFormData(
        data
          ? {
              base_fee: Number(data.base_fee),
              per_km_fee: Number(data.per_km_fee),
              max_radius_km: Number(data.max_radius_km),
              free_delivery_threshold: Number(data.free_delivery_threshold),
              surge_multiplier: Number(data.surge_multiplier),
              rider_cut_percentage: Number(data.rider_cut_percentage),
            }
          : DEFAULTS[editCountry],
      );
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("delivery_settings").upsert({
        country: editCountry,
        ...formData,
        updated_at: new Date().toISOString(),
        updated_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${meta.label} delivery settings saved`);
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-settings", editCountry] });
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const set = (patch: Partial<DeliveryForm>) => setFormData((f) => ({ ...f, ...patch }));

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Logistics"
          title={`Delivery Settings — ${meta.label}`}
          description={`Fees, radius limits, and rider compensation for the ${meta.label} market (${meta.currency}).`}
          actions={
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || isLoading}
              className="flex items-center gap-2 rounded-full bg-brand-clay px-6 py-2.5 text-sm font-semibold text-brand-cream hover:bg-neutral-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : `Save ${editCountry} Settings`}
            </button>
          }
        />

        {!regionCountry && (
          <div className="mt-2 inline-flex rounded-full bg-neutral-100 p-1">
            {(["NG", "UK"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditCountry(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  editCountry === c ? "bg-white shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {COUNTRY_META[c].label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Pricing &amp; Fees ({meta.currency})</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <Field
                label={`Base Delivery Fee (${meta.symbol})`}
                value={formData.base_fee}
                step={editCountry === "UK" ? 0.1 : 1}
                disabled={isLoading}
                onChange={(v) => set({ base_fee: v })}
              />
              <Field
                label={`Per-Kilometer Fee (${meta.symbol})`}
                value={formData.per_km_fee}
                step={editCountry === "UK" ? 0.05 : 1}
                disabled={isLoading}
                onChange={(v) => set({ per_km_fee: v })}
              />
              <Field
                label={`Free Delivery Threshold (${meta.symbol})`}
                value={formData.free_delivery_threshold}
                step={editCountry === "UK" ? 1 : 500}
                disabled={isLoading}
                hint={`Orders above this amount get free delivery in ${meta.label}.`}
                onChange={(v) => set({ free_delivery_threshold: v })}
              />
              <Field
                label="Active Surge Multiplier"
                value={formData.surge_multiplier}
                step={0.1}
                disabled={isLoading}
                hint="1.0 = normal. 1.5 = 50% increase (bad weather, etc)."
                onChange={(v) => set({ surge_multiplier: v })}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Logistics Rules</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <Field
                label="Maximum Delivery Radius (km)"
                value={formData.max_radius_km}
                disabled={isLoading}
                hint="Customers beyond this distance cannot order."
                onChange={(v) => set({ max_radius_km: v })}
              />
              <Field
                label="Rider Payout Cut (%)"
                value={formData.rider_cut_percentage}
                disabled={isLoading}
                hint="Percentage of delivery fee that goes to the rider."
                onChange={(v) => set({ rider_cut_percentage: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  step = 1,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <input
        type="number"
        step={step}
        disabled={disabled}
        className="w-full rounded-md border border-neutral-300 p-2 text-sm disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
