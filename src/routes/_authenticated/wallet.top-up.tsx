import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { WalletKeypad } from "@/components/naija/WalletKeypad";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Plus,
  Sparkles,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  PiCreditCardDuotone,
  PiBankDuotone,
  PiDeviceMobileSpeakerDuotone,
  PiWalletDuotone,
  PiConfettiDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { loadWallet, WALLET_EVENT } from "@/lib/wallet";
import { useServerFn } from "@tanstack/react-start";
import { initiateWalletTopup } from "@/lib/api/payments.functions";
import { detectRegion } from "@/lib/premium";

export const Route = createFileRoute("/_authenticated/wallet/top-up")({
  component: TopUpPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const PRESETS = [5000, 10000, 20000, 50000, 100000, 200000];
const MIN_TOPUP = 500;

type MethodId = "card" | "bank" | "ussd";

const METHODS: {
  id: MethodId;
  label: string;
  sub: string;
  fee: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { id: "card", label: "Debit card", sub: "Visa, Mastercard, Verve", fee: "1.5% fee", Icon: PiCreditCardDuotone, tone: "bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)]" },
  { id: "bank", label: "Bank transfer", sub: "Instant NIP settlement", fee: "Free", Icon: PiBankDuotone, tone: "bg-[oklch(0.95_0.04_145)] text-[oklch(0.42_0.14_145)]" },
  { id: "ussd", label: "USSD", sub: "*737# from any bank", fee: "Free", Icon: PiDeviceMobileSpeakerDuotone, tone: "bg-[oklch(0.96_0.05_90)] text-[oklch(0.62_0.13_75)]" },
];

type Step = "amount" | "method" | "details" | "success";

function TopUpPage() {
  const navigate = useNavigate();
  const initiateTopup = useServerFn(initiateWalletTopup);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<MethodId>("card");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(loadWallet().balance);
    const refresh = () => setBalance(loadWallet().balance);
    window.addEventListener(WALLET_EVENT, refresh);
    return () => window.removeEventListener(WALLET_EVENT, refresh);
  }, []);

  const bonus = useMemo(() => (amount >= 20000 ? Math.round(amount * 0.1) : 0), [amount]);
  const total = amount + bonus;
  const methodMeta = METHODS.find((m) => m.id === method)!;

  const canContinue = step === "amount" ? amount >= MIN_TOPUP : step === "method";

  // Hand off to the secure provider checkout (card, transfer and USSD are all
  // handled on the provider's page). The wallet is credited by the payment
  // webhook once the provider confirms the charge — never by this client.
  const submit = async () => {
    if (amount < MIN_TOPUP) return toast.error(`Minimum top-up is ${fmt(MIN_TOPUP)}`);
    setLoading(true);
    try {
      const { checkoutUrl } = await initiateTopup({
        data: { amount, currency: detectRegion() === "UK" ? ("GBP" as const) : ("NGN" as const) },
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the top-up");
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step === "amount") setStep("method");
    else if (step === "method") submit();
  };

  const goBack = () => {
    if (step === "amount") return navigate({ to: "/wallet" });
    if (step === "method") return setStep("amount");
    return navigate({ to: "/wallet" });
  };

  return (
    <RoleShell hideBottomNav containerClassName="fixed inset-0 z-50 bg-[oklch(0.985_0.002_90)] overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:flex-1">
      <div className="mx-auto max-w-md w-full px-4 sm:px-6 py-4 sm:py-6 min-h-[100dvh] flex flex-col lg:min-h-0 lg:h-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 hover:bg-zinc-50 transition"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <StepIndicator step={step} />
            <div className="w-10" />
          </div>

          {step !== "success" && (
            <div className="mt-2 sm:mt-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">Top up</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {step === "amount" && "How much?"}
                {step === "method" && "Pay with"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "amount" && `Current balance: ${fmt(balance)}`}
                {step === "method" && "You'll complete payment on our secure payment partner's page"}
              </p>
            </div>
          )}

          {/* Step content */}
          {step === "amount" && (
            <AmountStep
              amount={amount}
              setAmount={setAmount}
              bonus={bonus}
              balance={balance}
            />
          )}

          {step === "method" && (
            <MethodStep amount={amount} method={method} setMethod={setMethod} bonus={bonus} />
          )}

          {/* Sticky footer CTA */}
          {step !== "success" && (
            <div className={`pt-2 sm:pt-6 pb-2 sm:pb-4 ${step === "amount" ? "mt-4" : "mt-auto"}`}>
              <button
                onClick={goNext}
                disabled={!canContinue || loading}
                className={`w-full h-14 rounded-2xl inline-flex items-center justify-center gap-2 text-base font-bold shadow-xl transition-all ${
                  canContinue && !loading
                    ? "bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white shadow-[var(--brand-clay)]/30 hover:shadow-2xl active:scale-[0.99]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Redirecting…
                  </>
                ) : step === "method" ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {fmt(amount)} securely
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
                Secured by PCI-DSS · 256-bit encrypted
              </div>
            </div>
          )}
      </div>
    </RoleShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["amount", "method"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === idx ? "w-8 bg-[var(--brand-clay)]" : i < idx ? "w-3 bg-[var(--brand-clay)]/40" : "w-3 bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

function AmountStep({
  amount,
  setAmount,
  bonus,
  balance,
}: {
  amount: number;
  setAmount: (n: number) => void;
  bonus: number;
  balance: number;
}) {
  return (
    <>
      {/* Balance preview */}
      <div className="relative mt-3 sm:mt-6 overflow-hidden rounded-2xl sm:rounded-[28px] p-3 sm:p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1a1108,#3a1a14_55%,#7c2d12)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Amount</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl text-white/70">₦</span>
            <input
              type="text"
              readOnly
              value={amount ? amount.toLocaleString() : "0"}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  const target = e.currentTarget;
                  if (target.selectionStart !== target.selectionEnd) {
                    setAmount(0);
                  } else {
                    const s = String(amount).slice(0, -1);
                    setAmount(s ? Number(s) : 0);
                  }
                } else if (/^[0-9]$/.test(e.key)) {
                  const next = amount === 0 ? Number(e.key) : Number(String(amount) + e.key);
                  setAmount(Math.min(next, 100000000));
                } else if (e.key === "Escape" || e.key === "Delete" || e.key.toLowerCase() === "c") {
                  setAmount(0);
                }
              }}
              className="w-full bg-transparent font-display text-4xl sm:text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30 caret-transparent"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
            <span>New balance {fmt(balance + amount + bonus)}</span>
            {bonus > 0 && (
              <span className="inline-flex items-center rounded-full bg-[var(--brand-gold)]/95 text-zinc-900 px-2 py-0.5 font-bold">
                +{fmt(bonus)} bonus
              </span>
            )}
          </div>
        </div>
      </div>



      {/* Bonus nudge */}
      <div className="mt-2 sm:mt-4 flex items-center gap-2 sm:gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-2 sm:p-3">
        <div className="flex-1">
          <div className="text-xs font-bold text-amber-900">Top up ₦20,000+ and get 10% free</div>
          {amount >= 20000 ? (
            <div className="text-[11px] text-emerald-600 font-bold">You unlocked {fmt(bonus)} bonus!</div>
          ) : (
            <div className="text-[11px] text-amber-800/80">Add {fmt(20000 - amount)} more to unlock</div>
          )}
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2">
        {[1000, 2000, 5000, 10000, 20000, 50000].map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`rounded-xl border py-3 text-sm font-bold transition ${
              amount === q
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            {fmt(q).replace('.00', '')}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="mt-auto pt-3 sm:pt-5">
        <WalletKeypad value={amount} onChange={setAmount} />
      </div>
    </>
  );
}

function MethodStep({ amount, method, setMethod, bonus }: { amount: number; method: MethodId; setMethod: (m: MethodId) => void; bonus: number }) {
  return (
    <>
      {/* Summary chip */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">You'll fund</div>
          <div className="font-display text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">
            {fmt(amount)}
            {bonus > 0 && <span className="text-sm font-semibold text-emerald-700 ml-1.5">+{fmt(bonus)}</span>}
          </div>
        </div>
        <PiWalletDuotone className="h-10 w-10 text-[var(--brand-clay)]" />
      </div>

      <div className="mt-5 space-y-2.5">
        {METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`group w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-[var(--brand-clay)] bg-white ring-2 ring-[var(--brand-clay)]/15 shadow-lg"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${m.tone}`}>
                <m.Icon className="h-6 w-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900">{m.label}</div>
                <div className="text-[11px] text-zinc-500">{m.sub}</div>
                <span className="inline-block mt-1 rounded-full bg-zinc-100 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 text-zinc-600">
                  {m.fee}
                </span>
              </div>
              <span
                className={`h-6 w-6 shrink-0 grid place-items-center rounded-full border-2 transition ${
                  active ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]" : "border-zinc-300"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

