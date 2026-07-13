import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CustomerShell } from "@/components/naija/CustomerShell";
import {
  ChevronLeft,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
} from "lucide-react";
import {
  PiTruckDuotone,
  PiPercentDuotone,
  PiHeadsetDuotone,
  PiCurrencyNgnDuotone,
  PiCurrencyGbpDuotone,
  PiSealCheckDuotone,
  PiCreditCardDuotone,
  PiBankDuotone,
  PiConfettiDuotone,
  PiCookingPotDuotone,
  PiGiftDuotone,
  PiCrownDuotone,
  PiForkKnifeDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import {
  loadCustomerPlan,
  setCustomerPlan,
  detectRegion,
  PLAN_EVENT,
  type CustomerPlan,
  type BillingRegion,
  type BillingCadence,
} from "@/lib/premium";

export const Route = createFileRoute("/_authenticated/subscription")({
  component: SubscriptionPage,
});

type Plan = {
  key: CustomerPlan;
  name: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  price: Record<BillingRegion, { monthly: number; yearly: number }>;
  highlights: string[];
  perks: { Icon: React.ComponentType<{ className?: string }>; label: string }[];
  featured?: boolean;
  chipTone: string;
  gradient: string;
};

const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    tagline: "Order when you like — no strings attached",
    Icon: Zap,
    price: { NG: { monthly: 0, yearly: 0 }, UK: { monthly: 0, yearly: 0 } },
    perks: [
      { Icon: PiForkKnifeDuotone, label: "Order from any chef or store" },
      { Icon: PiTruckDuotone, label: "Standard delivery" },
      { Icon: PiHeadsetDuotone, label: "Email support" },
    ],
    highlights: [
      "Unlimited ordering",
      "Standard delivery fees",
      "1% cashback on orders",
      "Email support (48 hr)",
    ],
    chipTone: "bg-zinc-100 text-zinc-700",
    gradient: "from-zinc-50 to-white",
  },
  {
    key: "naija_one",
    name: "Naija One",
    tagline: "The premium experience on NaijaEats",
    Icon: PiCrownDuotone,
    featured: true,
    price: {
      NG: { monthly: 5000, yearly: 48000 },
      UK: { monthly: 9.99, yearly: 95.88 },
    },
    perks: [
      { Icon: PiTruckDuotone, label: "Unlimited free delivery" },
      { Icon: PiPercentDuotone, label: "10% cashback on every order" },
      { Icon: PiConfettiDuotone, label: "VIP invites & Early access" },
    ],
    highlights: [
      "Unlimited free delivery on all orders",
      "10% Naija Eats cashback",
      "Priority kitchen slots",
      "Early access to new chefs",
      "VIP invites to Naija Eats supper clubs",
      "Birthday meal on us 🎂",
      "24/7 Priority support",
    ],
    chipTone: "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]",
    gradient: "from-[oklch(0.98_0.02_25)] to-white",
  },
];

const REGIONS: {
  id: BillingRegion;
  name: string;
  currency: string;
  code: string;
  flag: React.ReactNode;
}[] = [
  {
    id: "NG",
    name: "Nigeria",
    currency: "NGN",
    code: "₦",
    flag: (
      <svg viewBox="0 0 60 30" className="h-full w-full">
        <rect width="60" height="30" fill="#fff" />
        <rect width="20" height="30" fill="#008751" />
        <rect x="40" width="20" height="30" fill="#008751" />
      </svg>
    ),
  },
  {
    id: "UK",
    name: "United Kingdom",
    currency: "GBP",
    code: "£",
    flag: (
      <svg viewBox="0 0 60 30" className="h-full w-full">
        <clipPath id="cust-uk-a">
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id="cust-uk-b">
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <g clipPath="url(#cust-uk-a)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#cust-uk-b)" stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </g>
      </svg>
    ),
  },
];

