import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { CreditCard, AlertOctagon, RotateCcw, ReceiptText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Payments"
        description="Stripe (UK), Paystack (Nigeria), bank transfer, wallet and cash on delivery."
        kpis={[
          { label: "Payments (30d)", value: "—", Icon: CreditCard, accent: "green" },
          { label: "Failed payments", value: "—", Icon: AlertOctagon, accent: "orange" },
          { label: "Refunds", value: "—", Icon: RotateCcw, accent: "ink" },
          { label: "Chargebacks", value: "—", Icon: ReceiptText, accent: "orange" }
        ]}
        sections={[
          { title: "Providers & methods", description: "", items: ["Stripe (UK)","Paystack (Nigeria)","Bank transfer","Wallet","Cash on delivery"] },
          { title: "Tracking", description: "", items: ["Payment status","Failed payments","Refunds","Chargebacks","Vendor settlement","Rider payment"] }
        ]}
      />
    </AdminShell>
  );
}
