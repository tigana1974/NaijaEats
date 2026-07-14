import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRegion } from "@/hooks/useAdminScope";
import {
  UberKpi,
  CurrentTierCard,
  UberOpportunityCard,
  UberQuickAction,
  StatusBadge,
  TableWrap,
  Thead,
  Th,
  Tr,
  Td,
  formatMoney,
} from "@/components/admin/AdminUI";
import {
  Megaphone,
  Tag,
  UtensilsCrossed,
  Clock,
  Bike,
  Users,
  Banknote,
  ShoppingBag,
  Store,
  HandCoins,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { region, country, currency: regionCurrency, countryLabel } = useAdminRegion();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-summary", region],
    staleTime: 30_000,
    queryFn: async () => {
      // Scope every dataset to the selected market. Money tables carry a
      // currency column that maps 1:1 to country (NGN ↔ NG, GBP ↔ UK).
      let vendorsQ = supabase.from("vendors").select("id,status,name,country");
      if (country) vendorsQ = vendorsQ.eq("country", country);
      let ordersQ = supabase.from("orders").select("id,status,total,currency,created_at,vendor_id,customer_id");
      if (regionCurrency) ordersQ = ordersQ.eq("currency", regionCurrency);
      let docsQ = supabase.from("vendor_documents").select("id,status,vendors!inner(country)").eq("status", "pending");
      if (country) docsQ = docsQ.eq("vendors.country", country);
      let payoutsQ = supabase.from("payouts").select("id,status,amount,currency").eq("status", "requested");
      if (regionCurrency) payoutsQ = payoutsQ.eq("currency", regionCurrency);

      const [vendorsRes, ordersRes, ridersRes, docsRes, payoutsRes] = await Promise.all([
        vendorsQ,
        ordersQ,
        supabase.from("user_roles").select("user_id").eq("role", "rider"),
        docsQ,
        payoutsQ,
      ]);
      const vendors = vendorsRes.data ?? [];
      const orders = ordersRes.data ?? [];

      // Riders live in profiles; scope the count by home country.
      let riderCount = (ridersRes.data ?? []).length;
      const riderIds = (ridersRes.data ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (country && riderIds.length > 0) {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .in("id", riderIds)
          .eq("country", country);
        riderCount = count ?? 0;
      }
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
      const currency = regionCurrency ?? ((ordersToday[0]?.currency as string) || "NGN");
      const pendingPayouts = (payoutsRes.data ?? []).reduce(
        (s: number, p: any) => s + Number(p.amount ?? 0),
        0,
      );

      // Simple platform-health score → tier
      const completed = orders.filter((o: any) =>
        ["delivered", "completed"].includes(o.status),
      ).length;
      const cancelled = orders.filter((o: any) =>
        ["cancelled", "refunded"].includes(o.status),
      ).length;
      const success = orders.length ? completed / orders.length : 0.5;
      const tierProgress = Math.max(0, Math.min(1, success));
      const tier =
        tierProgress >= 0.9
          ? "Excellent"
          : tierProgress >= 0.75
            ? "Good"
            : tierProgress >= 0.55
              ? "Fair"
              : "Needs attention";

      return {
        currency,
        ordersToday: ordersToday.length,
        salesToday,
        avgTicket: ordersToday.length ? salesToday / ordersToday.length : 0,
        liveOrders,
        activeVendors: vendors.filter((v: any) => v.status === "approved").length,
        pendingVendors: vendors.filter((v: any) => v.status === "pending").length,
        activeRiders: riderCount,
        pendingDocs: (docsRes.data ?? []).length,
        pendingPayoutsCount: (payoutsRes.data ?? []).length,
        pendingPayoutsAmount: pendingPayouts,
        openComplaints: 0,
        completed,
        cancelled,
        tier,
        tierProgress,
      };
    },
  });

  const currency = data?.currency ?? regionCurrency ?? "NGN";
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Top: greeting + tier card side by side (matches Uber Eats layout) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="text-[15px] text-neutral-600">{greeting()}, Admin</div>
            <h1 className="mt-1 text-[34px] font-semibold leading-tight tracking-tight text-[oklch(0.18_0.006_260)]">
              Today's summary
            </h1>
            <div className="mt-1 text-[13px] text-neutral-500">
              {countryLabel} · Last updated {nowStr}
            </div>
          </div>
          <div className="lg:min-w-[440px]">
            <CurrentTierCard
              tier={data?.tier ?? "Good"}
              benefitsLabel="Core platform tools"
              benefitsCount={3}
              progress={data?.tierProgress ?? 0.5}
            />
          </div>
        </div>

        {/* Main content: three KPI cards + opportunities on the left, quick actions right */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {/* Three primary KPI cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <UberKpi
                label="Sales"
                value={isLoading ? "…" : formatMoney(data?.salesToday ?? 0, currency)}
                hint="Total value of items sold"
              />
              <UberKpi
                label="Booked Orders"
                value={isLoading ? "…" : (data?.ordersToday ?? 0).toLocaleString()}
                hint="Orders that generated sales"
              />
              <UberKpi
                label="Average ticket size"
                value={isLoading ? "…" : formatMoney(data?.avgTicket ?? 0, currency)}
                hint="Average value of items sold per order"
              />
            </div>

            {/* Secondary operational KPI cards */}
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <UberKpi
                label="Live orders"
                value={data?.liveOrders?.length ?? 0}
                hint="Currently in progress"
              />
              <UberKpi
                label="Active vendors"
                value={data?.activeVendors ?? 0}
                hint={`${data?.pendingVendors ?? 0} pending`}
              />
              <UberKpi
                label="Active riders"
                value={data?.activeRiders ?? 0}
                hint="Available for delivery"
              />
              <UberKpi
                label="Pending payouts"
                value={formatMoney(data?.pendingPayoutsAmount ?? 0, currency)}
                hint={`${data?.pendingPayoutsCount ?? 0} awaiting settlement`}
              />
            </div>

            {/* Top opportunities section */}
            <div className="mt-8">
              <h2 className="text-[22px] font-semibold tracking-tight text-[oklch(0.18_0.006_260)]">
                Top opportunities
              </h2>
              <p className="mt-1 text-[13.5px] text-neutral-600">
                Improve your business on the platform with opportunities.
              </p>

              <div className="mt-4 space-y-4">
                <UberOpportunityCard
                  tag="Growth"
                  title="Create an ad"
                  body="Ads boost your featured stores higher up in the customer feed. Pause or cancel at any time."
                  ctaLabel="Create"
                  ctaHref="/admin/ads"
                  Icon={Megaphone}
                  iconColor="green"
                />
                <UberOpportunityCard
                  tag="Growth"
                  title="Access Merchant Financing to fuel your business"
                  body="Merchant Financing is a cash advance programme available to vetted vendors on Naija Eats."
                  ctaLabel="Apply Now"
                  ctaHref="/admin/financing"
                  Icon={HandCoins}
                  iconColor="mint"
                />
                <UberOpportunityCard
                  tag="Retention"
                  title="Launch a first-order discount"
                  body="First-time customers convert 3× when offered £5 off their first order. Set city-wide caps to control spend."
                  ctaLabel="Create offer"
                  ctaHref="/admin/offers"
                  Icon={Tag}
                  iconColor="orange"
                />
                <UberOpportunityCard
                  tag="Quality"
                  title="Review menu photos with low quality scores"
                  body="12 vendors have dishes without high-quality images. Improving photos can lift conversion by up to 8%."
                  ctaLabel="Open menus"
                  ctaHref="/admin/menu"
                  Icon={UtensilsCrossed}
                  iconColor="peach"
                />
              </div>
            </div>

            {/* Live orders table */}
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[22px] font-semibold tracking-tight text-[oklch(0.18_0.006_260)]">
                  Live orders
                </h2>
                <a href="/admin/orders" className="text-[13px] font-medium text-[var(--naija-green)] hover:underline">
                  View all →
                </a>
              </div>
              <div className="overflow-hidden rounded-xl border border-[oklch(0.92_0.003_260)] bg-white">
                {isLoading ? (
                  <div className="p-6 text-sm text-neutral-500">Loading…</div>
                ) : !data?.liveOrders?.length ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No live orders right now.
                  </div>
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
                            <StatusBadge status={humanise(o.status)} />
                          </Td>
                          <Td>{formatMoney(Number(o.total), o.currency || currency)}</Td>
                          <Td className="text-neutral-500">
                            {new Date(o.created_at).toLocaleTimeString()}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </TableWrap>
                )}
              </div>
            </div>
          </div>

          {/* Right rail: Quick actions */}
          <aside>
            <div className="rounded-xl border border-[oklch(0.92_0.003_260)] bg-white p-2">
              <div className="px-3 pt-2 pb-1 text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">
                Quick actions
              </div>
              <div className="space-y-0.5">
                <UberQuickAction label="Create ad" to="/admin/ads" Icon={Megaphone} iconColor="green" />
                <UberQuickAction label="Create offer" to="/admin/offers" Icon={Tag} iconColor="orange" />
                <UberQuickAction label="Edit item" to="/admin/menu" Icon={UtensilsCrossed} iconColor="peach" />
                <UberQuickAction label="Edit menu hours" to="/admin/holiday-hours" Icon={Clock} iconColor="ink" />
                <UberQuickAction label="Top eats" to="/admin/performance" Icon={Trophy} iconColor="mint" />
                <UberQuickAction label="Learning guide" to="/admin/success" Icon={BookOpen} iconColor="green" />
                <UberQuickAction label="Review payouts" to="/admin/payouts" Icon={Banknote} iconColor="orange" />
                <UberQuickAction label="Approve vendors" to="/admin/stores" Icon={Store} iconColor="green" />
                <UberQuickAction label="Rider roster" to="/admin/riders" Icon={Bike} iconColor="ink" />
                <UberQuickAction label="Order Manager" to="/admin/orders" Icon={ClipboardList} iconColor="mint" />
              </div>
            </div>

            {/* Alerts card */}
            <div className="mt-4 rounded-xl border border-[oklch(0.92_0.003_260)] bg-white">
              <div className="border-b border-[oklch(0.94_0.003_260)] px-4 py-3 text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">
                Needs your attention
              </div>
              <AlertRow
                label="Documents to verify"
                value={data?.pendingDocs ?? 0}
                href="/admin/documents"
              />
              <AlertRow
                label="Vendors awaiting approval"
                value={data?.pendingVendors ?? 0}
                href="/admin/stores"
              />
              <AlertRow
                label="Payouts to process"
                value={data?.pendingPayoutsCount ?? 0}
                href="/admin/payouts"
              />
              <AlertRow
                label="Open complaints"
                value={data?.openComplaints ?? 0}
                href="/admin/reviews"
                last
              />
            </div>

            {/* Onboarding card */}
            <div className="mt-4 rounded-xl border border-[oklch(0.92_0.003_260)] bg-white p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[oklch(0.94_0.05_155)] text-[oklch(0.5_0.14_155)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">
                Vendor success playbook
              </div>
              <div className="mt-1 text-[13px] text-neutral-600">
                Onboarding checklists, photo-quality tips, and sales improvement templates for your account managers.
              </div>
              <a
                href="/admin/success"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.18_0.006_260)] bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-[oklch(0.965_0.003_260)]"
              >
                Open playbook
              </a>
            </div>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function humanise(s: string) {
  return (s || "").replaceAll("_", " ");
}

function AlertRow({
  label,
  value,
  href,
  last,
}: {
  label: string;
  value: number;
  href: string;
  last?: boolean;
}) {
  const critical = value > 0;
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-4 py-3 hover:bg-[oklch(0.965_0.003_260)] ${last ? "" : "border-b border-[oklch(0.94_0.003_260)]"}`}
    >
      <span className="flex items-center gap-2 text-[13.5px] text-[oklch(0.28_0.006_260)]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${critical ? "bg-[var(--naija-orange)]" : "bg-[var(--naija-green)]"}`}
        />
        {label}
      </span>
      <span
        className={`text-[13.5px] font-semibold ${critical ? "text-[var(--naija-orange)]" : "text-neutral-500"}`}
      >
        {value}
      </span>
    </a>
  );
}
