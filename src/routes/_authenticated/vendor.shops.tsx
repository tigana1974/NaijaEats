import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { useVendorStore } from "@/hooks/useVendorStore";
import {
  Search,
  Plus,
  MoreVertical,
  ArrowRight,
  Sparkles,
  Check,
  ExternalLink,
  Star,
  Grid3x3,
  List,
  X,
} from "lucide-react";
import {
  PiStorefrontDuotone,
  PiForkKnifeDuotone,
  PiBasketDuotone,
  PiCookingPotDuotone,
  PiClipboardTextDuotone,
  PiChartLineUpDuotone,
  PiPencilSimpleDuotone,
  PiTargetDuotone,
  PiEyeDuotone,
  PiSquaresFourDuotone,
  PiLockKeyDuotone,
} from "react-icons/pi";

export const Route = createFileRoute("/_authenticated/vendor/shops")({
  component: ShopsPage,
});

type Shop = {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  status: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  city: string | null;
  currency: string | null;
  rating: number | null;
  rating_count: number | null;
  is_featured: boolean | null;
  tagline: string | null;
  created_at: string;
};

type ShopMetrics = {
  ordersToday: number;
  ordersTotal: number;
  revenueToday: number;
  revenueTotal: number;
  openOrders: number;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 2,
  premium: 5,
  enterprise: 25,
};

function typeIcon(type: string | null | undefined) {
  if (type === "grocery") return PiBasketDuotone;
  if (type === "chef") return PiCookingPotDuotone;
  if (type === "restaurant") return PiForkKnifeDuotone;
  return PiStorefrontDuotone;
}

function typeLabel(type: string | null | undefined) {
  if (type === "grocery") return "Grocery";
  if (type === "chef") return "Chef";
  if (type === "restaurant") return "Restaurant";
  return "Shop";
}

function typeGradient(type: string | null | undefined) {
  if (type === "grocery") return "from-emerald-500 to-emerald-700";
  if (type === "chef") return "from-rose-400 to-orange-500";
  if (type === "restaurant") return "from-[var(--brand-clay)] to-orange-600";
  return "from-zinc-500 to-zinc-700";
}

function statusMeta(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return { dot: "bg-emerald-500", label: "Live", chip: "bg-emerald-100 text-emerald-800 ring-emerald-200" };
    case "pending":
      return { dot: "bg-amber-500 animate-pulse", label: "Pending review", chip: "bg-amber-100 text-amber-900 ring-amber-200" };
    case "suspended":
      return { dot: "bg-red-500", label: "Suspended", chip: "bg-red-100 text-red-800 ring-red-200" };
    case "draft":
    default:
      return { dot: "bg-zinc-400", label: "Draft", chip: "bg-zinc-100 text-zinc-700 ring-zinc-200" };
  }
}

