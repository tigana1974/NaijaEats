/**
 * Used to flag scaffold pages whose backend tables don't exist yet (wallet,
 * notifications, referrals). Sits at the top of the page so the user knows
 * none of the numbers below are real before they spend time poking around.
 */
export function ComingSoonBanner({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 mb-4">
      <p className="text-sm font-semibold">{feature} — Coming soon</p>
      <p className="text-xs mt-0.5">
        This screen is a preview. The numbers and actions below are not connected to live data yet.
      </p>
    </div>
  );
}