const COMPARISON: {
  section: string;
  Icon: React.ComponentType<{ className?: string }>;
  rows: { label: string; values: Partial<Record<CustomerPlan, string | boolean>> }[];
}[] = [
  {
    section: "Delivery",
    Icon: PiTruckDuotone,
    rows: [
      { label: "Delivery fee", values: { basic: "Standard", naija_one: "Always free" } },
      { label: "Priority pickup slots", values: { basic: false, naija_one: true } },
      { label: "Live rider tracking", values: { basic: true, naija_one: true } },
    ],
  },
  {
    section: "Rewards",
    Icon: PiGiftDuotone,
    rows: [
      { label: "Cashback per order", values: { basic: "1%", naija_one: "10%" } },
      { label: "Wallet & top-up fees", values: { basic: "Standard", naija_one: "Waived" } },
      { label: "Birthday meal", values: { basic: false, naija_one: true } },
    ],
  },
  {
    section: "Experiences",
    Icon: PiConfettiDuotone,
    rows: [
      { label: "Early access to new chefs", values: { basic: false, naija_one: true } },
      { label: "VIP supper club invites", values: { basic: false, naija_one: true } },
    ],
  },
  {
    section: "Support",
    Icon: PiHeadsetDuotone,
    rows: [
      { label: "Support channels", values: { basic: "Email", naija_one: "24/7 Priority" } },
      { label: "Response SLA", values: { basic: "48 hours", naija_one: "1 hour" } },
    ],
  },
];

const FAQ = [
  {
    q: "Can I cancel Naija One anytime?",
    a: "Yes. Cancel from this page and you'll keep your premium benefits until the end of your billing period.",
  },
  {
    q: "How does yearly billing save me money?",
    a: "You pay upfront for 12 months and get roughly 2 months free — about 20% off compared to monthly.",
  },
  {
    q: "When do I earn cashback?",
    a: "Cashback is credited to your Naija Eats wallet within 24 hours of a delivered order. It stacks with promo codes.",
  },
  {
    q: "Do I get free delivery even if my order is small?",
    a: "Naija One members get free delivery on every order regardless of size.",
  },
  {
    q: "What payment methods are accepted?",
    a: "In Nigeria: card, bank transfer via Paystack, USSD and wallet. In the UK: card, Apple Pay, Google Pay and Direct Debit via Stripe.",
  },
];

function rank(k: CustomerPlan) {
  return k === "basic" ? 0 : 1;
}