function formatMoney(n: number, currency: string) {
  const symbol = currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(n).toLocaleString()}`;
}

function ShopsPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const navigate = useNavigate();
  const { activeShopId, setActiveShopId } = useVendorStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "restaurant" | "grocery" | "chef">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "draft">("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: profile } = useQuery({
    queryKey: ["shops-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", uid)
        .maybeSingle();
      return { uid, plan: (p as any)?.vendor_plan ?? "free", name: (p as any)?.full_name ?? "" };
    },
  });

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["my-shops-full", profile?.uid],
    enabled: !!profile?.uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("owner_id", profile!.uid)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });

  const { data: metricsByShop = {} } = useQuery({
    queryKey: ["shops-metrics", shops.map((s) => s.id).join(",")],
    enabled: shops.length > 0,
    queryFn: async () => {
      const ids = shops.map((s) => s.id);
      const { data: orders } = await supabase
        .from("orders")
        .select("id,vendor_id,status,total,created_at")
        .in("vendor_id", ids);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const out: Record<string, ShopMetrics> = {};
      for (const id of ids) {
        out[id] = { ordersToday: 0, ordersTotal: 0, revenueToday: 0, revenueTotal: 0, openOrders: 0 };
      }
      for (const o of orders ?? []) {
        const m = out[o.vendor_id];
        if (!m) continue;
        m.ordersTotal++;
        const created = new Date(o.created_at);
        const isToday = created >= today;
        if (isToday) m.ordersToday++;
        if (o.status === "delivered") {
          m.revenueTotal += Number(o.total || 0);
          if (isToday) m.revenueToday += Number(o.total || 0);
        }
        if (["pending", "accepted", "preparing"].includes(o.status)) m.openOrders++;
      }
      return out;
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (filter !== "all" && s.type !== filter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (s.name + " " + (s.city ?? "") + " " + (s.slug ?? "")).toLowerCase().includes(q);
    });
  }, [shops, query, filter, statusFilter]);

  const aggregate = useMemo(() => {
    let ordersToday = 0;
    let revenueToday = 0;
    let openOrders = 0;
    let ordersTotal = 0;
    let revenueTotal = 0;
    for (const id of Object.keys(metricsByShop)) {
      const m = metricsByShop[id];
      ordersToday += m.ordersToday;
      revenueToday += m.revenueToday;
      openOrders += m.openOrders;
      ordersTotal += m.ordersTotal;
      revenueTotal += m.revenueTotal;
    }
    return { ordersToday, revenueToday, openOrders, ordersTotal, revenueTotal };
  }, [metricsByShop]);

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  const planKey = (profile?.plan ?? "free").toLowerCase();
  const limit = PLAN_LIMITS[planKey] ?? 1;
  const canAdd = shops.length < limit;
  const currency = shops[0]?.currency ?? "NGN";

  const typeCounts = shops.reduce<Record<string, number>>((acc, s) => {
    const k = s.type ?? "other";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-[#1a1108] via-[#3a1a14] to-[#7c2d12] p-4 sm:p-8 text-white">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--brand-gold)]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[var(--brand-clay)]/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          {/* Plan chip — top-right corner on all screens */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
            <PlanChip plan={planKey} />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 pr-24 sm:pr-32">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <PiSquaresFourDuotone className="h-3 w-3 text-[var(--brand-gold)]" /> Multi-shop workspace
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mt-2 sm:mt-3 leading-tight">
                My shops
              </h1>
              <p className="text-white/75 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-md leading-relaxed">
                Manage every kitchen, store, and profile from one place.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveShopId(null);
                navigate({ to: "/vendor/profile" });
              }}
              disabled={!canAdd}
              className={`w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 sm:py-2.5 text-sm font-bold shadow-xl transition-all ${
                canAdd
                  ? "bg-white text-[#1a1108] hover:scale-105"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              <Plus className="h-4 w-4" />
              Add shop
              {canAdd && limit > 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-clay)] bg-[var(--brand-clay)]/10 rounded-full px-1.5 py-0.5">
                  {shops.length}/{limit}
                </span>
              )}
            </button>
          </div>

          {/* Aggregate stat row */}
          <div className="relative mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HeroStat label="Total shops" value={shops.length} sub={typeSummary(typeCounts)} />
            <HeroStat label="Orders today" value={aggregate.ordersToday} sub={`${aggregate.ordersTotal} lifetime`} />
            <HeroStat label="Revenue today" value={formatMoney(aggregate.revenueToday, currency)} sub={`${formatMoney(aggregate.revenueTotal, currency)} lifetime`} />
            <HeroStat label="Open orders" value={aggregate.openOrders} sub={aggregate.openOrders > 0 ? "Needs attention" : "All handled"} accent={aggregate.openOrders > 0} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops by name or city"
              className="w-full h-11 rounded-2xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/15 transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full bg-muted hover:bg-muted/70"
                aria-label="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "All", count: shops.length },
              { id: "restaurant", label: "Restaurants", count: typeCounts.restaurant ?? 0 },
              { id: "grocery", label: "Groceries", count: typeCounts.grocery ?? 0 },
              { id: "chef", label: "Chefs", count: typeCounts.chef ?? 0 },
            ]}
          />

          <FilterPills
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "Any status" },
              { id: "approved", label: "Live" },
              { id: "pending", label: "Pending" },
              { id: "draft", label: "Draft" },
            ]}
          />

          <div className="inline-flex rounded-2xl bg-muted p-0.5">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`h-9 w-9 grid place-items-center rounded-xl transition ${
                view === "grid" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`h-9 w-9 grid place-items-center rounded-xl transition ${
                view === "list" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <ShopsSkeleton view={view} />
        ) : shops.length === 0 ? (
          <EmptyState onCreate={() => navigate({ to: "/vendor/profile" })} />
        ) : filtered.length === 0 ? (
          <NoMatchesState onClear={() => { setQuery(""); setFilter("all"); setStatusFilter("all"); }} />
        ) : view === "grid" ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ShopCard
                key={s.id}
                shop={s}
                metrics={metricsByShop[s.id]}
                active={activeShopId === s.id}
                onOpen={() => {
                  setActiveShopId(s.id);
                  navigate({ to: "/vendor/dashboard" });
                }}
              />
            ))}
            {canAdd && (
              <AddShopCard
                onClick={() => {
                  setActiveShopId(null);
                  navigate({ to: "/vendor/profile" });
                }}
                remaining={limit - shops.length}
              />
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-card border border-border overflow-hidden">
            {filtered.map((s, i) => (
              <ShopRow
                key={s.id}
                shop={s}
                metrics={metricsByShop[s.id]}
                active={activeShopId === s.id}
                isLast={i === filtered.length - 1}
                onOpen={() => {
                  setActiveShopId(s.id);
                  navigate({ to: "/vendor/dashboard" });
                }}
              />
            ))}
          </div>
        )}

        {/* Upgrade banner — mobile: stacked, sm+: side-by-side */}
        {!canAdd && (
          <div className="mt-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-white to-white border border-amber-200 p-4 sm:p-6">
            <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 sm:flex-1 sm:min-w-0">
                <span className="grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  <PiLockKeyDuotone className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base sm:text-lg font-bold leading-tight">
                    {planLabel(planKey)} limit reached
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    Upgrade to run up to 5 shops on Premium, or 25 on Enterprise.
                  </div>
                </div>
              </div>
              <Link
                to="/vendor/subscription"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 sm:py-2.5 text-sm font-bold shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform"
              >
                Upgrade plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ────────────── Sub-components ────────────── */

function HeroStat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/8 backdrop-blur border border-white/10 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent ? "text-[var(--brand-gold)]" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-white/55 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${
            value === o.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
          {typeof o.count === "number" && o.count > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              value === o.id ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : "bg-muted-foreground/10 text-muted-foreground"
            }`}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ShopCard({
  shop,
  metrics,
  active,
  onOpen,
}: {
  shop: Shop;
  metrics?: ShopMetrics;
  active: boolean;
  onOpen: () => void;
}) {
  const status = statusMeta(shop.status);
  const Icon = typeIcon(shop.type);
  const currency = shop.currency ?? "NGN";

  return (
    <div
      className={`group relative rounded-3xl overflow-hidden bg-card border transition-all duration-300 ${
        active ? "border-[var(--brand-clay)] ring-2 ring-[var(--brand-clay)]/15 shadow-lg" : "border-border hover:border-[var(--brand-clay)]/40 hover:shadow-[0_16px_44px_-16px_rgba(0,0,0,0.14)] hover:-translate-y-1"
      }`}
    >
      {/* Cover */}
      <div className={`relative h-32 bg-gradient-to-br ${typeGradient(shop.type)} overflow-hidden`}>
        {shop.cover_image_url ? (
          <img src={shop.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute inset-0 grid place-items-center text-white/30">
              <Icon className="h-16 w-16" />
            </div>
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Status chip top-left */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${status.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>

        {/* Featured */}
        {shop.is_featured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold)] text-[#1a1108] px-2 py-1 text-[10px] font-bold uppercase shadow-lg">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}

        {/* Active badge */}
        {active && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--brand-clay)] text-white px-2 py-1 text-[10px] font-bold uppercase shadow-lg">
            <Check className="h-3 w-3" strokeWidth={3} /> Active
          </span>
        )}

        {/* Logo */}
        <div className="absolute -bottom-8 left-5 h-16 w-16 rounded-2xl bg-white p-1 shadow-xl ring-1 ring-black/5">
          <div className="h-full w-full rounded-xl bg-muted overflow-hidden grid place-items-center">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-7 w-7 text-[var(--brand-clay)]" />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-10 px-5 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg font-bold text-foreground truncate">{shop.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span>{typeLabel(shop.type)}</span>
              {shop.city && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="truncate">{shop.city}</span>
                </>
              )}
            </div>
          </div>
          {shop.rating != null && shop.rating > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-1 text-[11px] font-bold">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {shop.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Metrics mini grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniMetric label="Today" value={metrics?.ordersToday ?? 0} />
          <MiniMetric label="Open" value={metrics?.openOrders ?? 0} tone={metrics && metrics.openOrders > 0 ? "warn" : undefined} />
          <MiniMetric label="Revenue" value={formatMoney(metrics?.revenueToday ?? 0, currency)} small />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={onOpen}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-foreground text-background py-2.5 text-xs font-bold hover:opacity-90 transition"
          >
            Open dashboard <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <Link
            to="/vendor/profile"
            onClick={() => useVendorStore.getState().setActiveShopId(shop.id)}
            aria-label="Edit shop"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-border hover:bg-muted transition"
          >
            <PiPencilSimpleDuotone className="h-4 w-4" />
          </Link>
          {shop.status === "approved" && (
            <a
              href={`/vendor/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Preview live storefront"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-border hover:bg-muted transition"
            >
              <PiEyeDuotone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, small, tone }: { label: string; value: string | number; small?: boolean; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl p-2.5 ${tone === "warn" ? "bg-amber-50" : "bg-muted/40"}`}>
      <div className={`font-display font-bold tabular-nums truncate ${small ? "text-sm" : "text-lg"} ${tone === "warn" ? "text-amber-700" : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ShopRow({
  shop,
  metrics,
  active,
  isLast,
  onOpen,
}: {
  shop: Shop;
  metrics?: ShopMetrics;
  active: boolean;
  isLast: boolean;
  onOpen: () => void;
}) {
  const status = statusMeta(shop.status);
  const Icon = typeIcon(shop.type);
  const currency = shop.currency ?? "NGN";
  return (
    <div
      className={`group flex items-center gap-4 p-4 ${isLast ? "" : "border-b border-border"} ${
        active ? "bg-[var(--brand-clay)]/[0.04]" : "hover:bg-muted/40"
      } transition-colors`}
    >
      <div className={`relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${typeGradient(shop.type)}`}>
        {shop.logo_url ? (
          <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
        ) : shop.cover_image_url ? (
          <img src={shop.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/70">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold truncate">{shop.name}</div>
          {active && (
            <span className="rounded-full bg-[var(--brand-clay)] text-white text-[9px] font-bold uppercase px-1.5 py-0.5">
              Active
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
          <span>{typeLabel(shop.type)}</span>
          {shop.city && (
            <>
              <span className="opacity-40">·</span>
              <span>{shop.city}</span>
            </>
          )}
          <span className="opacity-40">·</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${status.chip}`}>
            <span className={`h-1 w-1 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 shrink-0">
        <MetricInline label="Today" value={metrics?.ordersToday ?? 0} />
        <MetricInline label="Open" value={metrics?.openOrders ?? 0} highlight={(metrics?.openOrders ?? 0) > 0} />
        <MetricInline label="Revenue today" value={formatMoney(metrics?.revenueToday ?? 0, currency)} wide />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 transition"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/vendor/profile"
          onClick={() => useVendorStore.getState().setActiveShopId(shop.id)}
          aria-label="Edit"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted transition"
        >
          <PiPencilSimpleDuotone className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

function MetricInline({ label, value, wide, highlight }: { label: string; value: string | number; wide?: boolean; highlight?: boolean }) {
  return (
    <div className={wide ? "min-w-[90px]" : ""}>
      <div className={`font-display font-bold tabular-nums text-sm ${highlight ? "text-amber-700" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
    </div>
  );
}

function AddShopCard({ onClick, remaining }: { onClick: () => void; remaining: number }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-3xl overflow-hidden border-2 border-dashed border-border bg-transparent hover:border-[var(--brand-clay)]/60 hover:bg-[var(--brand-clay)]/[0.03] transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center gap-3 p-6"
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] group-hover:scale-110 transition-transform">
        <Plus className="h-8 w-8" />
      </span>
      <div className="text-center">
        <div className="font-display text-lg font-bold">Add a new shop</div>
        <div className="text-xs text-muted-foreground mt-1">
          {remaining} slot{remaining === 1 ? "" : "s"} left in your plan
        </div>
      </div>
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-clay)]">
        Get started <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center">
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--brand-clay)]/10 blur-3xl" />
      <div className="relative">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[var(--brand-clay)] to-orange-600 text-white shadow-xl">
          <PiStorefrontDuotone className="h-8 w-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">Open your first shop</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Whether it's a restaurant, grocery store, or private kitchen — start earning on Naija Eats in minutes.
        </p>
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-6 py-3 text-sm font-bold shadow-lg shadow-[var(--brand-clay)]/25 hover:scale-105 transition"
        >
          <Plus className="h-4 w-4" /> Create my shop
        </button>
      </div>
    </div>
  );
}

function NoMatchesState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center">
      <PiTargetDuotone className="h-10 w-10 mx-auto text-muted-foreground" />
      <div className="mt-3 font-semibold">No shops match those filters</div>
      <div className="text-sm text-muted-foreground mt-1">Try clearing your filters or search term.</div>
      <button
        onClick={onClear}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
      >
        <X className="h-3.5 w-3.5" /> Clear filters
      </button>
    </div>
  );
}

function ShopsSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="mt-6 rounded-3xl bg-card border border-border overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 animate-pulse">
            <div className="h-14 w-14 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-muted rounded-full" />
              <div className="h-2.5 w-1/2 bg-muted/70 rounded-full" />
            </div>
            <div className="h-9 w-24 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-card border border-border overflow-hidden animate-pulse">
          <div className="h-32 bg-muted" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-2/3 bg-muted rounded-full" />
            <div className="h-3 w-1/2 bg-muted rounded-full" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="h-14 rounded-2xl bg-muted" />
              <div className="h-14 rounded-2xl bg-muted" />
              <div className="h-14 rounded-2xl bg-muted" />
            </div>
            <div className="h-10 bg-muted rounded-2xl mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanChip({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-white/10 text-white border-white/15",
    starter: "bg-blue-500/20 text-blue-100 border-blue-400/30",
    premium: "bg-gradient-to-br from-amber-400 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30",
    enterprise: "bg-gradient-to-br from-purple-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${styles[plan] ?? styles.free}`}>
      {(plan === "premium" || plan === "enterprise") && <Sparkles className="h-3.5 w-3.5" />}
      {planLabel(plan)}
    </span>
  );
}

function planLabel(plan: string): string {
  if (plan === "enterprise") return "Enterprise";
  if (plan === "premium") return "Premium";
  if (plan === "starter") return "Starter";
  return "Free plan";
}

function typeSummary(counts: Record<string, number>): string {
  const parts: string[] = [];
  if (counts.restaurant) parts.push(`${counts.restaurant} restaurant${counts.restaurant > 1 ? "s" : ""}`);
  if (counts.grocery) parts.push(`${counts.grocery} grocery`);
  if (counts.chef) parts.push(`${counts.chef} chef${counts.chef > 1 ? "s" : ""}`);
  return parts.join(" · ") || "Mixed shops";
}
