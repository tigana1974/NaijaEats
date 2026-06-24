import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Compass, LayoutDashboard, UtensilsCrossed, ClipboardList, Store, Bike, Wallet, PackageSearch, ShieldCheck, CalendarCheck, Bell, MessageCircle, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyRole, type AppRole } from "@/hooks/useMyRole";
import { Logo } from "@/components/naija/Logo";

export function AppShell({ children, hideHeader, hideBottomNav }: { children: React.ReactNode; hideHeader?: boolean; hideBottomNav?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { itemCount } = useCart();

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
      return { email: u.user?.email ?? "", ...(p ?? {}) } as { email: string; full_name?: string | null; avatar_url?: string | null };
    },
    staleTime: 5 * 60 * 1000,
  });

  const initials = (me?.full_name || me?.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const chatLink = role === "vendor" ? "/vendor/messages" : role === "customer" ? "/chats" : null;

  type NavItem = { to: string; label: string; Icon: React.ComponentType<{ className?: string }> };
  const navByRole: Record<AppRole, NavItem[]> = {
    customer: [
      { to: "/discover", label: "Discover", Icon: Compass },
      { to: "/orders", label: "Orders", Icon: ShoppingBag },
      { to: "/book", label: "Book", Icon: CalendarCheck },
      { to: "/wallet", label: "Wallet", Icon: Wallet },
    ],
    vendor: [
      { to: "/vendor/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/vendor/orders", label: "Orders", Icon: ClipboardList },
      { to: "/vendor/menu", label: "Menu", Icon: UtensilsCrossed },
      { to: "/vendor/earnings", label: "Earnings", Icon: Wallet },
      { to: "/vendor/profile", label: "Shop", Icon: Store },
    ],
    rider: [
      { to: "/rider/dashboard", label: "Home", Icon: LayoutDashboard },
      { to: "/rider/available", label: "Available", Icon: PackageSearch },
      { to: "/rider/earnings", label: "Earnings", Icon: Wallet },
      { to: "/rider/documents", label: "Documents", Icon: FileText },
    ],
    admin: [
      { to: "/admin/dashboard", label: "Admin", Icon: ShieldCheck },
      { to: "/admin/vendors", label: "Vendors", Icon: Store },
      { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
      { to: "/admin/riders", label: "Riders", Icon: Bike },
    ],
  };
  // While the role is still loading, render no nav items rather than
  // defaulting to the customer nav (which would flash the wrong UI for
  // vendors / riders / admins right after sign-in).
  const navItems = role ? navByRole[role as AppRole] : roleLoading ? [] : navByRole.customer;

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo className="h-8 w-8" />
              <span className="font-display text-lg font-semibold hidden sm:inline">Naija Eats</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {navItems.map((n) => (
                <span key={n.to}>{desktopNavItem(n.to, n.label, n.Icon)}</span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
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
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-clay)]" />
              </Link>
              <Link
                to="/account"
                aria-label="Profile"
                className="rounded-full ring-1 ring-border hover:ring-[var(--brand-clay)] transition"
              >
                <Avatar className="h-9 w-9">
                  {me?.avatar_url ? <AvatarImage src={me.avatar_url} alt={me.full_name ?? "Profile"} /> : null}
                  <AvatarFallback className="text-xs font-semibold">{initials || "?"}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>
      )}
      <main className="pb-20 md:pb-0">{children}</main>
      {/* Mobile bottom nav */}
      {navItems.length > 0 && !hideBottomNav && (
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-sm flex items-stretch bg-[#1a1a1a] rounded-full px-2 py-1.5 shadow-2xl will-change-transform [transform:translateZ(0)]">
          {navItems.map((n) => (
            <span key={n.to} className="flex-1 flex">{mobileNavItem(n.to, n.label, n.Icon)}</span>
          ))}
        </nav>
      </div>
      )}
    </div>
  );
}