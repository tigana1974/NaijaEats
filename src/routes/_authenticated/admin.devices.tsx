import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Smartphone, Tablet, Laptop, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/devices")({
  component: AdminDevices,
});

function AdminDevices() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Devices"
        description="Track devices used by store staff, riders and admins with remote logout."
        kpis={[
          { label: "Active devices", value: "—", Icon: Smartphone, accent: "green" },
          { label: "Tablets in stores", value: "—", Icon: Tablet, accent: "orange" },
          { label: "Admin laptops", value: "—", Icon: Laptop, accent: "ink" },
          { label: "Suspicious sessions", value: 0, Icon: ShieldAlert, accent: "orange" }
        ]}
        sections={[
          { title: "Fields tracked", description: "", items: ["Device name","Last login","IP address","App version","Device status","Owner (staff / rider / admin)"] },
          { title: "Actions", description: "", items: ["Force logout","Block device","Rotate token","Send push","Flag for review","Audit log"] }
        ]}
      />
    </AdminShell>
  );
}
