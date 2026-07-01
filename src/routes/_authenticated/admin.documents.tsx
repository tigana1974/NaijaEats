import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { FileCheck2, FileText, ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments,
});

function AdminDocuments() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Documents"
        description="Store and verify vendor, rider and business documents."
        kpis={[
          { label: "Documents on file", value: "—", Icon: FileText, accent: "green" },
          { label: "Verified", value: "—", Icon: FileCheck2, accent: "green" },
          { label: "Awaiting review", value: "—", Icon: ShieldCheck, accent: "orange" },
          { label: "Expiring (30d)", value: "—", Icon: AlertTriangle, accent: "ink" }
        ]}
        sections={[
          { title: "Vendor documents", description: "", items: ["Vendor ID","Business registration","Food hygiene certificate","Insurance","Tax document"] },
          { title: "Rider documents", description: "", items: ["Rider ID","Rider licence","Vehicle insurance","Bank verification document"] }
        ]}
      />
    </AdminShell>
  );
}
