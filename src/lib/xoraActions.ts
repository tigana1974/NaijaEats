/**
 * Xora action contract.
 *
 * Xora is agentic: instead of only describing what a user could do, it returns
 * ACTIONS the app performs. Read-only lookups run on the server; anything that
 * changes the user's state runs in the browser where the session, cart and
 * router live.
 *
 * Money-moving steps (paying for an order) are deliberately NOT auto-executed.
 * Xora prepares them and the user confirms with one tap — an assistant should
 * never silently spend someone's money.
 */
export type XoraAction =
  | { type: "navigate"; to: string; label: string }
  | {
      type: "add_to_cart";
      label: string;
      quantity: number;
      vendor: { id: string; name: string; slug: string; currency: string; deliveryFee: number; minOrder: number };
      item: { menuItemId: string; name: string; price: number; imageUrl?: string | null };
    }
  | { type: "open_checkout"; label: string }
  | { type: "confirm_payment"; orderId: string; amount: number; currency: string; label: string }
  | { type: "set_order_status"; orderId: string; status: string; label: string };

/** Actions that must be confirmed by the user before they run. */
export function requiresConfirmation(action: XoraAction): boolean {
  return action.type === "confirm_payment" || action.type === "set_order_status";
}

/** Whitelisted in-app destinations Xora may open, per role. */
export const ALLOWED_ROUTES: Record<string, string[]> = {
  customer: [
    "/discover", "/chefs", "/restaurants", "/groceries", "/search",
    "/cart", "/orders", "/wallet", "/wallet/top-up", "/wallet/send",
    "/wallet/request", "/wallet/split", "/referrals", "/subscription",
    "/book", "/book/build", "/chats", "/account", "/notifications", "/help",
  ],
  vendor: [
    "/vendor/dashboard", "/vendor/orders", "/vendor/menu", "/vendor/shops",
    "/vendor/earnings", "/vendor/messages", "/vendor/profile", "/vendor/subscription",
  ],
  rider: ["/rider/dashboard", "/rider/available", "/rider/earnings", "/rider/documents"],
  admin: [
    "/admin/dashboard", "/admin/orders", "/admin/stores", "/admin/customers",
    "/admin/payouts", "/admin/reports", "/admin/riders", "/admin/menu",
    "/admin/offers", "/admin/users", "/admin/documents", "/admin/reviews",
  ],
};

export function isRouteAllowed(role: string, to: string): boolean {
  const base = (to.split("?")[0] || "").replace(/\/+$/, "") || "/";
  return (ALLOWED_ROUTES[role] ?? []).some((r) => r === base || base.startsWith(r + "/"));
}
