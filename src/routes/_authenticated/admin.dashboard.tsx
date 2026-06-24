import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { Store, ClipboardList, Bike, Clock, CheckCircle2, Users, TrendingUp, FileText, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    enabled: role === "admin",
    queryFn: async () => {
      const [vendors, orders, riders, documents, payouts] = await Promise.all([
        supabase.from("vendors").select("id,status"),
        supabase.from("orders").select("id,status,total,currency,created_at"),
        supabase.from("user_roles").select("user_id").eq("role", "rider"),
        supabase.from("vendor_documents").select("id,status").eq("status", "pending"),
        supabase.from("payouts").select("id,status").eq("status", "requested"),
      ]);
      const v = vendors.data ?? [];
      const o = orders.data ?? [];
      return {
        vendorsTotal: v.length,
        vendorsPending: v.filter((x: any) => x.status === "pending").length,
        vendorsApproved: v.filter((x: any) => x.status === "approved").length,
        ordersTotal: o.length,
        ordersToday: o.filter((x: any) => {
          const d = new Date(x.created_at);
          const t = new Date();
          return d.toDateString() === t.toDateString();
        }).length,
        riders: (riders.data ?? []).length,
        pendingDocuments: (documents.data ?? []).length,
        pendingPayouts: (payouts.data ?? []).length,
      };
    },
  });

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-semibold mb-2">Admin</h1>
        <p className="text-muted-foreground mb-6">Platform overview and approvals.</p>

        {isLoading || !data ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <Stat label="Pending restaurants & chefs" value={data.vendorsPending} Icon={Clock} highlight />
              <Stat label="Pending documents" value={data.pendingDocuments} Icon={FileText} highlight={data.pendingDocuments > 0} />
              <Stat label="Pending payouts" value={data.pendingPayouts} Icon={Banknote} highlight={data.pendingPayouts > 0} />
              <Stat label="Approved restaurants & chefs" value={data.vendorsApproved} Icon={CheckCircle2} />
              <Stat label="Total restaurants & chefs" value={data.vendorsTotal} Icon={Store} />
              <Stat label="Orders today" value={data.ordersToday} Icon={ClipboardList} />
              <Stat label="Orders total" value={data.ordersTotal} Icon={ClipboardList} />
              <Stat label="Riders" value={data.riders} Icon={Bike} />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <LinkCard to="/admin/vendors" title="Approve restaurants & chefs" desc="Review applications and verify documents." Icon={Store} />
              <LinkCard to="/admin/orders" title="All orders" desc="Monitor every order across the platform." Icon={ClipboardList} />
              <LinkCard to="/admin/riders" title="Riders" desc="See active riders and deliveries." Icon={Users} />
              <LinkCard to="/admin/reports" title="Sales & performance" desc="Revenue trends, order status, top vendors." Icon={TrendingUp} />
              <LinkCard to="/admin/customers" title="Customer insights" desc="Repeat rate, new customers, top spenders." Icon={Users} />
              <LinkCard to="/admin/payouts" title="Payouts" desc="Review and settle vendor & rider payout requests." Icon={Banknote} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, Icon, highlight }: { label: string; value: number; Icon: any; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-[var(--brand-clay)] bg-[var(--brand-cream)]/40" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function LinkCard({ to, title, desc, Icon }: { to: string; title: string; desc: string; Icon: any }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-5 hover:border-[var(--brand-clay)] transition">
      <Icon className="h-5 w-5 text-[var(--brand-clay)]" />
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}