import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { CalendarClock, CalendarX, CalendarCheck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/holiday-hours")({
  component: AdminHolidayHours,
});

function AdminHolidayHours() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Holiday hours"
        description="Set holiday and special-event hours per store, with admin override."
        kpis={[
          { label: "Upcoming holidays", value: "—", Icon: CalendarClock, accent: "green" },
          { label: "Stores closed today", value: "—", Icon: CalendarX, accent: "orange" },
          { label: "Special hours today", value: "—", Icon: CalendarCheck, accent: "green" },
          { label: "Admin overrides", value: "—", Icon: ShieldCheck, accent: "ink" }
        ]}
        sections={[
          { title: "Store-set", description: "", items: ["Holiday opening hours","Temporary closure","Special event hours","Public holiday schedule"] },
          { title: "Admin controls", description: "", items: ["Admin override","Bulk apply to city","Bulk apply to cuisine","Reset to normal hours"] }
        ]}
      />
    </AdminShell>
  );
}
