import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/naija/AppShell";
import { useMyRole } from "@/hooks/useMyRole";
import { toast } from "sonner";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Rocket,
} from "lucide-react";
import {
  PiStorefrontDuotone,
  PiHeadsetDuotone,
  PiMegaphoneDuotone,
  PiChartLineUpDuotone,
  PiCurrencyNgnDuotone,
  PiCurrencyGbpDuotone,
  PiCreditCardDuotone,
  PiBankDuotone,
  PiSealCheckDuotone,
  PiUsersThreeDuotone,
  PiTruckDuotone,
  PiClockDuotone,
} from "react-icons/pi";

export const Route = createFileRoute("/_authenticated/vendor/subscription")({
  component: SubscriptionPage,
});

type Region = "NG" | "UK";
type Billing = "monthly" | "yearly";
type PlanKey = "basic" | "premium" | "pro";

type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  price: Record<Region, { monthly: number; yearly: number }>;
  shopLimit: number | "unlimited";
  commission: string;
  highlights: string[];
  featured?: boolean;
  gradient: string;
  chipTone: string;
};

const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    tagline: "Start selling — no monthly cost",
    Icon: Zap,
    price: {
      NG: { monthly: 0, yearly: 0 },
      UK: { monthly: 0, yearly: 0 },
    },
    shopLimit: 1,
    commission: "12% per order",
    highlights: [
      "1 storefront",
      "Standard checkout & payouts",
      "Email support (48 hr SLA)",
      "Basic sales report",
      "Wallet payouts weekly",
    ],
    gradient: "from-zinc-50 to-white",
    chipTone: "bg-zinc-100 text-zinc-700",
  },
  {
    key: "premium",
    name: "Premium",
    tagline: "Grow with lower fees & more reach",
    Icon: Crown,
    featured: true,
    price: {
      NG: { monthly: 15000, yearly: 144000 },
      UK: { monthly: 39, yearly: 374 },
    },
    shopLimit: 5,
    commission: "8% per order",
    highlights: [
      "Up to 5 storefronts",
      "Priority listing on Discover",
      "Chat support (12 hr SLA)",
      "Custom promo codes & offers",
      "Advanced sales & customer insights",
      "Daily payouts + wallet top-up",
      "Menu & pricing bulk tools",
    ],
    gradient: "from-[oklch(0.98_0.02_25)] to-white",
    chipTone: "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]",
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "For chains & multi-location brands",
    Icon: Rocket,
    price: {
      NG: { monthly: 45000, yearly: 432000 },
      UK: { monthly: 119, yearly: 1142 },
    },
    shopLimit: "unlimited",
    commission: "5% per order",
    highlights: [
      "Unlimited storefronts",
      "Featured placement on Home",
      "Dedicated account manager",
      "24/7 phone & chat support",
      "Custom marketing campaigns",
      "White-label web ordering",
      "API & POS integrations",
      "SLA-backed rider priority",
      "Instant payouts",
    ],
    gradient: "from-purple-50 to-white",
    chipTone: "bg-purple-100 text-purple-700",
  },
];

const REGIONS: {
  id: Region;
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
        <clipPath id="sub-uk-a">
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id="sub-uk-b">
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <g clipPath="url(#sub-uk-a)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#sub-uk-b)" stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </g>
      </svg>
    ),
  },
];

type FeatureRow = {
  label: string;
  values: Record<PlanKey, string | boolean>;
};

const FEATURE_TABLE: { section: string; Icon: React.ComponentType<{ className?: string }>; rows: FeatureRow[] }[] = [
  {
    section: "Selling & storefronts",
    Icon: PiStorefrontDuotone,
    rows: [
      { label: "Storefronts", values: { basic: "1", premium: "Up to 5", pro: "Unlimited" } },
      { label: "Featured on Discover", values: { basic: false, premium: "Priority", pro: "Homepage" } },
      { label: "Custom domain / white-label", values: { basic: false, premium: false, pro: true } },
      { label: "Menu bulk tools", values: { basic: false, premium: true, pro: true } },
      { label: "POS & API integrations", values: { basic: false, premium: false, pro: true } },
    ],
  },
  {
    section: "Fees & payouts",
    Icon: PiChartLineUpDuotone,
    rows: [
      { label: "Platform commission", values: { basic: "12%", premium: "8%", pro: "5%" } },
      { label: "Payout speed", values: { basic: "Weekly", premium: "Daily", pro: "Instant" } },
      { label: "Wallet payouts", values: { basic: true, premium: true, pro: true } },
      { label: "Custom pricing plans", values: { basic: false, premium: false, pro: true } },
    ],
  },
  {
    section: "Marketing & growth",
    Icon: PiMegaphoneDuotone,
    rows: [
      { label: "Promo codes & offers", values: { basic: false, premium: true, pro: true } },
      { label: "Push notifications to fans", values: { basic: false, premium: true, pro: true } },
      { label: "Managed marketing campaigns", values: { basic: false, premium: false, pro: true } },
      { label: "Customer insights & CRM", values: { basic: "Basic", premium: "Advanced", pro: "Enterprise" } },
    ],
  },
  {
    section: "Support",
    Icon: PiHeadsetDuotone,
    rows: [
      { label: "Support channels", values: { basic: "Email", premium: "Email + Chat", pro: "Phone + Chat + Email" } },
      { label: "Response SLA", values: { basic: "48 hours", premium: "12 hours", pro: "1 hour" } },
      { label: "Dedicated account manager", values: { basic: false, premium: false, pro: true } },
    ],
  },
];

