import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Settings2, Hash, Image, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/invoice-settings")({
  component: AdminInvoiceSettings,
});

function AdminInvoiceSettings() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Invoice settings"
        description="Configure company details, VAT/tax numbers, numbering, logo and footer notes."
        kpis={[
          
        ]}
        sections={[
          { title: "Company details", description: "", items: ["Company name","Company address","VAT / tax number","Invoice numbering","Invoice logo","Invoice footer notes"] },
          { title: "Tax by country", description: "", items: ["UK VAT rules","Nigeria VAT rules","Reverse charge cases","Zero-rated categories","Regional overrides"] }
        ]}
      />
    </AdminShell>
  );
}
