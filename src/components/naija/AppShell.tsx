import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Bell, MessageCircle, X } from "lucide-react";
import {
  PiSquaresFourDuotone,
  PiClipboardTextDuotone,
  PiForkKnifeDuotone,
  PiBasketDuotone,
  PiChartLineUpDuotone,
  PiWalletDuotone,
  PiChatCircleDotsDuotone,
  PiBellDuotone,
  PiPackageDuotone,
  PiFilesDuotone,
  PiShieldCheckDuotone,
  PiStorefrontDuotone,
  PiMopedDuotone,
  PiGearSixDuotone,
  PiSignOutDuotone,
  PiHouseDuotone,
  PiCalendarCheckDuotone,
  PiCompassDuotone,
  PiBagDuotone,
  PiUserCircleDuotone,
  PiSealCheckDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyRole, type AppRole } from "@/hooks/useMyRole";
import { VendorStoreSwitcher } from "./VendorStoreSwitcher";
import { Logo } from "@/components/naija/Logo";

export function AppShell({ children, hideHeader, hideBottomNav }: { children: React.ReactNode; hideHeader?: boolean; hideBottomNav?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { itemCount } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me-header"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      const profile = (p ?? {}) as { full_name?: string | null; avatar_url?: string | null; vendor_plan?: string | null };
      return {
        id: uid,
        email: u.user?.email ?? "",
        full_name: profile.full_name ?? null,
        avatar_url: profile.avatar_url ?? null,
        vendor_plan: profile.vendor_plan ?? "free",
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: vendorData } = useQuery({
    queryKey: ["my-vendor-data"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: v } = await supabase
        .from("vendors")
        .select("type, logo_url")
        .eq("owner_id", uid)
        .maybeSingle();
      return {
        type: v?.type || u.user?.user_metadata?.vendor_type || null,
        logo_url: v?.logo_url || null,
      };
    },
    enabled: role === "vendor",
    staleTime: 5 * 60 * 1000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications"],
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

  const vendorType = vendorData?.type;
  const vendorLogo = vendorData?.logo_url;
  const displayAvatar = vendorLogo || me?.avatar_url;

  const initials = (me?.full_name || me?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const chatLink = role === "vendor" ? "/vendor/messages" : role === "customer" ? "/chats" : null;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  type NavItem = { to: string; label: string; Icon: React.ComponentType<{ className?: string }> };
  const navByRole: Record<AppRole, NavItem[]> = {
    customer: [
      { to: "/discover", label: "Discover", Icon: PiCompassDuotone },
      { to: "/orders", label: "Orders", Icon: PiBagDuotone },
      { to: "/book", label: "Book", Icon: PiCalendarCheckDuotone },
      { to: "/wallet", label: "Wallet", Icon: PiWalletDuotone },
    ],
    vendor: (() => {
      const isGrocery = vendorType === "grocery";
      return [
        { to: "/vendor/dashboard", label: "Dashboard", Icon: PiSquaresFourDuotone },
        { to: "/vendor/orders", label: "Orders", Icon: PiClipboardTextDuotone },
        { to: "/vendor/menu", label: isGrocery ? "Groceries" : "Menu", Icon: isGrocery ? PiBasketDuotone : PiForkKnifeDuotone },
        { to: "/vendor/earnings", label: "Earnings", Icon: PiChartLineUpDuotone },
        { to: "/wallet", label: "Wallet", Icon: PiWalletDuotone },
      ];
    })(),
    rider: [
      { to: "/rider/dashboard", label: "Home", Icon: PiHouseDuotone },
      { to: "/rider/available", label: "Available jobs", Icon: PiPackageDuotone },
      { to: "/rider/earnings", label: "Earnings", Icon: PiChartLineUpDuotone },
      { to: "/wallet", label: "Wallet", Icon: PiWalletDuotone },
      { to: "/rider/documents", label: "Documents", Icon: PiFilesDuotone },
    ],
    admin: [
      { to: "/admin/dashboard", label: "Admin", Icon: PiShieldCheckDuotone },
      { to: "/admin/stores", label: "Stores", Icon: PiStorefrontDuotone },
      { to: "/admin/orders", label: "Orders", Icon: PiClipboardTextDuotone },
      { to: "/admin/riders", label: "Riders", Icon: PiMopedDuotone },
      { to: "/wallet", label: "Wallet", Icon: PiWalletDuotone },
    ],
  };

  // Extra role-specific links shown in the sidebar under a second section.
  const workspaceByRole: Partial<Record<AppRole, NavItem[]>> = {
    vendor: [
      { to: "/vendor/shops", label: "My shops", Icon: PiSquaresFourDuotone },
      { to: "/vendor/messages", label: "Messages", Icon: PiChatCircleDotsDuotone },
      { to: "/vendor/profile", label: vendorType === "grocery" ? "Store profile" : vendorType === "chef" ? "Kitchen profile" : "Restaurant profile", Icon: PiStorefrontDuotone },
      { to: "/vendor/subscription", label: "Subscription & billing", Icon: PiSealCheckDuotone },
    ],
    rider: [
      { to: "/account", label: "My profile", Icon: PiUserCircleDuotone },
    ],
    admin: [
      { to: "/admin/profile", label: "My profile", Icon: PiUserCircleDuotone },
    ],
  };

  // While the role is still loading, render no nav items rather than
  // defaulting to the customer nav (which would flash the wrong UI for
  // vendors / riders / admins right after sign-in).
  const navItems = role ? navByRole[role as AppRole] : roleLoading ? [] : navByRole.customer;
  const workspaceItems = role ? (workspaceByRole[role as AppRole] ?? []) : [];

  const roleTitle =
    role === "vendor"
      ? vendorType === "grocery"
        ? "Grocery store"
        : vendorType === "chef"
          ? "Chef"
          : "Restaurant"
      : role === "rider"
        ? "Delivery rider"
        : role === "admin"
          ? "Administrator"
          : "Member";

  const desktopNavItem = (to: string, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        isActive(to)
          ? "bg-[var(--brand-clay)] text-[var(--brand-cream)]"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  const mobileNavItem = (to: string, label: string, Icon: React.ComponentType<{ className?: string }>) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        aria-label={label}
        className="flex flex-1 items-center justify-center py-2"
      >
        <span
          className={`flex items-center justify-center gap-2 transition ${
            active
              ? "bg-[var(--brand-clay)] text-white shadow-lg shadow-[var(--brand-clay)]/40 px-4 h-11 rounded-full"
              : "h-11 w-11 rounded-full text-white/80 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {active ? <span className="text-sm font-medium whitespace-nowrap">{label}</span> : null}
        </span>
      </Link>
    );
  };

  const sidebarNavItem = (n: NavItem) => {
    const active = isActive(n.to);
    return (
      <Link
        key={n.to}
        to={n.to}
        onClick={() => setSidebarOpen(false)}
        className={`group relative flex items-center gap-3.5 rounded-2xl py-2.5 pl-3 pr-4 transition-all duration-200 ${
          active ? "bg-white/[0.08] text-white" : "text-white/55 hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        {/* Active indicator rail */}
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-[var(--brand-clay)] to-[var(--brand-gold)] transition-all duration-300 ${
            active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
          }`}
        />
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
            active
              ? "bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.62_0.22_40)] text-white shadow-lg shadow-[var(--brand-clay)]/35"
              : "bg-white/[0.06] text-white/70 group-hover:bg-white/10 group-hover:text-white"
          }`}
        >
          <n.Icon className="h-[22px] w-[22px]" />
        </span>
        <span className={`text-[15px] ${active ? "font-semibold" : "font-medium"}`}>{n.label}</span>
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <Logo className="h-8 w-8 transition-transform duration-300 group-hover:scale-105" />
              <div className="min-w-0 hidden xs:block sm:block">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Naija<span className="text-[var(--brand-clay)]">Eats</span>
                </span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {role === "customer" && navItems.map((n) => (
                <span key={n.to}>{desktopNavItem(n.to, n.label, n.Icon)}</span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {role === "vendor" && (
                <VendorStoreSwitcher userId={me?.id} plan={me?.vendor_plan} />
              )}
              {role === "customer" && (
                <Link
                  to="/cart"
                  aria-label="Cart"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold grid place-items-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}
              {chatLink && (
                <Link
                  to={chatLink}
                  aria-label="Messages"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-clay)]" />
                )}
              </Link>
              <Link
                to="/account"
                aria-label="Profile"
                className="rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition"
              >
                <Avatar className="h-9 w-9">
                  {displayAvatar ? <AvatarImage src={displayAvatar} alt={me?.full_name ?? "Profile"} /> : null}
                  <AvatarFallback className="text-xs font-semibold">{initials || "?"}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>
      )}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav for customers only */}
      {role === "customer" && navItems.length > 0 && !hideBottomNav && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none">
          <nav className="pointer-events-auto mx-auto max-w-sm flex items-stretch bg-[#1a1a1a] rounded-full px-2 py-1.5 shadow-2xl will-change-transform [transform:translateZ(0)]">
            {navItems.map((n) => (
              <span key={n.to} className="flex-1 flex">{mobileNavItem(n.to, n.label, n.Icon)}</span>
            ))}
          </nav>
        </div>
      )}

      {/* Floating Logo Button & Sidebar for Non-Customers */}
      {role && role !== "customer" && !hideBottomNav && (
        <>
          {/* FAB */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] shadow-2xl flex items-center justify-center hover:scale-105 hover:shadow-[0_8px_30px_-4px_rgba(255,77,77,0.55)] transition-all duration-300 ring-2 ring-white/25"
            aria-label="Open navigation menu"
          >
            <Logo className="h-7 w-7 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[var(--brand-gold)] ring-2 ring-background" />
            )}
          </button>

          {/* Sidebar Overlay */}
          <div
            className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <div
              className={`relative flex flex-col w-[320px] max-w-[calc(100vw-2rem)] h-[calc(100%-2rem)] my-4 ml-4 rounded-[2rem] shadow-2xl text-white overflow-hidden border border-white/10 transition-transform duration-300 ease-in-out bg-[#0b0b0d] ${
                sidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
              }`}
            >
              {/* Ambient brand glow */}
              <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[var(--brand-clay)]/25 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-[var(--brand-gold)]/10 blur-[90px]" />

              <div className="relative flex flex-col h-full overflow-y-auto scrollbar-hide p-5">
                {/* Header / Profile */}
                <div className="rounded-3xl bg-white/[0.05] border border-white/[0.07] p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <Link
                      to={role === "vendor" ? "/vendor/profile" : role === "admin" ? "/admin/profile" : "/account"}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-white/15 shadow-lg">
                          {displayAvatar ? <AvatarImage src={displayAvatar} /> : null}
                          <AvatarFallback className="text-sm font-semibold bg-white/10 text-white">{initials || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0b0d]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-[15px] leading-tight truncate">{me?.full_name || "My Account"}</h3>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-clay)]" />
                          {roleTitle}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Main nav */}
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Overview</p>
                <nav className="space-y-0.5">
                  {navItems.map(sidebarNavItem)}
                </nav>

                {workspaceItems.length > 0 && (
                  <>
                    <p className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Workspace</p>
                    <nav className="space-y-0.5">
                      {workspaceItems.map(sidebarNavItem)}
                    </nav>
                  </>
                )}

                {/* Footer: support + sign out */}
                <div className="mt-auto pt-6">
                  <div className="border-t border-white/[0.08] pt-4 space-y-0.5">
                    {sidebarNavItem({ to: "/notifications", label: unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications", Icon: PiBellDuotone })}
                    {sidebarNavItem({ to: "/settings", label: "Settings", Icon: PiGearSixDuotone })}
                    <button
                      type="button"
                      onClick={signOut}
                      className="group w-full flex items-center gap-3.5 rounded-2xl py-2.5 pl-3 pr-4 text-white/55 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-200"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-white/70 group-hover:bg-red-500/15 group-hover:text-red-300 transition-all duration-200">
                        <PiSignOutDuotone className="h-[22px] w-[22px]" />
                      </span>
                      <span className="text-[15px] font-medium">Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
