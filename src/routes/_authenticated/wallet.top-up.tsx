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
import { addWalletTxn, loadWallet } from "@/lib/wallet";

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
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(20000);
  const [method, setMethod] = useState<MethodId>("card");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    setBalance(loadWallet().balance);
  }, []);

  const bonus = useMemo(() => (amount >= 20000 ? Math.round(amount * 0.1) : 0), [amount]);
  const total = amount + bonus;
  const methodMeta = METHODS.find((m) => m.id === method)!;

  const cardValid =
    cardNumber.replace(/\s/g, "").length >= 15 &&
    cardName.trim().length >= 3 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3;

  const canContinue =
    step === "amount"
      ? amount >= MIN_TOPUP
      : step === "method"
        ? true
        : step === "details"
          ? method === "card" ? cardValid : true
          : false;

  const submit = async () => {
    if (amount < MIN_TOPUP) return toast.error(`Minimum top-up is ${fmt(MIN_TOPUP)}`);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    addWalletTxn({ type: "topup", title: "Wallet top-up", note: methodMeta.label, amount });
    if (bonus > 0) addWalletTxn({ type: "bonus", title: "Gold bonus", note: "10% top-up bonus", amount: bonus });
    setLoading(false);
    setStep("success");
  };

  const goNext = () => {
    if (step === "amount") setStep("method");
    else if (step === "method") setStep("details");
    else if (step === "details") submit();
  };

  const goBack = () => {
    if (step === "amount") return navigate({ to: "/wallet" });
    if (step === "method") return setStep("amount");
    if (step === "details") return setStep("method");
    if (step === "success") return navigate({ to: "/wallet" });
  };

  return (
    <RoleShell hideBottomNav containerClassName="flex-1 bg-[oklch(0.985_0.002_90)] flex flex-col pb-32">
      <div className="mx-auto max-w-md w-full px-4 sm:px-6 py-5">
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
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">Top up</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {step === "amount" && "How much?"}
                {step === "method" && "Pay with"}
                {step === "details" && (method === "card" ? "Card details" : method === "bank" ? "Bank transfer" : "USSD instructions")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "amount" && `Current balance: ${fmt(balance)}`}
                {step === "method" && "Choose how you want to fund your wallet"}
                {step === "details" && (method === "card" ? "Your card is encrypted end-to-end" : method === "bank" ? "Transfer to this account, we'll credit instantly" : "Dial from the phone linked to your bank")}
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

          {step === "details" && (
            <DetailsStep
              method={method}
              amount={amount}
              bonus={bonus}
              methodMeta={methodMeta}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardName={cardName}
              setCardName={setCardName}
              expiry={expiry}
              setExpiry={setExpiry}
              cvv={cvv}
              setCvv={setCvv}
            />
          )}

          {step === "success" && <SuccessStep amount={amount} bonus={bonus} total={total} balance={balance + total} />}

          {/* Sticky footer CTA */}
          {step !== "success" && (
            <div className="mt-6 sticky bottom-4 z-10">
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
                    Processing…
                  </>
                ) : step === "details" ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {fmt(amount)}
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
  const steps: Step[] = ["amount", "method", "details", "success"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {steps.slice(0, 3).map((s, i) => (
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
      <div className="relative mt-6 overflow-hidden rounded-2xl sm:rounded-[28px] p-4 sm:p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1a1108,#3a1a14_55%,#7c2d12)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Amount</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl text-white/70">₦</span>
            <input
              type="text"
              inputMode="none"
              value={amount ? amount.toLocaleString() : ""}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmount(raw ? Number(raw) : 0);
              }}
              className="w-full bg-transparent font-display text-4xl sm:text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
            <span>New balance {fmt(balance + amount + bonus)}</span>
            {bonus > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold)]/95 text-zinc-900 px-2 py-0.5 font-bold">
                <Sparkles className="h-3 w-3" /> +{fmt(bonus)} bonus
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-2xl border py-3 text-sm font-semibold transition ${
              amount === p
                ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]/8 text-[var(--brand-clay)] ring-2 ring-[var(--brand-clay)]/20"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            {fmt(p)}
          </button>
        ))}
      </div>

      {/* Bonus nudge */}
      {amount < 20000 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-900">Top up ₦20,000+ and get 10% free</div>
            <div className="text-[11px] text-amber-800/80">Add {fmt(20000 - amount)} more to unlock</div>
          </div>
        </div>
      )}

      {/* Keypad */}
      <div className="mt-5">
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

