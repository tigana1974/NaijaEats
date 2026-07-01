import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { UserPlus, Repeat, TrendingUp, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customer-insights")({
  component: AdminCustomerInsights,
});

function AdminCustomerInsights() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Customer insights"
        description="New vs. returning customers, LTV, top spenders, search trends and demand."
        kpis={[
          { label: "New customers (30d)", value: "—", Icon: UserPlus, accent: "green" },
          { label: "Returning customers (30d)", value: "—", Icon: Repeat, accent: "orange" },
          { label: "Median LTV", value: "—", Icon: TrendingUp, accent: "green" },
          { label: "Hot demand zones", value: "—", Icon: MapPin, accent: "ink" }
        ]}
        sections={[
          { title: "Insights", description: "", items: ["New customers","Returning customers","Customer lifetime value","Top customers","Most ordered meals","Search trends","Location demand","Customer retention"] },
          { title: "Segments", description: "", items: ["Weekend regulars","Late-night orderers","High-AOV households","Grocery-heavy","Party caterers","First-order customers","Churn risk"] }
        ]}
      />
    </AdminShell>
  );
}
