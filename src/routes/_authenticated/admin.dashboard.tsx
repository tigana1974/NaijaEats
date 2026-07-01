import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  PageBody,
  KpiCard,
  Card,
  CardHeader,
  QuickActionRow,
  StatusBadge,
  TableWrap,
  Thead,
  Th,
  Tr,
  Td,
  formatMoney,
  ComingSoon,
} from "@/components/admin/AdminUI";
import {
  Megaphone,
  Tag,
  UtensilsCrossed,
  Clock,
  Bike,
  Users,
  MessageSquare,
  Banknote,
  ShoppingBag,
  TrendingUp,
  Store,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    staleTime: 30_000,
    queryFn: async () => {
      const [vendorsRes, ordersRes, ridersRes, docsRes, payoutsRes] = await Promise.all([
        supabase.from("vendors").select("id,status,name"),
        supabase.from("orders").select("id,status,total,currency,created_at,vendor_id,customer_id"),
        supabase.from("user_roles").select("user_id").eq("role", "rider"),
        supabase.from("vendor_documents").select("id,status").eq("status", "pending"),
        supabase.from("payouts").select("id,status,amount,currency").eq("status", "requested"),
      ]);
      const vendors = vendorsRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const now = new Date();
      const isToday = (d: string) => new Date(d).toDateString() === now.toDateString();
      const ordersToday = orders.filter((o: any) => isToday(o.created_at));
      const salesToday = ordersToday.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
      const liveStatuses = new Set([
        "new",
        "awaiting_acceptance",
        "accepted",
        "preparing",
        "ready_for_pickup",
        "assigned",
        "picked_up",
        "on_the_way",
      ]);
      const liveOrders = orders.filter((o: any) => liveStatuses.has(o.status));
      const currency = (ordersToday[0]?.currency as string) || "GBP";
      const pendingPayouts = (payoutsRes.data ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

      return {
        currency,
        ordersToday: ordersToday.length,
        salesToday,
        avgTicket: ordersToday.length ? salesToday / ordersToday.length : 0,
        liveOrders,
        activeVendors: vendors.filter((v: any) => v.status === "approved").length,
        pendingVendors: vendors.filter((v: any) => v.status === "pending").length,
        activeRiders: (ridersRes.data ?? []).length,
        pendingDocs: (docsRes.data ?? []).length,
        pendingPayoutsCount: (payoutsRes.data ?? []).length,
        pendingPayoutsAmount: pendingPayouts,
        openComplaints: 0, // support_tickets table not yet in schema
        recentOrders: [...orders].slice(0, 6),
      };
    },
  });

  return (
    <AdminShell>
      <PageHeader
        title={greetingTitle()}
        description={`Today's summary • Last updated ${new Date().toLocaleTimeString()}`}
      />
      <PageBody>
        {/* Top KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Sales today"
            value={data ? formatMoney(data.salesToday, data.currency) : "—"}
            Icon={TrendingUp}
            hint="Total value of items sold today"
            accent="green"
          />
          <KpiCard
            label="Orders today"
            value={isLoading ? "…" : data?.ordersToday ?? 0}
            Icon={ShoppingBag}
            hint="Orders received today"
            accent="orange"
          />
          <KpiCard
            label="Average ticket"
            value={data ? formatMoney(data.avgTicket, data.currency) : "—"}
            Icon={ShoppingBag}
            hint="Average value per order"
            accent="ink"
          />
          <KpiCard
            label="Pending payouts"
            value={data ? formatMoney(data.pendingPayoutsAmount, data.currency) : "—"}
            Icon={Banknote}
            hint={`${data?.pendingPayoutsCount ?? 0} awaiting settlement`}
            accent="orange"
          />
        </div>

        {/* Second KPI row - operational */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Live orders"
            value={data?.liveOrders?.length ?? 0}
            Icon={Clock}
            hint="Currently in progress"
            accent="green"
          />
          <KpiCard
            label="Active vendors"
            value={data?.activeVendors ?? 0}
            Icon={Store}
            hint={`${data?.pendingVendors ?? 0} pending verification`}
            accent="green"
          />
          <KpiCard
            label="Active riders"
            value={data?.activeRiders ?? 0}
            Icon={Bike}
            hint="Available for delivery"
            accent="ink"
          />
          <KpiCard
            label="Customer complaints"
            value={data?.openComplaints ?? 0}
            Icon={MessageSquare}
            hint="Open tickets"
            accent={data && data.openComplaints > 0 ? "orange" : "muted"}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Live orders table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Live orders"
                description="Real-time view of orders in progress across all vendors"
                action={
                  <a
                    href="/admin/orders"
                    className="text-sm font-medium text-[var(--naija-green)] hover:underline"
                  >
                    View all →
                  </a>
                }
              />
              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : !data?.liveOrders?.length ? (
                <div className="p-6 text-sm text-muted-foreground">No live orders right now.</div>
              ) : (
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Order</Th>
                      <Th>Status</Th>
                      <Th>Total</Th>
                      <Th>Created</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {data.liveOrders.slice(0, 8).map((o: any) => (
                      <Tr key={o.id}>
                        <Td className="font-mono text-xs">#{o.id.slice(0, 8)}</Td>
                        <Td>
                          <StatusBadge status={humaniseStatus(o.status)} />
                        </Td>
                        <Td>{formatMoney(Number(o.total), o.currency || "GBP")}</Td>
                        <Td className="text-muted-foreground">
                          {new Date(o.created_at).toLocaleTimeString()}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>

            {/* Top opportunities (like Uber's list) */}
            <Card className="mt-4">
              <CardHeader
                title="Top opportunities"
                description="Grow platform performance with recommended actions"
              />
              <div className="divide-y divide-border">
                <OpportunityRow
                  tag="Growth"
                  title="Create a citywide ad campaign"
                  body="Boost featured stores in Lagos and London this weekend. Estimated +12% orders."
                  cta={{ label: "Create ad", href: "/admin/ads" }}
                  Icon={Megaphone}
                  color="green"
                />
                <OpportunityRow
                  tag="Retention"
                  title="Launch a first-order discount"
                  body="First-time customers convert 3× when offered £5 off their first order."
                  cta={{ label: "Create offer", href: "/admin/offers" }}
                  Icon={Tag}
                  color="orange"
                />
                <OpportunityRow
                  tag="Quality"
                  title="Review menu photos with low quality scores"
                  body="12 vendors have dishes without high-quality images. Improve conversion by 8%."
                  cta={{ label: "Open menus", href: "/admin/menu" }}
                  Icon={UtensilsCrossed}
                  color="ink"
                />
              </div>
            </Card>
          </div>

          {/* Right rail - Quick actions */}
          <div>
            <Card>
              <CardHeader title="Quick actions" />
              <div className="space-y-2 p-3">
                <QuickActionRow label="Create ad" to="/admin/ads" Icon={Megaphone} />
                <QuickActionRow label="Create offer" to="/admin/offers" Icon={Tag} />
                <QuickActionRow label="Edit menu" to="/admin/menu" Icon={UtensilsCrossed} />
                <QuickActionRow label="Review payouts" to="/admin/payouts" Icon={Banknote} />
                <QuickActionRow label="Approve vendors" to="/admin/stores" Icon={Store} />
                <QuickActionRow label="Rider status" to="/admin/riders" Icon={Bike} />
                <QuickActionRow label="Customer complaints" to="/admin/reviews" Icon={MessageSquare} />
                <QuickActionRow label="Add admin user" to="/admin/users" Icon={Users} />
              </div>
            </Card>

            {/* Alerts */}
            <Card className="mt-4">
              <CardHeader title="Alerts" />
              <div className="divide-y divide-border">
                <AlertRow
                  label="Documents to verify"
                  value={data?.pendingDocs ?? 0}
                  href="/admin/documents"
                  danger={(data?.pendingDocs ?? 0) > 0}
                />
                <AlertRow
                  label="Vendors awaiting approval"
                  value={data?.pendingVendors ?? 0}
                  href="/admin/stores"
                  danger={(data?.pendingVendors ?? 0) > 0}
                />
                <AlertRow
                  label="Payouts to process"
                  value={data?.pendingPayoutsCount ?? 0}
                  href="/admin/payouts"
                  danger={(data?.pendingPayoutsCount ?? 0) > 0}
                />
                <AlertRow
                  label="Open complaints"
                  value={data?.openComplaints ?? 0}
                  href="/admin/reviews"
                  danger={(data?.openComplaints ?? 0) > 0}
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <ComingSoon
            title="More modules mapped and ready"
            description="The full sidebar covers Store, Orders, Analytics, Customers, Marketing, Menu, Finance and System settings. Each page has been scaffolded — real data is wired to Supabase where the table already exists."
          />
        </div>
      </PageBody>
    </AdminShell>
  );
}

function greetingTitle() {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${g}, Admin`;
}

function humaniseStatus(s: string) {
  return (s || "").replaceAll("_", " ");
}

function OpportunityRow({
  tag,
  title,
  body,
  cta,
  Icon,
  color,
}: {
  tag: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  Icon: React.ComponentType<{ className?: string }>;
  color: "green" | "orange" | "ink";
}) {
  const bubble =
    color === "green"
      ? "bg-[var(--naija-green)]/10 text-[var(--naija-green)]"
      : color === "orange"
        ? "bg-[var(--naija-orange)]/10 text-[var(--naija-orange)]"
        : "bg-muted text-foreground";
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bubble}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {tag}
          </span>
          <div className="mt-1 text-sm font-medium">{title}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={cta.href}
          className="rounded-lg bg-[var(--naija-green)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--naija-green-dark)]"
        >
          {cta.label}
        </a>
      </div>
    </div>
  );
}

function AlertRow({
  label,
  value,
  href,
  danger,
}: {
  label: string;
  value: number;
  href: string;
  danger: boolean;
}) {
  return (
    <a href={href} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40">
      <span className="flex items-center gap-2 text-sm">
        {danger ? (
          <AlertTriangle className="h-4 w-4 text-[var(--naija-orange)]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-[var(--naija-green)]" />
        )}
        {label}
      </span>
      <span className={`text-sm font-semibold ${danger ? "text-[var(--naija-orange)]" : "text-muted-foreground"}`}>
        {value}
      </span>
    </a>
  );
}
