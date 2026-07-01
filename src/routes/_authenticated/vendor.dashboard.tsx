import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { ClipboardList, UtensilsCrossed, Store, TrendingUp, Star, ChefHat, ShoppingBasket, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/dashboard")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data: vendor } = await supabase
        .from("vendors")
        .select("*")
        .eq("owner_id", uid)
        .maybeSingle();
      if (!vendor) return { vendor: null };
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
                      <p className="text-muted-foreground mt-1 capitalize">
                        Status: <span className="font-medium text-foreground">{data.vendor.status}</span>
                      </p>
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
                    <Stat label="Orders today" value={data.ordersToday ?? 0} Icon={ClipboardList} />
                    <Stat
                      label="Revenue today"
                      value={formatMoney(data.revenueToday ?? 0, data.vendor.currency)}
                      Icon={TrendingUp}
                    />
                    <Stat label="Open orders" value={data.pending ?? 0} Icon={ClipboardList} />
                    <Stat
                      label="Rating"
                      value={`${Number(data.vendor.rating || 0).toFixed(1)} (${data.vendor.rating_count || 0})`}
                      Icon={Star}
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
      <Store className="h-10 w-10 mx-auto text-[var(--brand-clay)]" />
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

function Stat({ label, value, Icon }: { label: string; value: string | number; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickLink({ to, Icon, title, desc }: { to: string; Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition flex gap-4 items-start">
      <div className="h-10 w-10 rounded-xl bg-[var(--brand-cream)] flex items-center justify-center text-[var(--brand-clay)]">
        <Icon className="h-5 w-5" />
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
      { to: "/vendor/orders", Icon: ClipboardList, title: "Orders", desc: "Accept and manage orders." },
      { to: "/vendor/menu", Icon: UtensilsCrossed, title: "Menu", desc: "Manage your dishes and prices." },
      { to: "/vendor/profile", Icon: CalendarCheck, title: "Availability", desc: "Set dates you can cook." },
      { to: "/vendor/earnings", Icon: TrendingUp, title: "Earnings", desc: "Revenue and payout requests." },
    ],
  };
  if (isGrocery) return {
    title: "Store dashboard",
    editLabel: "Edit store",
    quickLinks: [
      { to: "/vendor/orders", Icon: ClipboardList, title: "Orders", desc: "Accept and manage orders." },
      { to: "/vendor/menu", Icon: ShoppingBasket, title: "Groceries", desc: "Manage inventory and prices." },
      { to: "/vendor/earnings", Icon: TrendingUp, title: "Earnings", desc: "Revenue and payout requests." },
      { to: "/vendor/profile", Icon: Store, title: "Store profile", desc: "Cover, delivery fee, details." },
    ],
  };
  return {
    title: "Restaurant dashboard",
    editLabel: "Edit restaurant",
    quickLinks: [
      { to: "/vendor/orders", Icon: ClipboardList, title: "Orders queue", desc: "Accept, prepare, and mark ready." },
      { to: "/vendor/menu", Icon: UtensilsCrossed, title: "Menu", desc: "Add items, categories, prices." },
      { to: "/vendor/earnings", Icon: TrendingUp, title: "Earnings", desc: "Revenue and payout requests." },
      { to: "/vendor/profile", Icon: Store, title: "Restaurant profile", desc: "Cover, delivery fee, prep time." },
    ],
  };
}

function formatMoney(n: number, currency: string) {
  const symbol = currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(n).toLocaleString()}`;
}