const FAQ = [
  {
    q: "Can I switch or cancel anytime?",
    a: "Yes. Upgrade, downgrade, or cancel from this page. Changes take effect at the end of your current billing cycle; you keep premium access until then.",
  },
  {
    q: "How does yearly billing save me money?",
    a: "Pay upfront for 12 months and get roughly 2 months free — a 20% discount vs. paying monthly. Yearly plans are eligible for split-payment via Paystack in Nigeria.",
  },
  {
    q: "Do commission rates apply on top of my subscription?",
    a: "Yes — the subscription fee covers platform features, while commission is charged per completed order. Higher tiers get significantly lower commission.",
  },
  {
    q: "What payment methods do you accept?",
    a: "In Nigeria: card, bank transfer via Paystack, and USSD. In the UK: card, Apple Pay, Google Pay and Direct Debit via Stripe.",
  },
  {
    q: "Is there a free trial for Premium or Pro?",
    a: "New vendors get a 14-day free trial on Premium. Pro trials are available on request via your account manager.",
  },
];

function detectRegion(): Region {
  if (typeof window === "undefined") return "NG";
  const stored = localStorage.getItem("naija-billing-region") as Region | null;
  if (stored === "NG" || stored === "UK") return stored;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (/London|Europe/i.test(tz)) return "UK";
  return "NG";
}

function SubscriptionPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [region, setRegion] = useState<Region>(detectRegion());
  const [billing, setBilling] = useState<Billing>("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [confirmPlan, setConfirmPlan] = useState<PlanKey | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("naija-billing-region", region);
  }, [region]);

  const { data: profile } = useQuery({
    queryKey: ["sub-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      return { uid, plan: ((p as any)?.vendor_plan ?? "basic") as PlanKey };
    },
  });

  const currentPlan = profile?.plan ?? "basic";
  const regionMeta = REGIONS.find((r) => r.id === region)!;

  const upgrade = useMutation({
    mutationFn: async (plan: PlanKey) => {
      if (!profile?.uid) throw new Error("Not signed in");
      // Wallet_plan may not yet exist on the profiles type — cast for now.
      const { error } = await supabase
        .from("profiles")
        .update({ vendor_plan: plan } as any)
        .eq("id", profile.uid);
      if (error) throw error;
      return plan;
    },
    onSuccess: (plan) => {
      toast.success(plan === "basic" ? "Switched to Basic plan" : `Welcome to ${plan[0].toUpperCase() + plan.slice(1)}!`);
      qc.invalidateQueries();
      setConfirmPlan(null);
      navigate({ to: "/vendor/shops" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Something went wrong"),
  });

  if (!roleLoading && role !== "vendor") return <Navigate to="/" replace />;

  const yearlyDiscount = useMemo(() => {
    // Show the % you save switching monthly → yearly on Premium
    const p = PLANS.find((p) => p.key === "premium")!;
    const monthlyTotal = p.price[region].monthly * 12;
    const yearlyTotal = p.price[region].yearly;
    if (monthlyTotal === 0) return 0;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  }, [region]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a0e0a] via-[#3a1a14] to-[#7c2d12] p-6 sm:p-10 text-white">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--brand-gold)]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[var(--brand-clay)]/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> Vendor plans
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mt-3 leading-[1.05]">
                Choose the plan<br />that grows with you.
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-3 max-w-md leading-relaxed">
                Start free, upgrade as you scale. Prices shown in{" "}
                <span className="font-bold text-white">
                  {regionMeta.name} ({regionMeta.currency})
                </span>
                . Switch region below.
              </p>

              {/* Current plan chip */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Your current plan:
                <span className="font-bold uppercase tracking-wider">{currentPlan}</span>
              </div>
            </div>

            {/* Region + billing toggles */}
            <div className="flex flex-col items-end gap-3">
              <RegionSwitcher region={region} onChange={setRegion} />
              <BillingToggle billing={billing} onChange={setBilling} yearlyDiscount={yearlyDiscount} />
            </div>
          </div>
        </div>

        {/* Plans grid */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              region={region}
              billing={billing}
              currency={regionMeta.code}
              isCurrent={currentPlan === plan.key}
              onSelect={() => setConfirmPlan(plan.key)}
            />
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-6 rounded-3xl bg-card border border-border p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrustItem Icon={ShieldCheck} label="PCI-DSS secured" sub="Paystack + Stripe" />
            <TrustItem Icon={PiClockDuotone} label="Cancel anytime" sub="No lock-in" />
            <TrustItem Icon={PiSealCheckDuotone} label="14-day free trial" sub="Premium only" />
            <TrustItem Icon={PiUsersThreeDuotone} label="Trusted by 800+ vendors" sub="Across NG & UK" />
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">Compare</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">Every feature, side by side</h2>
            </div>
          </div>
          <div className="mt-5 rounded-3xl bg-card border border-border overflow-x-auto">
            {/* Header */}
            <div className="min-w-[560px] grid grid-cols-[minmax(180px,1.6fr)_repeat(3,1fr)] bg-muted/40 border-b border-border">
              <div className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Feature</div>
              {PLANS.map((p) => (
                <div key={p.key} className="p-4 text-center border-l border-border">
                  <div className={`inline-flex items-center gap-1.5 rounded-full ${p.chipTone} px-2.5 py-1 text-[11px] font-bold uppercase`}>
                    <p.Icon className="h-3.5 w-3.5" />
                    {p.name}
                  </div>
                </div>
              ))}
            </div>

            {FEATURE_TABLE.map((section) => (
              <div key={section.section}>
                <div className="min-w-[560px] grid grid-cols-[minmax(180px,1.6fr)_repeat(3,1fr)] bg-muted/20 border-t border-border">
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
                    className={`min-w-[560px] grid grid-cols-[minmax(180px,1.6fr)_repeat(3,1fr)] ${
                      i === section.rows.length - 1 ? "" : "border-b border-border"
                    }`}
                  >
                    <div className="p-4 text-sm">{row.label}</div>
                    {(["basic", "premium", "pro"] as PlanKey[]).map((k) => (
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
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold text-center">Accepted payments</div>
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
            Everything you need to know
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

        {/* Enterprise CTA */}
        <div className="mt-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <PiTruckDuotone className="h-3.5 w-3.5" /> Enterprise
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-2">
                Running 25+ shops or a franchise?
              </h3>
              <p className="text-white/80 text-sm mt-1 max-w-md">
                Talk to us about custom pricing, integrations, and dedicated infrastructure.
              </p>
            </div>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 rounded-full bg-white text-purple-700 px-5 py-2.5 text-sm font-bold shadow-xl hover:scale-105 transition"
            >
              Contact sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmPlan && (
        <ConfirmSheet
          plan={PLANS.find((p) => p.key === confirmPlan)!}
          region={region}
          billing={billing}
          currency={regionMeta.code}
          isDowngrade={rank(confirmPlan) < rank(currentPlan)}
          isSame={confirmPlan === currentPlan}
          onClose={() => setConfirmPlan(null)}
          onConfirm={() => upgrade.mutate(confirmPlan)}
          loading={upgrade.isPending}
        />
      )}
    </AppShell>
  );
}

/* ────────────── sub-components ────────────── */

function rank(key: PlanKey): number {
  return key === "basic" ? 0 : key === "premium" ? 1 : 2;
}

function RegionSwitcher({ region, onChange }: { region: Region; onChange: (r: Region) => void }) {
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
  billing: Billing;
  onChange: (b: Billing) => void;
  yearlyDiscount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur p-1 border border-white/15">
      {(["monthly", "yearly"] as Billing[]).map((b) => {
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
  region: Region;
  billing: Billing;
  currency: string;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const price = plan.price[region][billing];
  const monthlyEquivalent = billing === "yearly" ? Math.round(price / 12) : price;
  const featured = plan.featured;
  const isFree = price === 0;

  return (
    <div
      className={`relative rounded-[2rem] p-6 sm:p-7 transition-all duration-300 flex flex-col ${
        featured
          ? "bg-gradient-to-br from-white via-white to-[oklch(0.98_0.02_25)] border-2 border-[var(--brand-clay)] shadow-[0_24px_60px_-24px_rgba(217,75,58,0.35)] scale-[1.02]"
          : `bg-gradient-to-br ${plan.gradient} border border-border`
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[var(--brand-clay)]/30 whitespace-nowrap">
          <Sparkles className="h-3 w-3" /> Most popular
        </span>
      )}

      {/* Head */}
      <div className="flex items-center gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl shrink-0 ${
            plan.key === "pro"
              ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : plan.key === "premium"
                ? "bg-gradient-to-br from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/30"
                : "bg-zinc-100 text-zinc-700"
          }`}
        >
          <plan.Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display text-xl font-bold">{plan.name}</div>
          <div className="text-xs text-muted-foreground">{plan.tagline}</div>
        </div>
      </div>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-bold tabular-nums tracking-tight">
            {isFree ? "Free" : `${currency}${monthlyEquivalent.toLocaleString()}`}
          </span>
          {!isFree && <span className="text-sm text-muted-foreground font-medium">/ mo</span>}
        </div>
        {billing === "yearly" && !isFree && (
          <div className="text-xs text-muted-foreground mt-1">
            Billed yearly · {currency}
            {price.toLocaleString()}
          </div>
        )}
        {isFree && <div className="text-xs text-muted-foreground mt-1">No monthly fee, ever</div>}
      </div>

      {/* Key badges */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${plan.chipTone}`}>
          <PiStorefrontDuotone className="h-3.5 w-3.5" />
          {plan.shopLimit === "unlimited" ? "Unlimited shops" : `${plan.shopLimit} shop${plan.shopLimit === 1 ? "" : "s"}`}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${plan.chipTone}`}>
          <PiChartLineUpDuotone className="h-3.5 w-3.5" />
          {plan.commission}
        </span>
      </div>

      {/* Features */}
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

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={`mt-6 w-full h-12 rounded-2xl inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
          isCurrent
            ? "bg-zinc-100 text-zinc-500 cursor-default"
            : featured
              ? "bg-gradient-to-r from-[var(--brand-clay)] to-orange-500 text-white shadow-lg shadow-[var(--brand-clay)]/30 hover:shadow-xl active:scale-[0.99]"
              : plan.key === "pro"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl active:scale-[0.99]"
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
            {plan.key === "premium" ? "Start 14-day trial" : `Upgrade to ${plan.name}`}
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
  isDowngrade,
  isSame,
  onClose,
  onConfirm,
  loading,
}: {
  plan: Plan;
  region: Region;
  billing: Billing;
  currency: string;
  isDowngrade: boolean;
  isSame: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const price = plan.price[region][billing];
  const isFree = price === 0;
  const isNG = region === "NG";
  const CurrencyIcon = isNG ? PiCurrencyNgnDuotone : PiCurrencyGbpDuotone;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">
              {isSame ? "You're already on this plan" : isDowngrade ? "Confirm downgrade" : "Confirm upgrade"}
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-bold">{plan.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Billing</span>
            <span className="text-sm font-bold capitalize">{billing}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Region</span>
            <span className="text-sm font-bold">{region === "NG" ? "Nigeria" : "United Kingdom"}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You'll pay</span>
            <span className="font-display text-2xl font-bold tabular-nums inline-flex items-center gap-1">
              <CurrencyIcon className="h-5 w-5 text-[var(--brand-clay)]" />
              {isFree ? "0" : `${currency}${price.toLocaleString()}`}
              {!isFree && <span className="text-xs font-semibold text-muted-foreground ml-1">/ {billing === "yearly" ? "yr" : "mo"}</span>}
            </span>
          </div>
        </div>

        {!isFree && !isDowngrade && !isSame && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <PiSealCheckDuotone className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You're starting a <strong>14-day free trial</strong>. Cancel anytime before it ends and you won't be charged.
            </span>
          </div>
        )}

        {isDowngrade && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Downgrades take effect at the end of your current billing period. You'll keep your current features until then.
            </span>
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
            "Confirm & subscribe"
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          By continuing you agree to our <Link to="/help" className="underline">Terms of Service</Link> and{" "}
          <Link to="/help" className="underline">Refund Policy</Link>.
        </p>
      </div>
    </div>
  );
}
