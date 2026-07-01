import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Megaphone, Eye, MousePointerClick, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ads")({
  component: AdminAds,
});

function AdminAds() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Ads"
        description="Featured placements, sponsored menu items, banners and city-based campaigns."
        kpis={[
          { label: "Active campaigns", value: "—", Icon: Megaphone, accent: "green" },
          { label: "Impressions (30d)", value: "—", Icon: Eye, accent: "orange" },
          { label: "Clicks (30d)", value: "—", Icon: MousePointerClick, accent: "green" },
          { label: "Ad spend (30d)", value: "—", Icon: Wallet, accent: "ink" }
        ]}
        sections={[
          { title: "Ad types", description: "", items: ["Featured store placement","Sponsored menu items","Banner ads","City-based campaigns"] },
          { title: "Performance", description: "", items: ["Budget tracking","Impressions","Clicks","Conversions","CPA","ROAS"] }
        ]}
      />
    </AdminShell>
  );
}
