import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleShell } from "@/components/naija/RoleShell";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, CreditCard, Wallet, ShieldCheck, Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payment-methods")({
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  // Recent card payments (via Paystack/Stripe) for this customer's orders.
  const { data: payments, isLoading } = useQuery({
    queryKey: ["my-card-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, provider, amount, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold">Payment Methods</h1>

        <Link to="/wallet" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-[var(--brand-clay)]/40 transition">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-clay)]">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium">Naija Eats Wallet</div>
            <div className="text-xs text-muted-foreground">Top up once, pay instantly at checkout</div>
          </div>
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium">Cards, bank transfer & USSD</div>
              <div className="text-xs text-muted-foreground">Paystack (Nigeria) · Stripe (UK)</div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Card details are entered on our payment partners' secure pages at checkout and top-up —
            Naija Eats never sees or stores your card number.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
            PCI-DSS compliant · 3-D Secure protected
          </div>
        </div>

        {/* Recent provider payments */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent card payments</h2>
          <ul className="mt-3 space-y-3">
            {isLoading ? (
              <li className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">Loading…</li>
            ) : (payments ?? []).length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No card payments yet — pay for an order or top up your wallet to see them here.
              </li>
            ) : (
              (payments ?? []).map((p: any) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">{p.provider} payment</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      <span className="capitalize">{p.status}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold tabular-nums">{fmt(Number(p.amount), p.currency)}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </RoleShell>
  );
}