function SubscriptionPage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState<BillingRegion>(detectRegion());
  const [billing, setBilling] = useState<BillingCadence>("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [current, setCurrent] = useState<CustomerPlan>(() => loadCustomerPlan());
  const [confirmPlan, setConfirmPlan] = useState<CustomerPlan | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const refresh = () => setCurrent(loadCustomerPlan());
    window.addEventListener(PLAN_EVENT, refresh);
    return () => window.removeEventListener(PLAN_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("naija-billing-region", region);
  }, [region]);

  const regionMeta = REGIONS.find((r) => r.id === region)!;

  const yearlyDiscount = useMemo(() => {
    const p = PLANS.find((p) => p.key === "naija_one")!;
    const m = p.price[region].monthly * 12;
    const y = p.price[region].yearly;
    if (m === 0) return 0;
    return Math.round(((m - y) / m) * 100);
  }, [region]);

  const confirmChoice = async (plan: CustomerPlan) => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    setCustomerPlan(plan);
    setProcessing(false);
    setConfirmPlan(null);
    toast.success(plan === "basic" ? "Switched to Basic" : `Welcome to ${PLANS.find((p) => p.key === plan)?.name}!`);
    if (plan !== "basic") navigate({ to: "/discover" });
  };

  return (
    <CustomerShell
      showBack
      backTo="/account"
      hideBottomNav
      topBar={
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">Premium</div>
            <div className="text-sm font-bold truncate text-zinc-900">Naija Eats memberships</div>
          </div>
        </div>
      }
    >
      <div className="py-3 sm:py-6 pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-8 text-white bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)] shadow-[var(--shadow-warm)]">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3 text-[var(--brand-gold)]" /> Naija Eats premium
              </div>
              <h1 className="font-display text-2xl sm:text-5xl font-bold tracking-tight mt-2 leading-[1.05]">
                Free delivery.<br />5–10% cashback.<br />Chef VIP access.
              </h1>
              <p className="text-white/80 text-xs sm:text-base mt-2 sm:mt-3 leading-relaxed">
                Prices in{" "}
                <span className="font-bold text-white">
                  {regionMeta.name} ({regionMeta.currency})
                </span>
                . Switch region below.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-2.5 py-1 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Your plan: <span className="font-bold uppercase tracking-wider">{current === "basic" ? "Basic" : PLANS.find((p) => p.key === current)?.name}</span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col sm:items-end flex-wrap gap-2 sm:gap-3">
              <RegionSwitcher region={region} onChange={setRegion} />
              <BillingToggle billing={billing} onChange={setBilling} yearlyDiscount={yearlyDiscount} />
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              region={region}
              billing={billing}
              currency={regionMeta.code}
              isCurrent={current === plan.key}
              onSelect={() => setConfirmPlan(plan.key)}
            />
          ))}
        </div>

        {/* Trust */}
        <div className="mt-6 rounded-3xl bg-card border border-border p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrustItem Icon={ShieldCheck} label="Secure payments" sub="Paystack & Stripe" />
            <TrustItem Icon={PiSealCheckDuotone} label="7-day free trial" sub="Naija One" />
            <TrustItem Icon={PiConfettiDuotone} label="Cancel anytime" sub="No lock-in" />
            <TrustItem Icon={PiCookingPotDuotone} label="800+ chefs & stores" sub="NG & UK" />
          </div>
        </div>

        {/* Compare */}
        <div className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">Compare</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Every perk, side by side
          </h2>
          <div className="mt-5 rounded-3xl bg-card border border-border overflow-x-auto">
            <div className="min-w-[520px] grid grid-cols-[minmax(150px,1.4fr)_repeat(3,1fr)] bg-muted/40 border-b border-border">
              <div className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Feature</div>
              {PLANS.map((p) => (
                <div key={p.key} className="p-4 text-center border-l border-border">
                  <div className={`inline-flex items-center gap-1.5 rounded-full ${p.chipTone} px-2.5 py-1 text-[11px] font-bold uppercase`}>
                    <p.Icon className="h-3.5 w-3.5" />
                    {p.key === "basic" ? "Basic" : "Naija One"}
                  </div>
                </div>
              ))}
            </div>

            {COMPARISON.map((section) => (
              <div key={section.section}>
                <div className="min-w-[520px] grid grid-cols-[minmax(150px,1.4fr)_repeat(2,1fr)] bg-muted/20 border-t border-border">
                  <div className="p-3 flex items-center gap-2 col-span-full">
                    <section.Icon className="h-4 w-4 text-[var(--brand-clay)]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {section.section}
                    </span>
                  </div>
                </div>
                {section.rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`min-w-[520px] grid grid-cols-[minmax(150px,1.4fr)_repeat(2,1fr)] ${
                      i === section.rows.length - 1 ? "" : "border-b border-border"
                    }`}
                  >
                    <div className="p-4 text-sm">{row.label}</div>
                    {(["basic", "naija_one"] as CustomerPlan[]).map((k) => (
                      <div key={k} className="p-4 text-center border-l border-border text-sm">
                        {typeof row.values[k] === "boolean" ? (
                          row.values[k] ? (
                            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )
                        ) : (
                          <span className="font-semibold">{row.values[k]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold text-center">
            Accepted payments in {regionMeta.name}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {region === "NG" ? (
              <>
                <PayChip label="Paystack" />
                <PayChip label="Card" Icon={PiCreditCardDuotone} />
                <PayChip label="Bank transfer" Icon={PiBankDuotone} />
                <PayChip label="USSD" />
                <PayChip label="Wallet" />
              </>
            ) : (
              <>
                <PayChip label="Stripe" />
                <PayChip label="Card" Icon={PiCreditCardDuotone} />
                <PayChip label="Apple Pay" />
                <PayChip label="Google Pay" />
                <PayChip label="Direct Debit" Icon={PiBankDuotone} />
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">FAQ</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Frequently asked
          </h2>
          <div className="mt-5 rounded-3xl bg-card border border-border divide-y divide-border overflow-hidden">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition"
                  >
                    <span className="font-semibold text-sm sm:text-base">{item.q}</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-foreground/70">
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 duration-150">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {confirmPlan && (
        <ConfirmSheet
          plan={PLANS.find((p) => p.key === confirmPlan)!}
          region={region}
          billing={billing}
          currency={regionMeta.code}
          isSame={confirmPlan === current}
          isDowngrade={rank(confirmPlan) < rank(current)}
          loading={processing}
          onClose={() => !processing && setConfirmPlan(null)}
          onConfirm={() => confirmChoice(confirmPlan)}
        />
      )}
    </CustomerShell>
  );
}

/* ────────────── sub-components ────────────── */

function RegionSwitcher({ region, onChange }: { region: BillingRegion; onChange: (r: BillingRegion) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur p-1 border border-white/15">
      {REGIONS.map((r) => {
        const active = r.id === region;
        return (
          <button
            key={r.id}
            onClick={() => onChange(r.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              active ? "bg-white text-zinc-900 shadow-lg" : "text-white/85 hover:text-white"
            }`}
          >
            <span className="h-4 w-6 rounded-sm overflow-hidden ring-1 ring-black/20 shrink-0">{r.flag}</span>
            {r.name}
          </button>
        );
      })}
    </div>
  );
}

function BillingToggle({
  billing,
  onChange,
  yearlyDiscount,
}: {
  billing: BillingCadence;
  onChange: (b: BillingCadence) => void;
  yearlyDiscount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur p-1 border border-white/15">
      {(["monthly", "yearly"] as BillingCadence[]).map((b) => {
        const active = b === billing;
        return (
          <button
            key={b}
            onClick={() => onChange(b)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
              active ? "bg-white text-zinc-900 shadow-lg" : "text-white/85 hover:text-white"
            }`}
          >
            {b}
            {b === "yearly" && yearlyDiscount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                active ? "bg-emerald-100 text-emerald-700" : "bg-[var(--brand-gold)] text-zinc-900"
              }`}>
                Save {yearlyDiscount}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  region,
  billing,
  currency,
  isCurrent,
  onSelect,
}: {
  plan: Plan;
  region: BillingRegion;
  billing: BillingCadence;
  currency: string;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const price = plan.price[region][billing];
  const monthlyEq = billing === "yearly" && price > 0
    ? region === "UK" ? (price / 12).toFixed(2) : Math.round(price / 12).toLocaleString()
    : region === "UK" ? price.toFixed(2) : price.toLocaleString();
  const isFree = price === 0;
  const featured = plan.featured;

  return (
    <div
      className={`relative rounded-3xl p-5 sm:p-7 transition-all duration-300 flex flex-col ${
        featured
          ? "bg-gradient-to-br from-white via-white to-[oklch(0.98_0.02_25)] border-2 border-[var(--brand-clay)] shadow-[0_24px_60px_-24px_rgba(217,75,58,0.35)] lg:scale-[1.02]"
          : `bg-gradient-to-br ${plan.gradient} border border-border`
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[var(--brand-clay)]/30 whitespace-nowrap">
          <Sparkles className="h-3 w-3" /> Most popular
        </span>
      )}

      <div className="flex items-center gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl shrink-0 ${
            plan.key === "naija_one"
              ? "bg-gradient-to-br from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/30"
              : "bg-zinc-100 text-zinc-700"
          }`}
        >
          <plan.Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="font-display text-xl font-bold truncate">{plan.name}</div>
          <div className="text-xs text-muted-foreground truncate">{plan.tagline}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-bold tabular-nums tracking-tight">
            {isFree ? "Free" : `${currency}${monthlyEq}`}
          </span>
          {!isFree && <span className="text-sm text-muted-foreground font-medium">/ mo</span>}
        </div>
        {billing === "yearly" && !isFree && (
          <div className="text-xs text-muted-foreground mt-1">
            Billed yearly · {currency}{region === "UK" ? price.toFixed(2) : price.toLocaleString()}
          </div>
        )}
        {isFree && <div className="text-xs text-muted-foreground mt-1">No membership fee, ever</div>}
      </div>

      {/* Perk chips */}
      <div className="mt-4 space-y-1.5">
        {plan.perks.map((p) => (
          <div key={p.label} className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${plan.chipTone} mr-1`}>
            <p.Icon className="h-3.5 w-3.5" />
            {p.label}
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-2.5 flex-1">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-sm">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full mt-0.5 ${
                featured ? "bg-[var(--brand-clay)] text-white" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className="text-foreground/85">{h}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={`mt-6 w-full h-12 rounded-2xl inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
          isCurrent
            ? "bg-zinc-100 text-zinc-500 cursor-default"
            : featured
              ? "bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/30 hover:shadow-xl active:scale-[0.99]"
              : plan.key === "naija_one"
                ? "bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/30 hover:shadow-xl active:scale-[0.99]"
                : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]"
        }`}
      >
        {isCurrent ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} /> Current plan
          </>
        ) : isFree ? (
          <>Switch to Basic <ArrowRight className="h-4 w-4" /></>
        ) : (
          <>
            {plan.key === "naija_one" ? "Start 7-day trial" : `Upgrade to ${plan.name.split(" ").pop()}`}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

function TrustItem({ Icon, label, sub }: { Icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 shrink-0">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}

function PayChip({ label, Icon }: { label: string; Icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 text-xs font-semibold shadow-sm">
      {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      {label}
    </span>
  );
}

function ConfirmSheet({
  plan,
  region,
  billing,
  currency,
  isSame,
  isDowngrade,
  loading,
  onClose,
  onConfirm,
}: {
  plan: Plan;
  region: BillingRegion;
  billing: BillingCadence;
  currency: string;
  isSame: boolean;
  isDowngrade: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const price = plan.price[region][billing];
  const isFree = price === 0;
  const CurrencyIcon = region === "NG" ? PiCurrencyNgnDuotone : PiCurrencyGbpDuotone;
  const priceText = region === "UK" && !isFree ? price.toFixed(2) : price.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">
              {isSame ? "You're already on this plan" : isDowngrade ? "Confirm downgrade" : "Confirm subscription"}
            </div>
            <div className="font-display text-xl font-bold mt-0.5">{plan.name}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
          <Row label="Plan" value={plan.name} />
          <Row label="Billing" value={billing} capitalize />
          <Row label="Region" value={region === "NG" ? "Nigeria" : "United Kingdom"} />
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You'll pay</span>
            <span className="font-display text-2xl font-bold tabular-nums inline-flex items-center gap-1">
              <CurrencyIcon className="h-5 w-5 text-[var(--brand-clay)]" />
              {isFree ? "0" : `${currency}${priceText}`}
              {!isFree && <span className="text-xs font-semibold text-muted-foreground ml-1">/ {billing === "yearly" ? "yr" : "mo"}</span>}
            </span>
          </div>
        </div>

        {!isFree && !isDowngrade && !isSame && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <PiSealCheckDuotone className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You're starting a <strong>7-day free trial</strong>. Cancel any time before it ends and you won't be charged.
            </span>
          </div>
        )}

        {isDowngrade && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Downgrades take effect at the end of your current billing period.</span>
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={loading || isSame}
          className={`mt-5 w-full h-12 rounded-2xl inline-flex items-center justify-center gap-2 text-sm font-bold transition ${
            isSame
              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]"
          }`}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Processing…
            </>
          ) : isSame ? (
            "You're already on this plan"
          ) : isDowngrade ? (
            "Confirm downgrade"
          ) : isFree ? (
            "Switch to Basic"
          ) : (
            "Start trial & subscribe"
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          By continuing you agree to our <Link to="/help" className="underline">Terms</Link> and <Link to="/help" className="underline">Refund Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
