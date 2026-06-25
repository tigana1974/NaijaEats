import { useMyRole } from "@/hooks/useMyRole";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { AppShell } from "@/components/naija/AppShell";
import type { ReactNode } from "react";

/**
 * Adaptive shell that renders AppShell for vendors/riders/admins
 * and CustomerShell for customers. Use this on shared pages
 * (account, wallet, settings, help, etc.) so they render within
 * the correct layout for each role.
 */
export function RoleShell({
  children,
  topBar,
  showBack,
  backTo,
  hideBottomNav,
}: {
  children: ReactNode;
  topBar?: ReactNode;
  showBack?: boolean;
  backTo?: string;
  hideBottomNav?: boolean;
}) {
  const { data: role } = useMyRole();

  if (role && role !== "customer") {
    return (
      <AppShell hideBottomNav={hideBottomNav}>
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
          <div className="mx-auto max-w-2xl">
            {topBar && (
              <div className="border-b border-border pb-4 mb-6">{topBar}</div>
            )}
            {children}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <CustomerShell
      topBar={topBar}
      showBack={showBack}
      backTo={backTo}
      hideBottomNav={hideBottomNav}
    >
      {children}
    </CustomerShell>
  );
}
