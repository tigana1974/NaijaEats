import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronLeft, Plus, Sparkles, ShieldCheck, CreditCard, Building2, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet/top-up")({
  component: TopUpPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const PRESETS = [5000, 10000, 20000, 50000, 100000];
const METHODS = [
  { id: "card", label: "Debit card", sub: "Visa, Mastercard, Verve", Icon: CreditCard },
  { id: "bank", label: "Bank transfer", sub: "Instant via NIP", Icon: Building2 },
  { id: "ussd", label: "USSD", sub: "Dial *737#", Icon: Wallet },
];

function TopUpPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(20000);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const bonus = amount >= 20000 ? Math.round(amount * 0.1) : 0;

  const submit = async () => {
    if (!amount || amount < 500) return toast.error("Minimum top-up is ₦500");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success(`Topped up ${fmt(amount)}${bonus ? ` + ${fmt(bonus)} bonus` : ""}`);
    navigate({ to: "/wallet" });
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6">
        <Link to="/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Top up</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">Add to your wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">Instant credit, secured by Naija Eats.</p>
        </div>

        {/* Amount card */}
        <div className="relative mt-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.6),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1d1d1b,#3a1a14_60%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Amount</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl text-white/70">₦</span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-transparent font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30"
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          {bonus > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-gold)] text-foreground px-2.5 py-1 text-xs font-semibold">
              <Sparkles className="h-3 w-3" /> +{fmt(bonus)} Gold bonus
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`rounded-2xl border py-3 text-sm font-medium transition ${
                amount === p
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40"
              }`}
            >
              {fmt(p)}
            </button>
          ))}
        </div>

        {/* Methods */}
        <div className="mt-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">Pay with</div>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  method === m.id ? "border-foreground bg-muted/40" : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                  <m.Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </div>
                <span
                  className={`h-4 w-4 rounded-full border-2 ${method === m.id ? "border-foreground bg-foreground" : "border-muted-foreground/40"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
          256-bit encrypted · PCI-DSS compliant
        </div>

        <Button
          onClick={submit}
          disabled={loading}
          className="mt-5 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base"
        >
          {loading ? "Processing…" : <>Top up {fmt(amount || 0)} <Plus className="h-4 w-4" /></>}
        </Button>
      </div>
    </CustomerShell>
  );
}
