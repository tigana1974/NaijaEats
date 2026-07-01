import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Clock, Utensils, Timer, BellRing } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/prep-times")({
  component: AdminPrepTimes,
});

function AdminPrepTimes() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Preparation times"
        description="Default, dish-specific and busy-period preparation times with delay alerts."
        kpis={[
          { label: "Default prep (min)", value: "—", Icon: Clock, accent: "green" },
          { label: "Dish-level overrides", value: "—", Icon: Utensils, accent: "orange" },
          { label: "Busy-period prep (min)", value: "—", Icon: Timer, accent: "ink" },
          { label: "Delay notifications (30d)", value: "—", Icon: BellRing, accent: "orange" }
        ]}
        sections={[
          { title: "Configuration", description: "", items: ["Default prep time","Dish-specific prep time","Busy period prep time","Automatic prep time adjustment","Delay notifications"] },
          { title: "Automation", description: "", items: ["Auto extend on backlog","Pause new orders","Notify customer & rider","Escalate to support"] }
        ]}
      />
    </AdminShell>
  );
}
