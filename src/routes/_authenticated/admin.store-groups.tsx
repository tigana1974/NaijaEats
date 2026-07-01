import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Layers, Star, Sparkles, Flag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/store-groups")({
  component: AdminStoreGroups,
});

function AdminStoreGroups() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Store groups"
        description="Group stores by city, country, vendor type, cuisine and performance."
        kpis={[
          { label: "City groups", value: 8, Icon: Layers, accent: "green" },
          { label: "Featured stores", value: 12, Icon: Star, accent: "orange" },
          { label: "New vendor groups", value: 3, Icon: Sparkles, accent: "green" },
          { label: "Countries", value: 2, Icon: Flag, accent: "ink" }
        ]}
        sections={[
          { title: "Grouping dimensions", description: "How stores can be grouped in this dashboard", items: ["City","Country","Vendor type","Cuisine type","Featured stores","New vendors","Suspended vendors","High performers"] },
          { title: "Active groups", description: "", items: ["Lagos restaurants","London home chefs","UK grocery vendors","Abuja featured","Suspended vendors","High performers Q4","New vendors (30d)","Nigerian jollof specialists"] }
        ]}
      />
    </AdminShell>
  );
}
