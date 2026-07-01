import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendorsRedirect,
});

function AdminVendorsRedirect() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Vendors"
        description="Vendor management has moved — use the Stores section for the full experience."
        kpis={[
          
        ]}
        sections={[
          { title: "Where to find things", description: "", items: ["Go to Stores for the full list","Store groups for cohorts","Documents for KYC and licences","Users & roles for staff access"] }
        ]}
      />
    </AdminShell>
  );
}
