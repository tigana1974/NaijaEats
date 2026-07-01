import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Globe, Link2, Eye, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/webshop")({
  component: AdminWebshop,
});

function AdminWebshop() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Webshop"
        description="Public online storefronts for each vendor — menus, delivery, pickup, reviews."
        kpis={[
          { label: "Live storefronts", value: "—", Icon: Globe, accent: "green" },
          { label: "Shareable links", value: "—", Icon: Link2, accent: "orange" },
          { label: "Storefront visits (30d)", value: "—", Icon: Eye, accent: "ink" },
          { label: "Social shares (30d)", value: "—", Icon: Share2, accent: "green" }
        ]}
        sections={[
          { title: "Storefront features", description: "", items: ["Store link","Menu & products","Delivery / pickup options","Reviews","Opening hours","Featured products","Shareable URL"] },
          { title: "SEO & discoverability", description: "", items: ["Meta descriptions","OG images","Sitemap entries","Rich results (menus)","Custom slugs","Analytics tag"] }
        ]}
      />
    </AdminShell>
  );
}
