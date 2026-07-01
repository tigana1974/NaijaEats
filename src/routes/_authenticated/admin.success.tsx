import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Sparkles, ListChecks, Camera, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/success")({
  component: AdminSuccess,
});

function AdminSuccess() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Vendor success"
        description="Onboarding checklists, quality scores, and account-manager notes."
        kpis={[
          { label: "Onboarding in progress", value: "—", Icon: ListChecks, accent: "orange" },
          { label: "Menu quality avg.", value: "—", Icon: Sparkles, accent: "green" },
          { label: "Photo quality avg.", value: "—", Icon: Camera, accent: "green" },
          { label: "Open success tasks", value: "—", Icon: NotebookPen, accent: "ink" }
        ]}
        sections={[
          { title: "Vendor success tools", description: "", items: ["Onboarding checklist","Store performance tips","Menu quality score","Photo quality score","Sales improvement recommendations","Vendor support notes","Account manager notes"] },
          { title: "Playbooks", description: "", items: ["New vendor 30-day plan","Quality recovery plan","High-cancellation recovery","Rating recovery","Menu photo redo","Cuisine coaching"] }
        ]}
      />
    </AdminShell>
  );
}
