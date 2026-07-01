import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { FileText, Percent, Calendar, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  component: AdminInvoices,
});

function AdminInvoices() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Invoices"
        description="Vendor, commission, and VAT invoices with downloadable PDF statements."
        kpis={[
          { label: "Invoices this month", value: "—", Icon: FileText, accent: "green" },
          { label: "VAT invoices", value: "—", Icon: Percent, accent: "orange" },
          { label: "Monthly statements", value: "—", Icon: Calendar, accent: "green" },
          { label: "Ready to download", value: "—", Icon: Download, accent: "ink" }
        ]}
        sections={[
          { title: "Types", description: "", items: ["Vendor invoices","Commission invoices","Monthly statements","VAT invoices where applicable","Downloadable PDF invoices"] },
          { title: "Actions", description: "", items: ["Batch download","Send to accountant","Regenerate PDF","Archive","Reissue with correction"] }
        ]}
      />
    </AdminShell>
  );
}
