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
  containerClassName,
}: {
  children: ReactNode;
  topBar?: ReactNode;
  showBack?: boolean;
  backTo?: string;
  hideBottomNav?: boolean;
  containerClassName?: string;
}) {
  const { data: role } = useMyRole();

  if (role && role !== "customer") {
    return (
      <AppShell hideBottomNav={hideBottomNav}>
        <div className={containerClassName ?? "flex-1 overflow-y-auto px-4 pt-6 pb-24"}>
          {!containerClassName && topBar && (
            <div className="mx-auto max-w-2xl border-b border-border pb-4 mb-6">{topBar}</div>
          )}
          {containerClassName ? children : <div className="mx-auto max-w-2xl">{children}</div>}
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
      containerClassName={containerClassName}
    >
      {children}
    </CustomerShell>
  );
}
