import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Sparkles } from "lucide-react";
import {
  IoHome, IoHomeOutline,
  IoBagHandle, IoBagHandleOutline,
  IoCalendar, IoCalendarOutline,
  IoCart, IoCartOutline,
  IoPersonCircle, IoPersonCircleOutline,
  IoNotifications, IoWalletOutline,
  IoReceiptOutline, IoChatbubblesOutline, IoSearch,
  IoHelpCircleOutline
} from "react-icons/io5";
import { useCart } from "@/hooks/useCart";
import { Logo } from "@/components/naija/Logo";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PremiumUpsellDialog } from "@/components/naija/PremiumUpsellDialog";
import { FloatingXoraButton } from "@/components/naija/FloatingXoraButton";
import { useUnreadNotifications, formatBadgeCount } from "@/hooks/useUnreadNotifications";

/**
 * Customer shell.
 *
 * Mobile (< lg): app-like — sticky page top bar, floating bottom nav pill.
 * Desktop (lg+): desktop application chrome — fixed left sidebar with the
 * full nav, persistent top bar with global search / bell / wallet / cart,
 * and a wide content area. The page-specific `topBar` only renders on
 * mobile; on desktop the sidebar + header replace it.
 */
export function CustomerShell({
  children,
  topBar,
  hideBottomNav,
  showBack,
  backTo,
  containerClassName,
}: {
  children: ReactNode;
  topBar?: ReactNode;
  hideBottomNav?: boolean;
  showBack?: boolean;
  backTo?: string;
  containerClassName?: string;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground flex overflow-x-clip">
      {/* ─── Desktop sidebar ─── */}
      <DesktopSidebar />

      <div className="flex-1 min-w-0 flex flex-col lg:pl-60">
        {/* ─── Desktop top bar ─── */}
        <DesktopTopBar />

        {/* ─── Mobile page top bar ─── */}
        {topBar && (
          <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-3 sm:pt-5 pb-2 flex items-center gap-3">
              {showBack && (
                <Link
                  to={backTo ?? "/discover"}
                  className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              )}
              <div className="flex-1 min-w-0">{topBar}</div>
            </div>
          </div>
        )}

        {/* Desktop back link for subpages */}
        {showBack && (
          <div className="hidden lg:block px-8 pt-5">
            <Link
              to={backTo ?? "/discover"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        )}

        <main
          className={
            containerClassName ??
            "mx-auto w-full max-w-2xl lg:max-w-4xl px-3 sm:px-5 lg:px-8 pb-28 lg:pb-12 lg:pt-4"
          }
        >
          {children}
        </main>
      </div>

      {!hideBottomNav && <CustomerBottomNav />}
      <PremiumUpsellDialog />
      <FloatingXoraButton />
    </div>
  );
}

/* ─── Desktop sidebar — fixed, full nav like a real desktop app ─── */

const SIDEBAR_ITEMS: {
  to: string;
  label: string;
  IconActive: any;
  IconInactive: any;
  matchPaths?: string[];
}[] = [
  { to: "/discover", label: "Home", IconActive: IoHome, IconInactive: IoHomeOutline, matchPaths: ["/", "/discover"] },
  { to: "/groceries", label: "Groceries", IconActive: IoBagHandle, IconInactive: IoBagHandleOutline },
  { to: "/book", label: "Meal planner", IconActive: IoCalendar, IconInactive: IoCalendarOutline },
  { to: "/orders", label: "Orders", IconActive: IoReceiptOutline, IconInactive: IoReceiptOutline },
  { to: "/chats", label: "Messages", IconActive: IoChatbubblesOutline, IconInactive: IoChatbubblesOutline },
  { to: "/wallet", label: "Wallet", IconActive: IoWalletOutline, IconInactive: IoWalletOutline },
];

function DesktopSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useQuery({
    queryKey: ["my-profile-nav"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).maybeSingle();
      return data as { avatar_url: string | null; full_name: string | null } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isActive = (item: (typeof SIDEBAR_ITEMS)[number]) =>
    (item.matchPaths ?? [item.to]).some((p) => pathname === p || (p !== "/" && pathname.startsWith(p)));

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-card">
      {/* Brand */}
      <Link to="/discover" className="flex items-center gap-2.5 px-5 h-16 border-b border-border/60 shrink-0">
        <Logo className="h-8 w-8" />
        <span className="font-display text-[15px] font-bold tracking-tight">
          Naija<span className="text-[var(--brand-clay)]">Eats</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = active ? item.IconActive : item.IconInactive;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--brand-clay)]" : ""}`} />
              {item.label}
            </Link>
          );
        })}

        {/* Xora — AI assistant, highlighted */}
        <Link
          to="/xora"
          className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            pathname === "/xora"
              ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]"
              : "text-muted-foreground hover:bg-[var(--brand-clay)]/5 hover:text-[var(--brand-clay)]"
          }`}
        >
          <Sparkles className="h-5 w-5 shrink-0 text-[var(--brand-clay)]" />
          Ask Xora
          <span className="ml-auto rounded-full bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            AI
          </span>
        </Link>
      </nav>

      {/* Bottom: help + account */}
      <div className="px-3 py-4 border-t border-border/60 space-y-0.5 shrink-0">
        <Link
          to="/help"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <IoHelpCircleOutline className="h-5 w-5 shrink-0" />
          Help
        </Link>
        <Link
          to="/account"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            pathname.startsWith("/account")
              ? "bg-foreground/[0.06] text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
          ) : (
            <IoPersonCircleOutline className="h-5 w-5 shrink-0" />
          )}
          <span className="truncate">{profile?.full_name || "Account"}</span>
        </Link>
      </div>
    </aside>
  );
}

/* ─── Desktop top bar — global search, bell, wallet, cart ─── */

function DesktopTopBar() {
  const { itemCount } = useCart();
  const { count: unreadCount } = useUnreadNotifications();

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center gap-4 px-8 bg-background/85 backdrop-blur-md border-b border-border/60">
      {/* Global search */}
      <Link to="/search" className="relative flex-1 max-w-xl">
        <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <div className="w-full rounded-full bg-muted/70 hover:bg-muted transition pl-11 pr-4 py-2.5 text-sm font-medium text-muted-foreground">
          Search Naija Eats
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted text-foreground transition"
        >
          <IoNotifications className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold grid place-items-center ring-2 ring-background">
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </Link>
        <Link
          to="/wallet"
          aria-label="Wallet"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted text-foreground transition"
        >
          <IoWalletOutline className="h-5 w-5" />
        </Link>
        <Link
          to="/cart"
          aria-label="Cart"
          className="relative inline-flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-2.5 text-sm font-bold hover:opacity-90 transition"
        >
          <IoCart className="h-4 w-4" />
          Cart
          {itemCount > 0 && (
            <span className="grid min-w-[20px] h-5 px-1 place-items-center rounded-full bg-[var(--brand-clay)] text-white text-[11px] font-bold">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

/**
 * Header for the Home (discover) page.
 * Shows the NaijaEats logo + brand name on the left,
 * and a notification bell on the right.
 */
export function CustomerLocationHeader() {
  const { count: unreadCount } = useUnreadNotifications();
  return (
    <div className="flex items-center justify-between gap-3">
      <Link to="/discover" className="flex items-center gap-2.5 shrink-0 group">
        <Logo className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
        <div className="min-w-0">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Naija<span className="text-[var(--brand-clay)]">Eats</span>
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted text-foreground transition-colors"
        >
          <IoNotifications className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--brand-clay)] text-white text-[10px] font-bold grid place-items-center ring-2 ring-background">
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </Link>
        <Link
          to="/wallet"
          aria-label="Wallet"
          className="relative inline-flex h-11 w-11 sm:w-auto sm:px-4 items-center justify-center gap-2 rounded-full border border-border bg-card shadow-sm hover:bg-muted text-foreground transition-colors font-bold text-sm"
        >
          <IoWalletOutline className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Wallet</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * Bottom nav: white pill, active item highlighted with brand color.
 * Home | Groceries | Book | Cart | Account
 */
function CustomerBottomNav() {
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const searchObj = location.search as Record<string, unknown>;
  const { itemCount } = useCart();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-nav"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items: {
    to: string;
    label: string;
    IconActive: any;
    IconInactive: any;
    matchPaths?: string[];
    matchSearch?: Record<string, unknown>;
    excludeSearch?: Record<string, unknown>;
    badge?: number;
    avatarUrl?: string | null;
  }[] = [
    { 
      to: "/discover", 
      label: "Home", 
      IconActive: IoHome, 
      IconInactive: IoHomeOutline,
      matchPaths: ["/", "/discover"],
    },
    { 
      to: "/groceries", 
      label: "Groceries", 
      IconActive: IoBagHandle,
      IconInactive: IoBagHandleOutline,
    },
    { 
      to: "/book", 
      label: "Book", 
      IconActive: IoCalendar,
      IconInactive: IoCalendarOutline,
    },
    { to: "/cart", label: "Cart", IconActive: IoCart, IconInactive: IoCartOutline, badge: itemCount },
    { to: "/account", label: "Account", IconActive: IoPersonCircle, IconInactive: IoPersonCircleOutline, avatarUrl: profile?.avatar_url },
  ];

  const checkActive = (item: typeof items[0]) => {
    const pathMatches = (item.matchPaths ?? [item.to.split("?")[0]]).some(
      (p) => pathname === p || (p !== "/" && pathname.startsWith(p)),
    );
    if (!pathMatches) return false;

    if (item.matchSearch) {
      for (const [k, v] of Object.entries(item.matchSearch)) {
        if (searchObj[k] !== v) return false;
      }
    }
    if (item.excludeSearch) {
      for (const [k, v] of Object.entries(item.excludeSearch)) {
        if (searchObj[k] === v) return false;
      }
    }
    return true;
  };

  return (
    /* Mobile-only bottom nav — on desktop the fixed sidebar handles navigation */
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full mx-auto max-w-md flex items-stretch bg-card rounded-full px-2 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] ring-1 ring-border backdrop-blur-md bg-card/95">
        {items.map((item) => (
          <BottomNavButton key={item.to} item={item} active={checkActive(item)} />
        ))}
      </nav>
    </div>
  );
}

function BottomNavButton({
  item,
  active,
}: {
  item: { to: string; label: string; IconActive: any; IconInactive: any; badge?: number; avatarUrl?: string | null };
  active: boolean;
}) {
  const Icon = active ? item.IconActive : item.IconInactive;
  return (
    <Link
      to={item.to}
      className={`relative flex-1 flex flex-col items-center justify-center gap-1 rounded-full text-[10px] font-bold transition px-1 py-1.5 ${
        active
          ? "text-[var(--brand-clay)]"
          : "text-zinc-500 hover:text-zinc-800"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {item.avatarUrl ? (
        <img src={item.avatarUrl} alt="Avatar" className={`h-6 w-6 rounded-full object-cover transition-transform ${active ? "scale-110 ring-2 ring-offset-1 ring-[var(--brand-clay)]" : ""}`} />
      ) : (
        <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : ""}`} />
      )}
      <span className={`transition-opacity ${active ? "opacity-100" : "opacity-0 h-0 overflow-hidden sm:h-auto sm:opacity-100"}`}>
        {item.label}
      </span>
      {!!item.badge && item.badge > 0 && (
        <span className="absolute top-0 right-3 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--brand-ink)] px-1 text-[9px] font-bold text-white ring-2 ring-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}
