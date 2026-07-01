import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { BarChart3, Trophy, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/benchmarking")({
  component: AdminBenchmarking,
});

function AdminBenchmarking() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Market benchmarking"
        description="Compare each store against similar vendors on ranking, AOV, prep time and more."
        kpis={[
          { label: "Stores benchmarked", value: "—", Icon: BarChart3, accent: "green" },
          { label: "Top-quartile stores", value: "—", Icon: Trophy, accent: "green" },
          { label: "Avg. rating", value: "—", Icon: Star, accent: "orange" },
          { label: "Median prep time", value: "—", Icon: Clock, accent: "ink" }
        ]}
        sections={[
          { title: "Comparison dimensions", description: "", items: ["Average order value","Sales ranking","Customer rating","Preparation time","Delivery success rate","Best-selling dishes","City performance comparison"] },
          { title: "Cohorts", description: "", items: ["Same cuisine","Same city","Same price band","Same order volume band","Same launch quarter"] }
        ]}
      />
    </AdminShell>
  );
}
