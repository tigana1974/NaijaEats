import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Send, Mail, MessageCircle, PieChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  component: AdminMarketing,
});

function AdminMarketing() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Marketing"
        description="Push, email, SMS and WhatsApp campaigns with segmentation and analytics."
        kpis={[
          { label: "Campaigns (30d)", value: "—", Icon: Send, accent: "green" },
          { label: "Emails sent", value: "—", Icon: Mail, accent: "orange" },
          { label: "WhatsApp messages", value: "—", Icon: MessageCircle, accent: "green" },
          { label: "Open rate avg.", value: "—", Icon: PieChart, accent: "ink" }
        ]}
        sections={[
          { title: "Channels", description: "", items: ["Push notifications","Email campaigns","SMS campaigns","WhatsApp campaign support"] },
          { title: "Analytics & audience", description: "", items: ["Customer segmentation","Delivery rates","Open rates","Click rates","Conversion","Unsubscribes"] }
        ]}
      />
    </AdminShell>
  );
}
