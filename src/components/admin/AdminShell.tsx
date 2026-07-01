import { useEffect, useState } from "react";
import { Link, useRouterState, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/useMyRole";
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  TrendingUp,
  LineChart,
  Activity,
  Sparkles,
  BarChart3,
  Users,
  UserRoundSearch,
  MessageSquare,
  FileBarChart2,
  Megaphone,
  Tag,
  Send,
  UtensilsCrossed,
  CreditCard,
  Banknote,
  ReceiptText,
  FileText,
  Landmark,
  HandCoins,
  Shield,
  Truck,
  Settings2,
  Info,
  CalendarClock,
  Clock,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
    ],
  },
  {
    label: "Store",
    items: [
      { to: "/admin/stores", label: "Stores", icon: Store },
      { to: "/admin/store-groups", label: "Store groups", icon: Store },
      { to: "/admin/webshop", label: "Webshop", icon: Store },
      { to: "/admin/devices", label: "Devices", icon: Store },
    ],
  },
  {
    label: "Orders",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ClipboardList },
      { to: "/admin/operations", label: "Operations", icon: Activity },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/admin/performance", label: "Performance", icon: TrendingUp },
      { to: "/admin/sales", label: "Sales", icon: LineChart },
      { to: "/admin/success", label: "Success", icon: Sparkles },
      { to: "/admin/benchmarking", label: "Market benchmarking", icon: BarChart3 },
      { to: "/admin/reports", label: "Reports", icon: FileBarChart2 },
    ],
  },
  {
    label: "Customers",
    items: [
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/customer-insights", label: "Customer insights", icon: UserRoundSearch },
      { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/ads", label: "Ads", icon: Megaphone },
      { to: "/admin/offers", label: "Offers", icon: Tag },
      { to: "/admin/marketing", label: "Marketing", icon: Send },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/payouts", label: "Payouts", icon: Banknote },
      { to: "/admin/payouts-orders", label: "Payouts by order", icon: ReceiptText },
      { to: "/admin/invoices", label: "Invoices", icon: FileText },
      { to: "/admin/invoice-settings", label: "Invoice settings", icon: FileText },
      { to: "/admin/banking", label: "Banking", icon: Landmark },
      { to: "/admin/financing", label: "Financing", icon: HandCoins },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/users", label: "Users & roles", icon: Shield },
      { to: "/admin/delivery", label: "Delivery settings", icon: Truck },
      { to: "/admin/settings", label: "Settings", icon: Settings2 },
      { to: "/admin/general", label: "General", icon: Info },
      { to: "/admin/holiday-hours", label: "Holiday hours", icon: CalendarClock },
      { to: "/admin/prep-times", label: "Preparation times", icon: Clock },
      { to: "/admin/documents", label: "Documents", icon: FileCheck2 },
    ],
  },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_WIDTH_COLLAPSED = 68;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: role, isLoading: roleLoading } = useMyRole();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("naija-admin-sidebar") === "collapsed";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naija-admin-sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    // Close mobile drawer on route change
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

  // Access control: only admins can render this shell.
  if (!roleLoading && role !== "admin") return <Navigate to="/" replace />;

  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  const initials = (me?.full_name || me?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.003_90)] text-foreground">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-display font-semibold">Naija Eats Manager</div>
        <Link to="/admin/dashboard" aria-label="Notifications" className="relative rounded-md p-2 hover:bg-muted">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--naija-orange)]" />
          )}
        </Link>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <BrandMark collapsed={false} />
              <button className="rounded-md p-2 hover:bg-muted" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav collapsed={false} isActive={isActive} />
          </aside>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex">
        <aside
          className="hidden md:flex sticky top-0 h-screen flex-col border-r border-border bg-card transition-[width] duration-200"
          style={{ width }}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <BrandMark collapsed={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-md p-1.5 hover:bg-muted"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <SidebarNav collapsed={collapsed} isActive={isActive} />
          </div>
          <div className="border-t border-border px-2 py-3">
            <div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={me?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[var(--naija-green)] text-white text-xs">
                  {initials || "A"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{me?.full_name || "Admin"}</div>
                  <div className="truncate text-xs text-muted-foreground">{me?.email}</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar */}
          <header className="sticky top-0 z-30 hidden md:flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <div className="flex items-center gap-3 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search orders, stores, customers…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-[var(--naija-green)]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/help"
                className="hidden lg:flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4" /> Help
              </Link>
              <Link to="/notifications" aria-label="Notifications" className="relative rounded-full border border-border p-2 hover:bg-muted">
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
            </div>
          </header>

          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/admin/dashboard" className="flex items-center gap-2 min-w-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--naija-green)] text-white font-display font-bold">
        N
      </span>
      {!collapsed && (
        <span className="truncate font-display text-sm font-semibold">
          Naija Eats <span className="text-muted-foreground font-normal">Manager</span>
        </span>
      )}
    </Link>
  );
}

function SidebarNav({
  collapsed,
  isActive,
}: {
  collapsed: boolean;
  isActive: (to: string) => boolean;
}) {
  return (
    <nav className="px-2">
      {NAV.map((group, gi) => (
        <NavGroupBlock key={gi} group={group} collapsed={collapsed} isActive={isActive} />
      ))}
    </nav>
  );
}

function NavGroupBlock({
  group,
  collapsed,
  isActive,
}: {
  group: NavGroup;
  collapsed: boolean;
  isActive: (to: string) => boolean;
}) {
  const anyActive = group.items.some((i) => isActive(i.to));
  const [open, setOpen] = useState<boolean>(true);
  useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);

  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <span>{group.label}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      )}
      {(open || collapsed) && (
        <ul className="mt-1 space-y-0.5">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLinkItem item={item} active={isActive(item.to)} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavLinkItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const base =
    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors";
  const activeCls =
    "bg-[var(--naija-green)]/10 text-[var(--naija-green)] font-medium";
  const idleCls = "text-foreground/80 hover:bg-muted hover:text-foreground";
  // TanStack Link is strongly typed on `to`; some routes are added by regen after commit.
  // We keep behaviour with an untyped Link fallback so all admin nav works at runtime.
  const to = item.to as unknown as never;
  return (
    <Link
      to={to}
      title={collapsed ? item.label : undefined}
      className={`${base} ${active ? activeCls : idleCls} ${collapsed ? "justify-center px-0" : ""}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--naija-green)]" : ""}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
