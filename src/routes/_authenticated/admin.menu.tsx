import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { UtensilsCrossed, ShoppingBasket, PackageOpen, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: AdminMenu,
});

function AdminMenu() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Menu"
        description="Manage restaurant and grocery menus — categories, dishes, add-ons and stock."
        kpis={[
          { label: "Active dishes", value: "—", Icon: UtensilsCrossed, accent: "green" },
          { label: "Grocery SKUs", value: "—", Icon: ShoppingBasket, accent: "orange" },
          { label: "Out of stock", value: "—", Icon: PackageOpen, accent: "orange" },
          { label: "Low stock alerts", value: "—", Icon: AlertTriangle, accent: "ink" }
        ]}
        sections={[
          { title: "Restaurant / home chef", description: "", items: ["Categories","Dishes","Add-ons","Ingredients","Allergens","Spice level","Portion size","Photos","Availability","Preparation time"] },
          { title: "Grocery shop", description: "", items: ["Product categories","Product name","Unit size","Stock quantity","Price","Bulk price","Product image","Low stock alert"] }
        ]}
      />
    </AdminShell>
  );
}
