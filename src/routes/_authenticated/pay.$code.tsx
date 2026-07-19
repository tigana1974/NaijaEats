import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ShieldCheck, HandCoins } from "lucide-react";
import { RoleShell } from "@/components/naija/RoleShell";
import { loadWallet, lookupRequest, payRequestByCode } from "@/lib/wallet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pay/$code")({
  component: PayRequestPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function PayRequestPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ["pay-request", code],
    queryFn: () => lookupRequest(code),
    retry: false,
  });

  const pay = async () => {
    if (!request) return;
    const w = loadWallet();
    if (w.balance < request.amount) {
      toast.error("Insufficient wallet balance — top up first");
      navigate({ to: "/wallet/top-up" });
      return;
    }
    setPaying(true);
    try {
      await payRequestByCode(code);
      setDone(true);
      toast.success(`Paid ${fmt(request.amount)} to ${request.requester_name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete the payment");
    } finally {
      setPaying(false);
    }
  };

  return (
    <RoleShell hideBottomNav>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-gold)]/25 text-[var(--brand-clay)]">
            <HandCoins className="h-6 w-6" />
          </span>

          {isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Looking up this request…</div>
          ) : error || !request ? (
            <>
              <h1 className="font-display text-xl font-semibold mt-4">Request not found</h1>
              <p className="text-sm text-muted-foreground mt-1">
                This payment link is invalid or has been removed.
              </p>
            </>
          ) : done ? (
            <>
              <h1 className="font-display text-xl font-semibold mt-4">Payment sent 🎉</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(request.amount)} has been sent to {request.requester_name}.
              </p>
              <Link
                to="/wallet"
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                Back to wallet
              </Link>
            </>
          ) : request.status !== "open" ? (
            <>
              <h1 className="font-display text-xl font-semibold mt-4">Already settled</h1>
              <p className="text-sm text-muted-foreground mt-1">
                This request from {request.requester_name} is no longer open.
              </p>
            </>
          ) : (
            <>
              <div className="mt-4 text-sm text-muted-foreground">{request.requester_name} is requesting</div>
              <div className="font-display text-4xl font-semibold tabular-nums mt-1">{fmt(request.amount)}</div>
              {request.reason && (
                <div className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {request.reason}
                </div>
              )}
              <button
                onClick={pay}
                disabled={paying}
                className="mt-6 w-full h-12 rounded-2xl bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white text-sm font-bold shadow-lg hover:shadow-xl active:scale-[0.99] transition disabled:opacity-60"
              >
                {paying ? "Paying…" : `Pay ${fmt(request.amount)} from wallet`}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
                Instant and secure — straight from your Naija Eats wallet
              </div>
            </>
          )}
        </div>
      </div>
    </RoleShell>
  );
}
