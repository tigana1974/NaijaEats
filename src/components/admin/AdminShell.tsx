import { useEffect, useState } from "react";
import { Link, useRouterState, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadNotifications, formatBadgeCount } from "@/hooks/useUnreadNotifications";
import { useMyRole } from "@/hooks/useMyRole";
import {
  useAdminScope,
  isRegionUnlocked,
  unlockRegion,
  regionToCountry,
  REGION_EVENT,
  type AdminRegion,
} from "@/hooks/useAdminScope";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  Menu as MenuIcon,
  X,
  Check,
  Lock,
} from "lucide-react";
import {
  PiHouseDuotone,
  PiStorefrontDuotone,
  PiClipboardTextDuotone,
  PiChartBarDuotone,
  PiUsersThreeDuotone,
  PiFilesDuotone,
  PiMegaphoneDuotone,
  PiTagDuotone,
  PiPaperPlaneTiltDuotone,
  PiForkKnifeDuotone,
  PiCreditCardDuotone,
  PiHandCoinsDuotone,
  PiMopedDuotone,
  PiShieldCheckDuotone,
  PiTruckDuotone,
  PiGearSixDuotone,
  PiKeyDuotone,
} from "react-icons/pi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/naija/Logo";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { to: string; label: string }[];
};

/** Uber-Eats-style flat sidebar. Parent items with children are expandable. */
const NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Home", icon: PiHouseDuotone },
  {
    to: "/admin/stores",
    label: "Store",
    icon: PiStorefrontDuotone,
    children: [
      { to: "/admin/stores", label: "Store list" },
      { to: "/admin/store-groups", label: "Store groups" },
      { to: "/admin/webshop", label: "Webshop" },
      { to: "/admin/devices", label: "Devices" },
    ],
  },
  { to: "/admin/orders", label: "Orders", icon: PiClipboardTextDuotone },
  { to: "/admin/riders", label: "Riders", icon: PiMopedDuotone },
  {
    to: "/admin/performance",
    label: "Performance",
    icon: PiChartBarDuotone,
    children: [
      { to: "/admin/performance", label: "Performance" },
      { to: "/admin/sales", label: "Sales" },
      { to: "/admin/operations", label: "Operations" },
      { to: "/admin/success", label: "Success & Benchmarking" },
    ],
  },
  {
    to: "/admin/customers",
    label: "Customers",
    icon: PiUsersThreeDuotone,
    children: [
      { to: "/admin/customers", label: "Customer list" },
      { to: "/admin/customer-insights", label: "Customer insights" },
      { to: "/admin/reviews", label: "Reviews" },
    ],
  },
  { to: "/admin/reports", label: "Reports", icon: PiFilesDuotone },
  { to: "/admin/ads", label: "Ads", icon: PiMegaphoneDuotone },
  { to: "/admin/offers", label: "Offers", icon: PiTagDuotone },
  { to: "/admin/marketing", label: "Marketing", icon: PiPaperPlaneTiltDuotone },
  { to: "/admin/menu", label: "Menu", icon: PiForkKnifeDuotone },
  {
    to: "/admin/payments",
    label: "Payments",
    icon: PiCreditCardDuotone,
    children: [
      { to: "/admin/payments", label: "Payments" },
      { to: "/admin/payouts", label: "Payouts" },
      { to: "/admin/payouts-orders", label: "Payouts by order" },
      { to: "/admin/invoices", label: "Invoices" },
      { to: "/admin/invoice-settings", label: "Invoice settings" },
      { to: "/admin/banking", label: "Banking" },
    ],
  },
  { to: "/admin/financing", label: "Financing", icon: PiHandCoinsDuotone },
  { to: "/admin/users", label: "Users & roles", icon: PiShieldCheckDuotone },
  { to: "/admin/access", label: "Access control", icon: PiKeyDuotone },
  { to: "/admin/delivery", label: "Delivery settings", icon: PiTruckDuotone },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: PiGearSixDuotone,
    children: [
      { to: "/admin/settings", label: "Settings" },
      { to: "/admin/general", label: "General" },
      { to: "/admin/holiday-hours", label: "Holiday hours" },
      { to: "/admin/prep-times", label: "Preparation times" },
      { to: "/admin/documents", label: "Documents" },
    ],
  },
];

