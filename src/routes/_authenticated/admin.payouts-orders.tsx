import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { ReceiptText, PercentCircle, Truck, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payouts-orders")({
  component: AdminPayoutsByOrder,
});

function AdminPayoutsByOrder() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Payouts by order"
        description="Per-order breakdown of commission, fees, refunds, vendor and rider payout."
        kpis={[
          { label: "Orders (30d)", value: "—", Icon: ReceiptText, accent: "green" },
          { label: "Commission (30d)", value: "—", Icon: PercentCircle, accent: "orange" },
          { label: "Rider payout (30d)", value: "—", Icon: Truck, accent: "green" },
          { label: "Platform earnings", value: "—", Icon: Building2, accent: "ink" }
        ]}
        sections={[
          { title: "Per-order columns", description: "", items: ["Order ID","Gross order amount","Commission","Delivery fee","Service charge","Refunds","Vendor net payout","Rider payout","Platform earnings"] },
          { title: "Views", description: "", items: ["By store","By city","By day","By payment method","By currency","Reconciliation view"] }
        ]}
      />
    </AdminShell>
  );
}
