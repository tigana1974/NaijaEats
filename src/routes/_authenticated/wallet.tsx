import { createFileRoute } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { ComingSoonBanner } from "@/components/naija/ComingSoonBanner";
import { ShieldCheck, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
});

function WalletPage() {
  return (
    <RoleShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        <ComingSoonBanner feature="Wallet" />
        
        <div className="flex items-end justify-between mt-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Wallet</div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Your balance</h1>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-forest)]" /> Secured
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Digital Wallet Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We are currently integrating Paystack and Stripe. Soon you will be able to top up your balance, receive payouts, and manage your funds directly from here.
          </p>
        </div>
      </div>
    </RoleShell>
  );
}
