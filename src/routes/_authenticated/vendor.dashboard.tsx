import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useVendorStore } from "@/hooks/useVendorStore";
import {
  PiClipboardTextDuotone,
  PiForkKnifeDuotone,
  PiStorefrontDuotone,
  PiChartLineUpDuotone,
  PiStarDuotone,
  PiBasketDuotone,
  PiCalendarCheckDuotone,
  PiTimerDuotone,
} from "react-icons/pi";

export const Route = createFileRoute("/_authenticated/vendor/dashboard")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { activeShopId, setActiveShopId } = useVendorStore();

  // "ALL" mode routes to the multi-shop workspace instead.
  if (activeShopId === "ALL") return <Navigate to="/vendor/shops" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard", activeShopId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;

      let query = supabase.from("vendors").select("*").eq("owner_id", uid);
      if (activeShopId) {
        query = query.eq("id", activeShopId);
      }

      const { data: vendors } = await query;
      const vendor = vendors?.[0];
      if (!vendor) return { vendor: null };

      // Auto-select if not set
      if (!activeShopId) {
        setActiveShopId(vendor.id);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: orders } = await supabase
        .from("orders")
        .select("id,status,total,created_at")
        .eq("vendor_id", vendor.id);
      const all = orders ?? [];
      const today = all.filter((o) => new Date(o.created_at) >= todayStart);
      const revenueToday = today
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + Number(o.total || 0), 0);
      const pending = all.filter((o) => ["pending", "accepted", "preparing"].includes(o.status)).length;
      return { vendor, ordersToday: today.length, revenueToday, pending, totalOrders: all.length };
    },
  });

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !data?.vendor ? (
          <SetupCta />
        ) : (
          <>
            {(() => {
              const cfg = vendorConfig(data.vendor.type);
              return (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{cfg.title}</p>
                      <h1 className="font-display text-3xl sm:text-4xl font-semibold">{data.vendor.name}</h1>
                      <span
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          data.vendor.status === "approved"
                            ? "bg-[oklch(0.95_0.04_145)] text-[oklch(0.42_0.14_145)]"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${data.vendor.status === "approved" ? "bg-[oklch(0.62_0.18_145)]" : "bg-amber-500"}`} />
                        {data.vendor.status}
                      </span>
                    </div>
                    <Link
                      to="/vendor/profile"
                      className="rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-4 py-2 text-sm font-semibold"
                    >
                      {cfg.editLabel}
                    </Link>
                  </div>

                  {data.vendor.status !== "approved" && (
                    <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
                      Your shop is <strong className="capitalize">{data.vendor.status}</strong>.
                      Customers won't see it on Discover until it's approved.
                    </div>
                  )}

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label="Orders today" value={data.ordersToday ?? 0} Icon={PiClipboardTextDuotone} tone="clay" />
                    <Stat
                      label="Revenue today"
                      value={formatMoney(data.revenueToday ?? 0, data.vendor.currency)}
                      Icon={PiChartLineUpDuotone}
                      tone="green"
                    />
                    <Stat label="Open orders" value={data.pending ?? 0} Icon={PiTimerDuotone} tone="blue" />
                    <Stat
                      label="Rating"
                      value={`${Number(data.vendor.rating || 0).toFixed(1)} (${data.vendor.rating_count || 0})`}
                      Icon={PiStarDuotone}
                      tone="gold"
                    />
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {cfg.quickLinks.map((ql) => (
                      <QuickLink key={ql.to} to={ql.to} Icon={ql.Icon} title={ql.title} desc={ql.desc} />
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </AppShell>
  );
}

function SetupCta() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <PiStorefrontDuotone className="h-10 w-10 mx-auto text-[var(--brand-clay)]" />
      <h2 className="mt-4 font-display text-2xl font-semibold">Set up your shop</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        You haven't created your vendor profile yet. Add your shop details so customers can find you.
      </p>
      <Link
        to="/vendor/profile"
        className="inline-block mt-6 rounded-full bg-[var(--brand-clay)] text-[var(--brand-cream)] px-5 py-2.5 font-semibold"
      >
        Create my shop
      </Link>
    </div>
  );
}

const statTones = {
  clay: "bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)]",
  green: "bg-[oklch(0.95_0.04_145)] text-[oklch(0.52_0.16_145)]",
  blue: "bg-[oklch(0.95_0.03_250)] text-[oklch(0.55_0.15_250)]",
  gold: "bg-[oklch(0.96_0.05_90)] text-[oklch(0.62_0.13_75)]",
} as const;

function Stat({ label, value, Icon, tone = "clay" }: { label: string; value: string | number; Icon: React.ComponentType<{ className?: string }>; tone?: keyof typeof statTones }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${statTones[tone]}`}>
          <Icon className="h-[22px] w-[22px]" />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function QuickLink({ to, Icon, title, desc }: { to: string; Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:border-[var(--brand-clay)]/30 hover:-translate-y-0.5 flex gap-4 items-start"
    >
      <div className="h-11 w-11 shrink-0 rounded-xl bg-[oklch(0.96_0.03_25)] flex items-center justify-center text-[var(--brand-clay)] transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function vendorConfig(type: string) {
  const isChef = type === "chef";
  const isGrocery = type === "grocery";
  if (isChef) return {
    title: "Chef dashboard",
    editLabel: "Edit kitchen",
    quickLinks: [
      { to: "/vendor/orders", Icon: PiClipboardTextDuotone, title: "Orders", desc: "Accept and manage orders." },
      { to: "/vendor/menu", Icon: PiForkKnifeDuotone, title: "Menu", desc: "Manage your dishes and prices." },
      { to: "/vendor/profile", Icon: PiCalendarCheckDuotone, title: "Availability", desc: "Set dates you can cook." },
      { to: "/vendor/earnings", Icon: PiChartLineUpDuotone, title: "Earnings", desc: "Revenue and payout requests." },
    ],
  };
  if (isGrocery) return {
    title: "Store dashboard",
    editLabel: "Edit store",
    quickLinks: [
      { to: "/vendor/orders", Icon: PiClipboardTextDuotone, title: "Orders", desc: "Accept and manage orders." },
      { to: "/vendor/menu", Icon: PiBasketDuotone, title: "Groceries", desc: "Manage inventory and prices." },
      { to: "/vendor/earnings", Icon: PiChartLineUpDuotone, title: "Earnings", desc: "Revenue and payout requests." },
      { to: "/vendor/profile", Icon: PiStorefrontDuotone, title: "Store profile", desc: "Cover, delivery fee, details." },
    ],
  };
  return {
    title: "Restaurant dashboard",
    editLabel: "Edit restaurant",
    quickLinks: [
      { to: "/vendor/orders", Icon: PiClipboardTextDuotone, title: "Orders queue", desc: "Accept, prepare, and mark ready." },
      { to: "/vendor/menu", Icon: PiForkKnifeDuotone, title: "Menu", desc: "Add items, categories, prices." },
      { to: "/vendor/earnings", Icon: PiChartLineUpDuotone, title: "Earnings", desc: "Revenue and payout requests." },
      { to: "/vendor/profile", Icon: PiStorefrontDuotone, title: "Restaurant profile", desc: "Cover, delivery fee, prep time." },
    ],
  };
}

function formatMoney(n: number, currency: string) {
  const symbol = currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(n).toLocaleString()}`;
}
