// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
} from "@/components/admin/AdminUI";
import { Settings2, Save, FileText, Percent, Image } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/invoice-settings")({
  component: AdminInvoiceSettings,
});

function AdminInvoiceSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tax_rate_percent: 7.5,
    default_commission_percent: 15,
    invoice_generation_day: 1,
    payment_terms_days: 14,
    company_name: "Naija Eats Ltd",
    company_address: "123 Lagos Way, VI",
    tax_number: "TIN-0000000",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-invoice-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_config")
        .select(`*`)
        .eq('key', 'invoice_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setFormData({ ...formData, ...(data.value as any) });
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("platform_config")
        .upsert({
          key: 'invoice_settings',
          value: formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-invoice-settings"] });
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    }
  });

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Finance"
          title="Invoice Settings"
          description="Configure default tax rates, commissions, and company details for vendor invoices."
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
              <Percent className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Rates & Terms</h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Default Commission Rate (%)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.default_commission_percent}
                  onChange={(e) => setFormData({...formData, default_commission_percent: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">VAT / Tax Rate (%)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.tax_rate_percent}
                  onChange={(e) => setFormData({...formData, tax_rate_percent: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Invoice Generation Day of Month</label>
                <input 
                  type="number" min="1" max="28"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.invoice_generation_day}
                  onChange={(e) => setFormData({...formData, invoice_generation_day: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Day of the month to auto-generate statements.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Payment Terms (Days)</label>
                <input 
                  type="number"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.payment_terms_days}
                  onChange={(e) => setFormData({...formData, payment_terms_days: Number(e.target.value)})}
                />
                <p className="text-xs text-neutral-500">Number of days before an invoice becomes overdue.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-neutral-50/50 p-5 flex items-center gap-3">
              <FileText className="h-5 w-5 text-neutral-500" />
              <h3 className="font-semibold text-lg">Company Details (For PDFs)</h3>
            </div>
            <div className="p-6 grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Legal Company Name</label>
                <input 
                  type="text"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Registered Address</label>
                <textarea 
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  rows={3}
                  value={formData.company_address}
                  onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Tax / TIN Number</label>
                <input 
                  type="text"
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
