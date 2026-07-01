import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Tag, Percent, Gift, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  component: AdminOffers,
});

function AdminOffers() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Offers"
        description="Promo codes, free-delivery offers, and vendor- or city-specific discounts."
        kpis={[
          { label: "Active offers", value: "—", Icon: Tag, accent: "green" },
          { label: "Redemptions (30d)", value: "—", Icon: Percent, accent: "orange" },
          { label: "Referral offers", value: "—", Icon: Gift, accent: "green" },
          { label: "First-order offers", value: "—", Icon: Rocket, accent: "ink" }
        ]}
        sections={[
          { title: "Offer types", description: "", items: ["Promo codes","Free delivery offers","Percentage discounts","Fixed amount discounts","Vendor-specific offers","City-wide offers","First-order discount","Referral offers"] },
          { title: "Rules", description: "", items: ["Min basket","Max discount cap","Once per customer","New customer only","Stackable with X","Blackout dates","Currency-specific"] }
        ]}
      />
    </AdminShell>
  );
}
