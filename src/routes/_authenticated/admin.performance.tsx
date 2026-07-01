import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/performance")({
  component: AdminPerformance,
});

function AdminPerformance() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Performance"
        description="Sales, acceptance, cancellation, prep and delivery times per store and city."
        kpis={[
          { label: "Acceptance rate", value: "—", Icon: CheckCircle2, accent: "green" },
          { label: "Cancellation rate", value: "—", Icon: XCircle, accent: "orange" },
          { label: "Avg. prep time", value: "—", Icon: Clock, accent: "ink" },
          { label: "Avg. delivery time", value: "—", Icon: TrendingUp, accent: "green" }
        ]}
        sections={[
          { title: "Metrics tracked", description: "", items: ["Sales performance","Order volume","Acceptance rate","Cancellation rate","Avg. preparation time","Delivery time","Customer rating","Repeat customer rate","Vendor ranking"] },
          { title: "Views", description: "", items: ["Per store","Per city","Per cuisine","Per weekday","Peak hours","Season vs. baseline"] }
        ]}
      />
    </AdminShell>
  );
}
