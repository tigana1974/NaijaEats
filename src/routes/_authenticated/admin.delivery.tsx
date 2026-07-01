import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Truck, MapPin, Wallet, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  component: AdminDelivery,
});

function AdminDelivery() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Delivery settings"
        description="Zones, radius, fees, assignment rules, scheduling and country-specific settings."
        kpis={[
          { label: "Delivery zones", value: "—", Icon: MapPin, accent: "green" },
          { label: "Free-delivery threshold", value: "—", Icon: Wallet, accent: "orange" },
          { label: "Avg. radius (km)", value: "—", Icon: Truck, accent: "green" },
          { label: "Scheduled deliveries", value: "—", Icon: Clock, accent: "ink" }
        ]}
        sections={[
          { title: "Configuration", description: "", items: ["Delivery zones","Delivery radius","Delivery fees","Free delivery threshold","Rider assignment rules","Pickup option","Scheduled delivery","Cash on delivery rules","Country / city-specific settings"] },
          { title: "Assignment rules", description: "", items: ["Proximity first","Highest rating","Fewest active jobs","Fair distribution","Manual override","Auto-reassign on delay"] }
        ]}
      />
    </AdminShell>
  );
}
