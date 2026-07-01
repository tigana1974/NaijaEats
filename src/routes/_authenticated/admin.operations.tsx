import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Activity, Truck, AlertTriangle, Handshake } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  component: AdminOperations,
});

function AdminOperations() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Operations"
        description="Live monitoring, delivery assignment, and manual intervention across the network."
        kpis={[
          { label: "Live orders", value: "—", Icon: Activity, accent: "green" },
          { label: "Riders on shift", value: "—", Icon: Truck, accent: "green" },
          { label: "Delayed orders", value: 0, Icon: AlertTriangle, accent: "orange" },
          { label: "Interventions today", value: 0, Icon: Handshake, accent: "ink" }
        ]}
        sections={[
          { title: "Live monitoring", description: "", items: ["Live order map","Delivery assignment","Rider availability","Vendor delays","Failed orders","Customer complaints","Manual intervention"] },
          { title: "Zones & routing", description: "", items: ["Delivery zone editor","Zone-based commission","Radius overrides","Peak-hour routing","Auto-dispatch rules"] }
        ]}
      />
    </AdminShell>
  );
}
