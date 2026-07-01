import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
import { Landmark, ShieldCheck, BadgeAlert, IdCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/banking")({
  component: AdminBanking,
});

function AdminBanking() {
  return (
    <AdminShell>
      <ScaffoldPage
        title="Banking"
        description="Vendor and rider bank accounts, verification and payment provider IDs."
        kpis={[
          { label: "Verified vendor accounts", value: "—", Icon: ShieldCheck, accent: "green" },
          { label: "Verified rider accounts", value: "—", Icon: ShieldCheck, accent: "green" },
          { label: "Failed verifications", value: "—", Icon: BadgeAlert, accent: "orange" },
          { label: "Provider IDs on file", value: "—", Icon: IdCard, accent: "ink" }
        ]}
        sections={[
          { title: "Stored fields", description: "", items: ["Vendor bank details","Rider bank details","Verification status","Payout account","Payment provider account ID","Failed bank verification alerts"] },
          { title: "Verification providers", description: "", items: ["Stripe Connect","Paystack Subaccount","Open Banking (UK)","NIBSS (Nigeria)","Manual review"] }
        ]}
      />
    </AdminShell>
  );
}