const REGIONS = [
  { 
    id: "all", 
    label: "All regions", 
    flag: <div className="h-full w-full bg-[#1e40af] flex items-center justify-center text-[10px]">🌍</div> 
  },
  { 
    id: "uk", 
    label: "United Kingdom", 
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="h-full w-full object-cover" preserveAspectRatio="none">
        <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
        <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <g clipPath="url(#s)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </g>
      </svg>
    )
  },
  { 
    id: "ng", 
    label: "Nigeria", 
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="h-full w-full object-cover" preserveAspectRatio="none">
        <rect width="60" height="30" fill="#fff" />
        <rect width="20" height="30" fill="#008751" />
        <rect x="40" width="20" height="30" fill="#008751" />
      </svg>
    )
  },
];

const SIDEBAR_WIDTH = 248;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: role, isLoading: roleLoading } = useMyRole();
  const scope = useAdminScope();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [region, setRegion] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    return window.localStorage.getItem("naija-admin-region") ?? "all";
  });
  const [regionOpen, setRegionOpen] = useState(false);
  const [codeModal, setCodeModal] = useState<"uk" | "ng" | null>(null);
  // Bumped after a successful code redemption so the lock state re-evaluates.
  const [, setUnlockVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naija-admin-region", region);
    // Every admin page listens for this via useAdminRegion and refetches its
    // data scoped to the newly selected country.
    window.dispatchEvent(new Event(REGION_EVENT));
  }, [region]);

  // Managers only see the panel for a country they've unlocked this session.
  const managerLocked =
    !scope.loading &&
    !scope.isParent &&
    (region === "all" || !isRegionUnlocked(region as AdminRegion));

  const switchRegion = (id: string) => {
    setRegion(id);
    const country = regionToCountry(id as AdminRegion);
    // Fire-and-forget: the switch itself lands in the audit trail.
    supabase.rpc("log_admin_event", { p_action: "region_switched", p_country: country ?? undefined }).then(() => {});
  };

  const handleRegionSelect = (id: string) => {
    setRegionOpen(false);
    if (scope.isParent) {
      switchRegion(id);
      return;
    }
    if (id === "all") {
      toast.error("Only the parent admin can view all regions.");
      return;
    }
    if (isRegionUnlocked(id as AdminRegion)) {
      switchRegion(id);
      return;
    }
    setCodeModal(id as "uk" | "ng");
  };

  const handleUnlocked = (id: "uk" | "ng") => {
    unlockRegion(id);
    setRegion(id);
    setUnlockVersion((v) => v + 1);
    setCodeModal(null);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const { data: me } = useQuery({
    queryKey: ["me-admin-header"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      return { email: u.user?.email ?? "", ...(p ?? {}) } as {
        email: string;
        full_name?: string | null;
        avatar_url?: string | null;
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { count: unreadCount } = useUnreadNotifications();

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  const initials = (me?.full_name || me?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const activeRegion = REGIONS.find((r) => r.id === region) ?? REGIONS[0];
  // "All regions" is a parent-admin privilege; managers pick one country.
  const visibleRegions = scope.isParent ? REGIONS : REGIONS.filter((r) => r.id !== "all");

  return (
    <div className="min-h-screen bg-white text-[oklch(0.18_0.006_260)]">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[oklch(0.92_0.003_260)] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 hover:bg-[oklch(0.965_0.003_260)]"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="font-semibold text-[15px]">Naija Eats Manager</div>
        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative rounded-md p-2 hover:bg-[oklch(0.965_0.003_260)]"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--naija-orange)] text-white text-[10px] font-bold grid place-items-center ring-2 ring-white">
                {formatBadgeCount(unreadCount)}
              </span>
            )}
          </Link>
          <Link to="/admin/profile" className="ml-1 rounded-full overflow-hidden">
            <Avatar className="h-7 w-7">
              <AvatarImage src={me?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[var(--naija-green)] text-white text-[10px]">
                {initials || "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[oklch(0.92_0.003_260)] px-4 py-3">
              <BrandMark />
              <button
                className="rounded-md p-2 hover:bg-[oklch(0.965_0.003_260)]"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <RegionSelector
              activeRegion={activeRegion}
              regions={visibleRegions}
              open={regionOpen}
              onToggle={() => setRegionOpen((v) => !v)}
              onSelect={handleRegionSelect}
            />
            <SidebarNav isActive={isActive} showAccessControl={scope.isParent} />
          </aside>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex">
        <aside
          className="hidden md:flex sticky top-0 h-screen flex-col border-r border-[oklch(0.92_0.003_260)] bg-white"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <div className="px-4 pt-4 pb-2">
            <BrandMark />
          </div>
          <RegionSelector
            activeRegion={activeRegion}
            regions={visibleRegions}
            open={regionOpen}
            onToggle={() => setRegionOpen((v) => !v)}
            onSelect={handleRegionSelect}
          />
          <div className="flex-1 overflow-y-auto pb-3">
            <SidebarNav isActive={isActive} showAccessControl={scope.isParent} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar — no search, matches Uber Eats: Help, Bell, Avatar */}
          <header className="sticky top-0 z-30 hidden md:flex items-center justify-end gap-2 border-b border-[oklch(0.92_0.003_260)] bg-white px-6 py-3">
            <Link
              to="/help"
              className="flex items-center gap-1.5 rounded-full bg-[oklch(0.965_0.003_260)] px-3 py-1.5 text-sm font-medium hover:bg-[oklch(0.94_0.003_260)]"
            >
              <HelpCircle className="h-4 w-4" /> Help
            </Link>
            <Link
              to="/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative rounded-full bg-[oklch(0.965_0.003_260)] p-2 hover:bg-[oklch(0.94_0.003_260)]"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--naija-orange)] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {formatBadgeCount(unreadCount)}
                </span>
              )}
            </Link>
            <Link to="/admin/profile" className="rounded-full overflow-hidden hover:ring-2 hover:ring-[var(--naija-green)] transition-all ml-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={me?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[var(--naija-green)] text-white text-xs">
                  {initials || "A"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </header>

          <main className="min-h-screen">
            {scope.loading ? (
              <div className="grid min-h-[60vh] place-items-center text-sm text-neutral-500">Loading…</div>
            ) : managerLocked ? (
              <ManagerLockScreen onUnlocked={handleUnlocked} />
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      <Link
        to="/xora"
        aria-label="Speak to Xora"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-[var(--naija-green)] py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:bg-[oklch(0.42_0.13_145)] focus:outline-none focus:ring-2 focus:ring-[var(--naija-green)] focus:ring-offset-2"
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40">
          <img src="/xora.jpg" alt="" className="h-full w-full object-cover object-top" draggable={false} />
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[var(--naija-green)]" />
        </span>
        <span className="hidden sm:inline">Xora</span>
      </Link>

      {codeModal && (
        <AccessCodeModal
          region={codeModal}
          onClose={() => setCodeModal(null)}
          onUnlocked={() => handleUnlocked(codeModal)}
        />
      )}
    </div>
  );
}

const REGION_NAMES: Record<"uk" | "ng", string> = { uk: "United Kingdom", ng: "Nigeria" };

/**
 * Full-screen gate shown to country managers until they redeem an access
 * code from the parent admin. Redemption is validated server-side and lands
 * in the audit log.
 */
function ManagerLockScreen({ onUnlocked }: { onUnlocked: (id: "uk" | "ng") => void }) {
  const [target, setTarget] = useState<"ng" | "uk">("ng");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("redeem_admin_code", {
        p_code: code.trim(),
        p_country: regionToCountry(target)!,
      });
      if (error) throw error;
      const res = data as { ok: boolean; reason?: string };
      if (!res?.ok) {
        toast.error(res?.reason ?? "That code didn't work.");
        return;
      }
      toast.success(`${REGION_NAMES[target]} panel unlocked`);
      onUnlocked(target);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify the code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[oklch(0.92_0.003_260)] bg-white p-6 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[oklch(0.96_0.03_145)] text-[var(--naija-green)]">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold">Manager access</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enter the access code the parent admin gave you to manage a region.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["ng", "uk"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                target === id
                  ? "border-[var(--naija-green)] bg-[oklch(0.96_0.03_145)] text-[oklch(0.32_0.10_145)]"
                  : "border-[oklch(0.92_0.003_260)] hover:bg-[oklch(0.965_0.003_260)]"
              }`}
            >
              {REGION_NAMES[id]}
            </button>
          ))}
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Access code"
          autoFocus
          className="mt-3 w-full rounded-lg border border-[oklch(0.92_0.003_260)] px-3 py-2.5 font-mono text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[var(--naija-green)]"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="mt-4 w-full rounded-lg bg-[var(--naija-green)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : `Unlock ${REGION_NAMES[target]}`}
        </button>
      </form>
    </div>
  );
}

/** Small dialog for an already-unlocked manager switching to the other country. */
function AccessCodeModal({
  region,
  onClose,
  onUnlocked,
}: {
  region: "uk" | "ng";
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("redeem_admin_code", {
        p_code: code.trim(),
        p_country: regionToCountry(region)!,
      });
      if (error) throw error;
      const res = data as { ok: boolean; reason?: string };
      if (!res?.ok) {
        toast.error(res?.reason ?? "That code didn't work.");
        return;
      }
      toast.success(`${REGION_NAMES[region]} panel unlocked`);
      onUnlocked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify the code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[oklch(0.96_0.03_145)] text-[var(--naija-green)]">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <div className="font-semibold">Switch to {REGION_NAMES[region]}</div>
            <div className="text-xs text-neutral-500">Enter the {REGION_NAMES[region]} access code.</div>
          </div>
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Access code"
          autoFocus
          className="mt-4 w-full rounded-lg border border-[oklch(0.92_0.003_260)] px-3 py-2.5 font-mono text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[var(--naija-green)]"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="flex-1 rounded-lg bg-[var(--naija-green)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-[oklch(0.92_0.003_260)] px-4 py-2.5 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function BrandMark() {
  return (
    <Link to="/admin/dashboard" className="flex items-center gap-2 min-w-0">
      <Logo className="h-8 w-8 shrink-0" />
      <span className="truncate text-[15px] font-semibold leading-tight">
        Naija Eats <span className="text-neutral-500 font-normal">Manager</span>
      </span>
    </Link>
  );
}

function RegionSelector({
  activeRegion,
  regions = REGIONS,
  open,
  onToggle,
  onSelect,
}: {
  activeRegion: (typeof REGIONS)[number];
  regions?: typeof REGIONS;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative px-3 pb-2 pt-1">
      <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        Region
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg border border-[oklch(0.92_0.003_260)] bg-white px-3 py-2 text-left text-sm hover:border-[oklch(0.86_0.003_260)]"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <div className="h-[18px] w-[18px] rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]">
            <span className="flex h-full w-full items-center justify-center">{activeRegion.flag}</span>
          </div>
          <span className="truncate font-medium">{activeRegion.label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-lg border border-[oklch(0.92_0.003_260)] bg-white shadow-lg">
          {regions.map((r) => {
            const active = r.id === activeRegion.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[oklch(0.965_0.003_260)] ${active ? "bg-[oklch(0.965_0.003_260)]" : ""}`}
              >
                <span className="flex items-center gap-2.5">
                  <div className="h-[18px] w-[18px] rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]">
                    <span className="flex h-full w-full items-center justify-center">{r.flag}</span>
                  </div>
                  <span>{r.label}</span>
                </span>
                {active && <Check className="h-4 w-4 text-[var(--naija-green)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarNav({
  isActive,
  showAccessControl,
}: {
  isActive: (to: string) => boolean;
  showAccessControl?: boolean;
}) {
  const items = NAV.filter((item) => item.to !== "/admin/access" || showAccessControl);
  return (
    <nav className="px-2 pt-1">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavRow key={item.to + item.label} item={item} isActive={isActive} />
        ))}
      </ul>
    </nav>
  );
}

