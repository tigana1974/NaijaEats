import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import * as Popover from "@radix-ui/react-popover";
import {
  ChevronDown,
  Plus,
  Sparkles,
  Search,
  Check,
  Settings,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import {
  PiStorefrontDuotone,
  PiForkKnifeDuotone,
  PiBasketDuotone,
  PiCookingPotDuotone,
  PiCircleDashedDuotone,
} from "react-icons/pi";
import { supabase } from "@/integrations/supabase/client";
import { useVendorStore } from "@/hooks/useVendorStore";

type Shop = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
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
  if (type === "grocery") return "Grocery store";
  if (type === "chef") return "Chef";
  if (type === "restaurant") return "Restaurant";
  return "Shop";
}

function statusTone(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return { dot: "bg-emerald-500", label: "Live", chip: "bg-emerald-100 text-emerald-700" };
    case "pending":
      return { dot: "bg-amber-500 animate-pulse", label: "Pending", chip: "bg-amber-100 text-amber-800" };
    case "suspended":
      return { dot: "bg-red-500", label: "Suspended", chip: "bg-red-100 text-red-700" };
    case "draft":
    default:
      return { dot: "bg-zinc-400", label: "Draft", chip: "bg-zinc-100 text-zinc-700" };
  }
}

export function VendorStoreSwitcher({ userId, plan }: { userId?: string; plan?: string }) {
  const navigate = useNavigate();
  const { activeShopId, setActiveShopId } = useVendorStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["my-shops", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, type, status, cover_image_url, logo_url")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });

  const activeShop = useMemo(
    () => shops.find((s) => s.id === activeShopId) ?? shops[0] ?? null,
    [shops, activeShopId],
  );

  const isAllMode = activeShopId === "ALL";
  const planKey = (plan ?? "free").toLowerCase();
  const limit = PLAN_LIMITS[planKey] ?? 1;
  const remaining = Math.max(0, limit - shops.length);
  const canAdd = shops.length < limit;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => (s.name + " " + (s.type ?? "")).toLowerCase().includes(q));
  }, [shops, query]);

  const pickShop = (id: string) => {
    setActiveShopId(id);
    setOpen(false);
    setQuery("");
    navigate({ to: "/vendor/dashboard" });
  };

  const pickAll = () => {
    setActiveShopId("ALL");
    setOpen(false);
    setQuery("");
    navigate({ to: "/vendor/shops" });
  };

  if (isLoading) return <div className="h-9 w-40 animate-pulse bg-muted rounded-full" />;
  if (shops.length === 0) return null;

  const showBadge = shops.length > 1;
  const TriggerIcon = isAllMode ? LayoutGrid : typeIcon(activeShop?.type);
  const triggerLabel = isAllMode ? "All shops" : activeShop?.name ?? "Select shop";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`group flex items-center gap-2 rounded-full ring-1 pl-1.5 pr-3 py-1 transition ${
            open
              ? "ring-[var(--brand-clay)] bg-[var(--brand-clay)]/[0.04]"
              : "ring-border hover:ring-[var(--brand-clay)]/60 bg-background"
          }`}
        >
          {isAllMode ? (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white">
              <LayoutGrid className="h-3.5 w-3.5" />
            </span>
          ) : activeShop?.logo_url ? (
            <img src={activeShop.logo_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-black/5" />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
              <TriggerIcon className="h-4 w-4" />
            </span>
          )}
          <span className="text-sm font-semibold max-w-[120px] truncate">{triggerLabel}</span>
          {showBadge && !isAllMode && (
            <span className="hidden sm:inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] text-[10px] font-bold">
              {shops.length}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          className="z-50 w-[360px] rounded-3xl border border-border bg-popover text-popover-foreground shadow-[0_24px_60px_-24px_rgba(0,0,0,0.28)] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.98_0.005_25)] to-white px-4 pt-4 pb-3 border-b border-border">
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--brand-clay)]/10 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">
                  Your shops
                </div>
                <div className="mt-0.5 font-display text-base font-bold text-foreground">
                  {shops.length} of {limit} · {planLabel(planKey)}
                </div>
              </div>
              <PlanBadge plan={planKey} />
            </div>

            {/* Search */}
            {shops.length >= 4 && (
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your shops"
                  className="w-full h-9 rounded-full border border-border bg-white pl-8 pr-3 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/15 transition"
                />
              </div>
            )}
          </div>

          {/* All shops mode */}
          {shops.length > 1 && (
            <button
              onClick={pickAll}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border transition group ${
                isAllMode ? "bg-[var(--brand-clay)]/[0.06]" : "hover:bg-muted/60"
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-lg shadow-[var(--brand-clay)]/25 shrink-0">
                <LayoutGrid className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-bold flex items-center gap-2">
                  All shops
                  <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] text-[10px] font-bold px-1.5 py-0.5">
                    Aggregate
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Combined dashboard across {shops.length} shops
                </div>
              </div>
              {isAllMode ? (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-clay)] text-white shrink-0">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              )}
            </button>
          )}

          {/* Shop list */}
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <PiCircleDashedDuotone className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="mt-2 text-sm font-semibold">No matches</div>
                <div className="text-xs text-muted-foreground">Try a different search</div>
              </div>
            ) : (
              filtered.map((shop) => {
                const active = !isAllMode && activeShop?.id === shop.id;
                const status = statusTone(shop.status);
                const Icon = typeIcon(shop.type);
                return (
                  <button
                    key={shop.id}
                    onClick={() => pickShop(shop.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition group ${
                      active ? "bg-[var(--brand-clay)]/[0.05]" : "hover:bg-muted/60"
                    }`}
                  >
                    {/* Cover / logo */}
                    <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-muted ring-1 ring-black/5">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : shop.cover_image_url ? (
                        <img src={shop.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-popover ${status.dot}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-bold truncate">{shop.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                        <span>{typeLabel(shop.type)}</span>
                        <span className="opacity-40">·</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${status.chip}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {active ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-clay)] text-white shrink-0">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-border p-2 space-y-0.5">
            <Link
              to="/vendor/shops"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/70 transition"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-foreground/70">
                <Settings className="h-4 w-4" />
              </span>
              Manage all shops
            </Link>
            {canAdd ? (
              <Link
                to="/vendor/profile"
                onClick={() => {
                  setOpen(false);
                  setActiveShopId(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--brand-clay)] hover:bg-[var(--brand-clay)]/[0.06] transition"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-clay)]/10">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">Add a new shop</span>
                <span className="rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] text-[10px] font-bold px-2 py-0.5">
                  {remaining} left
                </span>
              </Link>
            ) : (
              <Link
                to="/vendor/shops"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">Upgrade for more shops</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function planLabel(plan: string): string {
  if (plan === "enterprise") return "Enterprise";
  if (plan === "premium") return "Premium plan";
  if (plan === "starter") return "Starter plan";
  return "Free plan";
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-zinc-100 text-zinc-700",
    starter: "bg-blue-100 text-blue-700",
    premium: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25",
    enterprise: "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25",
  };
  const label = plan === "free" ? "FREE" : plan.slice(0, 3).toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[plan] ?? styles.free}`}>
      {plan === "premium" || plan === "enterprise" ? <Sparkles className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}
