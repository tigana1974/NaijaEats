import { useEffect, useState } from "react";
import { Link, useRouterState, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useMyRole";
import {
  Home,
  Store as StoreIcon,
  ClipboardList,
  BarChart3,
  Users as UsersIcon,
  FileText,
  Megaphone,
  Tag,
  Send,
  UtensilsCrossed,
  CreditCard,
  HandCoins,
  Bike,
  Shield,
  Truck,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  Menu as MenuIcon,
  X,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/naija/Logo";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  children?: { to: string; label: string }[];
};

/** Uber-Eats-style flat sidebar. Parent items with children are expandable. */
const NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Home", icon: Home },
  {
    to: "/admin/stores",
    label: "Store",
    icon: StoreIcon,
    children: [
      { to: "/admin/stores", label: "Store list" },
      { to: "/admin/store-groups", label: "Store groups" },
      { to: "/admin/webshop", label: "Webshop" },
      { to: "/admin/devices", label: "Devices" },
    ],
  },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/riders", label: "Riders", icon: Bike },
  {
    to: "/admin/performance",
    label: "Performance",
    icon: BarChart3,
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
    icon: UsersIcon,
    children: [
      { to: "/admin/customers", label: "Customer list" },
      { to: "/admin/customer-insights", label: "Customer insights" },
      { to: "/admin/reviews", label: "Reviews" },
    ],
  },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/ads", label: "Ads", icon: Megaphone },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/marketing", label: "Marketing", icon: Send },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  {
    to: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
    children: [
      { to: "/admin/payments", label: "Payments" },
      { to: "/admin/payouts", label: "Payouts" },
      { to: "/admin/payouts-orders", label: "Payouts by order" },
      { to: "/admin/invoices", label: "Invoices" },
      { to: "/admin/invoice-settings", label: "Invoice settings" },
      { to: "/admin/banking", label: "Banking" },
    ],
  },
  { to: "/admin/financing", label: "Financing", icon: HandCoins },
  { to: "/admin/users", label: "Users & roles", icon: Shield },
  { to: "/admin/delivery", label: "Delivery settings", icon: Truck },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [region, setRegion] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    return window.localStorage.getItem("naija-admin-region") ?? "all";
  });
  const [regionOpen, setRegionOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naija-admin-region", region);
  }, [region]);

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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin-unread"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user?.id) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.user.id)
        .eq("is_unread", true);
      return count ?? 0;
    },
    staleTime: 10000,
  });

  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  const initials = (me?.full_name || me?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const activeRegion = REGIONS.find((r) => r.id === region) ?? REGIONS[0];

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
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative rounded-md p-2 hover:bg-[oklch(0.965_0.003_260)]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--naija-orange)]" />
          )}
        </Link>
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
              open={regionOpen}
              onToggle={() => setRegionOpen((v) => !v)}
              onSelect={(id) => {
                setRegion(id);
                setRegionOpen(false);
              }}
            />
            <SidebarNav isActive={isActive} />
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
            open={regionOpen}
            onToggle={() => setRegionOpen((v) => !v)}
            onSelect={(id) => {
              setRegion(id);
              setRegionOpen(false);
            }}
          />
          <div className="flex-1 overflow-y-auto pb-3">
            <SidebarNav isActive={isActive} />
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
              aria-label="Notifications"
              className="relative rounded-full bg-[oklch(0.965_0.003_260)] p-2 hover:bg-[oklch(0.94_0.003_260)]"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--naija-orange)] px-1 text-[10px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Avatar className="h-8 w-8">
              <AvatarImage src={me?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[var(--naija-green)] text-white text-xs">
                {initials || "A"}
              </AvatarFallback>
            </Avatar>
          </header>

          <main className="min-h-screen">{children}</main>
        </div>
      </div>
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
  open,
  onToggle,
  onSelect,
}: {
  activeRegion: (typeof REGIONS)[number];
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
          {REGIONS.map((r) => {
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

function SidebarNav({ isActive }: { isActive: (to: string) => boolean }) {
  return (
    <nav className="px-2 pt-1">
      <ul className="space-y-0.5">
        {NAV.map((item) => (
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
          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
            active
              ? "bg-[oklch(0.945_0.003_260)] font-medium text-[oklch(0.18_0.006_260)]"
              : "text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
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
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
          active
            ? "bg-[oklch(0.945_0.003_260)] font-medium text-[oklch(0.18_0.006_260)]"
            : "text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
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
                      ? "bg-[oklch(0.945_0.003_260)] font-medium text-[oklch(0.18_0.006_260)]"
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
