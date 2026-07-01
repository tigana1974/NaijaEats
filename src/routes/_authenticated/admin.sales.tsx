import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { TrendingUp, Banknote, Receipt, PercentCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sales")({
  component: AdminSales,
});

function AdminSales() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Sales"
        description="Gross and net sales, commission, delivery fees, refunds and discounts."
        kpis={[
          { label: "Gross sales", value: "—", Icon: TrendingUp, accent: "green" },
          { label: "Net sales", value: "—", Icon: Banknote, accent: "green" },
          { label: "Commission earned", value: "—", Icon: Receipt, accent: "orange" },
          { label: "Refunds & discounts", value: "—", Icon: PercentCircle, accent: "ink" }
        ]}
        sections={[
          { title: "Breakdown", description: "", items: ["Gross sales","Net sales","Commission earned","Delivery fees","Service charges","Refunds","Discounts"] },
          { title: "Cuts by", description: "", items: ["Day / week / month","Store","City","Country","Cuisine","Payment method"] }
        ]}
      />
    </AdminShell>
  );
}
