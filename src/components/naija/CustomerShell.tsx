import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { 
  IoHome, IoHomeOutline, 
  IoBagHandle, IoBagHandleOutline, 
  IoCalendar, IoCalendarOutline, 
  IoCart, IoCartOutline, 
  IoPersonCircle, IoPersonCircleOutline,
  IoNotifications
} from "react-icons/io5";
import { useCart } from "@/hooks/useCart";
import { Logo } from "@/components/naija/Logo";
import type { ReactNode } from "react";

/**
 * Mobile-first shell for customer-facing pages.
 * White background, soft shadows, rounded cards, floating bottom nav.
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
    <div className="min-h-dvh bg-white text-foreground">
      {topBar && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-3 sm:pt-5 pb-2 flex items-center gap-3">
            {showBack && (
              <Link
                to={backTo ?? "/discover"}
                className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="flex-1 min-w-0">{topBar}</div>
          </div>
        </div>
      )}

      <main
        className={
          containerClassName ?? "mx-auto max-w-6xl px-4 sm:px-6 pb-32 lg:pb-10 lg:pt-2"
        }
      >
        {children}
      </main>

      {!hideBottomNav && <CustomerBottomNav />}
    </div>
  );
}

/**
 * Header for the Home (discover) page.
 * Shows the NaijaEats logo + brand name on the left,
 * and a notification bell on the right.
 */
export function CustomerLocationHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link to="/discover" className="flex items-center gap-2.5 shrink-0 group">
        <Logo className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
        <div className="min-w-0">
          <span className="font-display text-lg font-bold tracking-tight text-zinc-900">
            Naija<span className="text-[var(--brand-clay)]">Eats</span>
          </span>
        </div>
      </Link>
      <Link
        to="/notifications"
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 text-zinc-700 transition-colors"
      >
        <IoNotifications className="h-5 w-5" />
      </Link>
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

  const items: {
    to: string;
    label: string;
    IconActive: any;
    IconInactive: any;
    matchPaths?: string[];
    matchSearch?: Record<string, unknown>;
    excludeSearch?: Record<string, unknown>;
    badge?: number;
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
    { to: "/account", label: "Account", IconActive: IoPersonCircle, IconInactive: IoPersonCircleOutline },
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
    <>
      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-md flex items-stretch bg-white rounded-full px-2 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100 backdrop-blur-md bg-white/95">
          {items.map((item) => (
            <BottomNavButton key={item.to} item={item} active={checkActive(item)} />
          ))}
        </nav>
      </div>

      {/* Desktop top nav row (only visible on lg+) */}
      <div className="hidden lg:flex sticky bottom-4 mx-auto max-w-md mt-10 -translate-y-2 z-50 items-stretch bg-white rounded-full px-2 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] ring-1 ring-zinc-100">
        {items.map((item) => (
          <BottomNavButton key={item.to} item={item} active={checkActive(item)} />
        ))}
      </div>
    </>
  );
}

function BottomNavButton({
  item,
  active,
}: {
  item: { to: string; label: string; IconActive: any; IconInactive: any; badge?: number };
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
      <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : ""}`} />
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