function NavRow({ item, isActive }: { item: NavItem; isActive: (to: string) => boolean }) {
  const anyChildActive =
    !!item.children && item.children.some((c) => isActive(c.to));
  const active = isActive(item.to) || anyChildActive;
  const [open, setOpen] = useState<boolean>(anyChildActive);

  useEffect(() => {
    if (anyChildActive) setOpen(true);
  }, [anyChildActive]);

  const Icon = item.icon;

  if (!item.children) {
    return (
      <li>
        <Link
          to={item.to as unknown as never}
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
            active
              ? "bg-[oklch(0.96_0.03_145)] font-semibold text-[oklch(0.32_0.10_145)]"
              : "text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
          }`}
        >
          {active && (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--naija-green)]" />
          )}
          <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--naija-green)]" : "text-[oklch(0.42_0.006_260)] group-hover:text-[oklch(0.28_0.006_260)]"}`} />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
          active
            ? "bg-[oklch(0.96_0.03_145)] font-semibold text-[oklch(0.32_0.10_145)]"
            : "text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--naija-green)]" />
        )}
        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--naija-green)]" : "text-[oklch(0.42_0.006_260)] group-hover:text-[oklch(0.28_0.006_260)]"}`} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        )}
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 pb-1">
          {item.children.map((c) => {
            const cActive = isActive(c.to);
            return (
              <li key={c.to}>
                <Link
                  to={c.to as unknown as never}
                  className={`flex items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-[13.5px] transition-colors ${
                    cActive
                      ? "bg-[oklch(0.96_0.03_145)] font-medium text-[oklch(0.32_0.10_145)]"
                      : "text-[oklch(0.38_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
                  }`}
                >
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
