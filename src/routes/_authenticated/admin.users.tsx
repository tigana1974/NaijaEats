import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Shield, Users, UserCog, Key } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Users & roles"
        description="Admins, vendor staff, riders and customers with role-based access."
        kpis={[
          { label: "Admin users", value: "—", Icon: Shield, accent: "green" },
          { label: "Vendor staff", value: "—", Icon: Users, accent: "orange" },
          { label: "Rider users", value: "—", Icon: UserCog, accent: "green" },
          { label: "Custom roles", value: "—", Icon: Key, accent: "ink" }
        ]}
        sections={[
          { title: "Roles", description: "", items: ["Super admin","Admin","Finance admin","Operations admin","Support admin","Vendor owner","Vendor manager","Vendor staff","Rider","Customer"] },
          { title: "Access controls", description: "", items: ["Per-module permissions","Two-factor enforcement","Session expiry","Audit log","Impersonation with logging","SSO (planned)"] }
        ]}
      />
    </AdminShell>
  );
}
