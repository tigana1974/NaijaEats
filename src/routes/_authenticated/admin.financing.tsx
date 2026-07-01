import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { HandCoins, Gauge, TrendingUp, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financing")({
  component: AdminFinancing,
});

function AdminFinancing() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Financing"
        description="Vendor cash advance, loan eligibility and sales-based financing."
        kpis={[
          { label: "Active advances", value: "—", Icon: HandCoins, accent: "green" },
          { label: "Eligible vendors", value: "—", Icon: Gauge, accent: "orange" },
          { label: "Repaid this month", value: "—", Icon: TrendingUp, accent: "green" },
          { label: "Applications open", value: "—", Icon: FileText, accent: "ink" }
        ]}
        sections={[
          { title: "Programme", description: "", items: ["Vendor cash advance","Loan eligibility","Sales-based financing","Repayment tracking","Financing application status"] },
          { title: "Risk model", description: "", items: ["Sales stability","Chargeback ratio","Cancellation rate","Menu maturity","Verification tier","Age of vendor"] }
        ]}
      />
    </AdminShell>
  );
}
