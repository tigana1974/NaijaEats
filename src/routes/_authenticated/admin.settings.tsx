import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Settings2, Globe, Coins, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Settings"
        description="Platform-wide countries, currencies, commissions, taxes and notifications."
        kpis={[
          { label: "Countries live", value: 2, Icon: Globe, accent: "green" },
          { label: "Currencies", value: 2, Icon: Coins, accent: "orange" },
          { label: "Commission rules", value: "—", Icon: Settings2, accent: "green" },
          { label: "Notification channels", value: 4, Icon: Bell, accent: "ink" }
        ]}
        sections={[
          { title: "General system", description: "", items: ["Platform name","Countries","Cities","Currency","Service charge","Commission rules","Tax settings","Notification settings","App settings","Payment settings"] },
          { title: "Feature flags", description: "", items: ["Cash on delivery","Scheduled orders","Wallet payments","Referral programme","Vendor financing","Group orders (beta)"] }
        ]}
      />
    </AdminShell>
  );
}
