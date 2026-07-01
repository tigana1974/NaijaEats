import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, PageBody, KpiCard, Card, CardHeader, btn } from "@/components/admin/AdminUI";
import { Settings2, Globe, Coins, Bell, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <PageHeader
        title="Settings"
        description="Platform-wide countries, currencies, commissions, taxes and notifications."
        actions={
          <Link to="/admin/general" className={btn.primary}>
            <Settings2 className="h-4 w-4" />
            Edit Settings
          </Link>
        }
      />
      
      <PageBody>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Platform Name" value={settings?.platform_name ?? "Loading..."} Icon={Globe} accent="green" />
          <KpiCard label="Currency" value={settings?.default_currency ?? "Loading..."} Icon={Coins} accent="orange" />
          <KpiCard label="Default Commission" value={`${settings?.default_commission_pct ?? 0}%`} Icon={Settings2} accent="green" />
          <KpiCard label="Service Charge" value={`${settings?.default_service_charge_pct ?? 0}%`} Icon={Bell} accent="ink" />
        </div>

        <Card>
          <CardHeader title="Feature Flags" description="Global feature toggles" />
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-sm">Cash on Delivery</div>
                <div className="text-xs text-muted-foreground mt-0.5">Allow customers to pay with cash.</div>
              </div>
              {settings?.cash_on_delivery_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--naija-green)]" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-sm">Wallet Payments</div>
                <div className="text-xs text-muted-foreground mt-0.5">Allow payments using in-app wallets.</div>
              </div>
              {settings?.wallet_payments_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--naija-green)]" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-sm">Referral Programme</div>
                <div className="text-xs text-muted-foreground mt-0.5">Enable rewards for referring friends.</div>
              </div>
              {settings?.referral_program_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--naija-green)]" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </Card>
      </PageBody>
    </AdminShell>
  );
}
