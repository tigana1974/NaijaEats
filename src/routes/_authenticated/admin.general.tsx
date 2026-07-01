import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Info, Mail, Phone, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/general")({
  component: AdminGeneral,
});

function AdminGeneral() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="General"
        description="Business profile, support contacts, terms & privacy, and app version."
        kpis={[
          
        ]}
        sections={[
          { title: "Business profile", description: "", items: ["Business profile","Platform contact details","Support email","Support phone number"] },
          { title: "Legal & app", description: "", items: ["Terms and conditions","Privacy policy","App version","Maintenance mode"] }
        ]}
      />
    </AdminShell>
  );
}