function DetailsStep({
  method,
  amount,
  bonus,
  methodMeta,
  cardNumber,
  setCardNumber,
  cardName,
  setCardName,
  expiry,
  setExpiry,
  cvv,
  setCvv,
}: any) {
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  return (
    <>
      {/* Amount recap */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 p-4">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${methodMeta.tone}`}>
          <methodMeta.Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Paying with {methodMeta.label}</div>
          <div className="font-display text-xl font-bold tabular-nums leading-tight mt-0.5">
            {fmt(amount)}
            {bonus > 0 && <span className="text-xs font-semibold text-emerald-700 ml-2">+ {fmt(bonus)} bonus</span>}
          </div>
        </div>
      </div>

      {method === "card" && (
        <div className="mt-5 space-y-4">
          {/* Faux card visual */}
          <div className="relative aspect-[1.586] max-w-sm mx-auto rounded-3xl overflow-hidden text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.4),transparent_55%),linear-gradient(135deg,#1a1108,#3a1a14_50%,#7c2d12)]">
            <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div className="relative h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">Naija Eats</div>
                  <div className="font-display text-sm font-bold">Gold Card</div>
                </div>
                <span className="grid h-8 w-12 place-items-center rounded-md bg-gradient-to-br from-yellow-200 to-amber-500 shadow-inner">
                  <span className="h-4 w-6 rounded-sm bg-black/20" />
                </span>
              </div>
              <div className="font-mono tracking-[0.2em] text-lg tabular-nums">
                {(cardNumber || "•••• •••• •••• ••••").padEnd(19, "•").slice(0, 19)}
              </div>
              <div className="flex items-end justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-white/50">Cardholder</div>
                  <div className="font-semibold uppercase truncate">{cardName || "YOUR NAME"}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/50">Expires</div>
                  <div className="font-semibold tabular-nums">{expiry || "MM/YY"}</div>
                </div>
              </div>
            </div>
          </div>

          <Field label="Card number">
            <Input
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              className="h-12 rounded-2xl font-mono tabular-nums tracking-wider"
            />
          </Field>
          <Field label="Cardholder name">
            <Input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Name on card"
              className="h-12 rounded-2xl"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry">
              <Input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                inputMode="numeric"
                className="h-12 rounded-2xl tabular-nums"
              />
            </Field>
            <Field label="CVV">
              <Input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                inputMode="numeric"
                type="password"
                className="h-12 rounded-2xl tabular-nums"
              />
            </Field>
          </div>
        </div>
      )}

      {method === "bank" && (
        <div className="mt-5 rounded-3xl bg-white border border-zinc-200 p-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Transfer to</div>
          <div className="mt-3 space-y-3">
            <BankRow label="Bank" value="Naija Eats · Providus" />
            <BankRow label="Account number" value="9101 2345 67" copy />
            <BankRow label="Account name" value="Naija Eats Wallet" />
            <BankRow label="Amount" value={fmt(amount)} />
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            Wallet auto-credits within 30 seconds of your transfer landing. Reference not needed.
          </div>
        </div>
      )}

      {method === "ussd" && (
        <div className="mt-5 rounded-3xl bg-white border border-zinc-200 p-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Dial from your phone</div>
          <div className="mt-3 rounded-2xl bg-zinc-900 text-white p-5 font-mono text-2xl text-center tracking-widest tabular-nums">
            *737*50*{amount}#
          </div>
          <ol className="mt-4 space-y-2 text-sm text-zinc-600 list-decimal list-inside">
            <li>Dial the code above from your registered phone.</li>
            <li>Enter your 4-digit PIN.</li>
            <li>Wallet credits in under 20 seconds.</li>
          </ol>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function BankRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>
        <div className="text-sm font-bold text-zinc-900 mt-0.5">{value}</div>
      </div>
      {copy && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(value.replace(/\s/g, ""));
            toast.success("Copied");
          }}
          className="rounded-full bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold hover:bg-zinc-100 transition"
        >
          Copy
        </button>
      )}
    </div>
  );
}

function SuccessStep({ amount, bonus, total, balance }: { amount: number; bonus: number; total: number; balance: number }) {
  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-100 p-7 text-center">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />

        <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />
        </div>

        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-extrabold">Top-up successful</div>
          <div className="font-display text-4xl font-bold text-zinc-900 mt-2 tabular-nums">
            {fmt(total)}
          </div>
          {bonus > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
              <PiConfettiDuotone className="h-3.5 w-3.5" /> Includes {fmt(bonus)} bonus
            </div>
          )}
          <p className="text-sm text-zinc-500 mt-3">Your wallet is ready to spend.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white border border-zinc-200 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">New balance</div>
          <div className="font-display text-xl font-bold tabular-nums mt-0.5">{fmt(balance)}</div>
        </div>
        <PiWalletDuotone className="h-10 w-10 text-[var(--brand-clay)]" />
      </div>

      <div className="mt-6 space-y-2">
        <Link
          to="/wallet"
          className="w-full h-13 flex items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition py-3.5"
        >
          Back to wallet
        </Link>
        <Link
          to="/wallet/send"
          className="w-full h-13 flex items-center justify-center gap-2 rounded-2xl bg-white border border-zinc-200 text-zinc-900 font-bold hover:bg-zinc-50 transition py-3.5"
        >
          <Plus className="h-4 w-4" /> Send money
        </Link>
      </div>
    </div>
  );
}
