import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { MessageSquare, Star, Flag, Reply } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Reviews & complaints"
        description="Store, food, rider reviews and customer complaints, with reply and analytics."
        kpis={[
          { label: "Reviews (30d)", value: "—", Icon: MessageSquare, accent: "green" },
          { label: "Avg. rating", value: "—", Icon: Star, accent: "orange" },
          { label: "Reported reviews", value: "—", Icon: Flag, accent: "ink" },
          { label: "Replies pending", value: "—", Icon: Reply, accent: "orange" }
        ]}
        sections={[
          { title: "Review streams", description: "", items: ["Store reviews","Food reviews","Rider reviews","Customer complaints","Review replies","Reported reviews","Rating analytics"] },
          { title: "Moderation", description: "", items: ["Auto-hide keywords","Reply templates","Escalate to support","Refund from review","Flag for legal review"] }
        ]}
      />
    </AdminShell>
  );
}
