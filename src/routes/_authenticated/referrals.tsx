import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Gift,
  Share2,
  Sparkles,
  Trophy,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { refreshWallet } from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferralsPage,
});

const GOAL = 5;

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type ReferralWithName = ReferralRow & { name: string };

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

function ReferralsPage() {
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");

      const [profileResult, referralsResult, appliedResult] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", auth.user.id).maybeSingle(),
        supabase
          .from("referrals")
          .select(
            "id, referrer_id, referred_id, code, status, reward_amount, created_at, rewarded_at",
          )
          .eq("referrer_id", auth.user.id)
          .order("created_at", { ascending: false }),
        supabase.from("referrals").select("id, code").eq("referred_id", auth.user.id).maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (referralsResult.error) throw referralsResult.error;
      if (appliedResult.error) throw appliedResult.error;

      const rows = referralsResult.data ?? [];
      const referredIds = rows.map((row) => row.referred_id);
      let names = new Map<string, string>();

      if (referredIds.length > 0) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", referredIds);
        if (error) throw error;
        names = new Map(
          (profiles ?? []).map((profile) => [profile.id, profile.full_name || "A friend"]),
        );
      }

      return {
        code: profileResult.data?.referral_code || "...",
        referrals: rows.map(
          (row): ReferralWithName => ({
            ...row,
            name: names.get(row.referred_id) ?? "A friend",
          }),
        ),
        appliedCode: appliedResult.data?.code,
      };
    },
  });

  const applyCode = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc("apply_referral_code", { p_code: code.trim() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Code applied. Your welcome bonus is now in your wallet.");
      setCodeInput("");
      void refreshWallet();
      void queryClient.invalidateQueries({ queryKey: ["my-referrals"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const code = data?.code ?? "...";
  const referrals = useMemo(() => data?.referrals ?? [], [data?.referrals]);
  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : "https://naijaaeats.vercel.app"}/auth?ref=${code}`;

  const stats = useMemo(() => {
    const ordered = referrals.filter((referral) => referral.status === "ordered");
    return {
      joined: referrals.length,
      ordered: ordered.length,
      reward: ordered.reduce((total, referral) => total + Number(referral.reward_amount ?? 0), 0),
    };
  }, [referrals]);

  const progress = Math.min(stats.ordered / GOAL, 1);
  const remaining = Math.max(GOAL - stats.ordered, 0);

  const copy = async (text: string, message = "Copied") => {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const share = async () => {
    const text = `Join me on NaijaEats with code ${code}. Discover authentic meals and receive a welcome reward.`;
    if (navigator.share) {
      await navigator
        .share({ title: "Join NaijaEats", text, url: inviteLink })
        .catch(() => undefined);
      return;
    }
    await copy(`${text} ${inviteLink}`, "Invitation copied");
  };

  return (
    <RoleShell containerClassName="w-full px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          to="/wallet"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-clay)]">
            Referral rewards
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Invite people you love to eat with
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Share your personal code, follow every successful invitation, and receive wallet rewards
            automatically.
          </p>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div className="rounded-lg bg-[#171714] p-5 text-white shadow-[0_24px_70px_-38px_rgba(0,0,0,0.7)] sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2cc72]">
              <Gift className="h-4 w-4" /> Refer and feast
            </div>
            <h2 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Five friends can unlock your next feast.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              When an invited friend completes their first eligible order, the reward is added
              directly to your NaijaEats wallet.
            </p>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                Your referral code
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 font-mono text-xl font-semibold tracking-[0.18em] sm:text-2xl">
                  {isLoading ? "Loading" : code}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => void copy(code, "Referral code copied")}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold transition hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e9b949] px-4 text-sm font-semibold text-[#201806] transition hover:bg-[#f2cc72]"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Current goal
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">Your feast progress</h2>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <Trophy className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-7 flex items-end justify-between">
              <div className="font-display text-5xl font-semibold tabular-nums">
                {stats.ordered}
                <span className="text-2xl text-muted-foreground">/{GOAL}</span>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {remaining === 0 ? "Goal reached" : `${remaining} more to go`}
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--brand-clay)] transition-all duration-700"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="mt-8 divide-y divide-border border-y border-border">
              <ProgressMetric label="Friends joined" value={String(stats.joined)} />
              <ProgressMetric label="Completed first order" value={String(stats.ordered)} />
              <ProgressMetric label="Wallet rewards" value={fmt(stats.reward)} accent />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Your invitations
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  See who joined and when each reward becomes available.
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                {referrals.length} total
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
              {isLoading ? (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                  Loading invitations...
                </div>
              ) : referrals.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-amber-50 text-amber-700">
                    <Gift className="h-6 w-6" />
                  </span>
                  <div className="mt-4 font-semibold">No invitations yet</div>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Share your referral code. New members will appear here after they use it.
                  </p>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                  >
                    <Share2 className="h-4 w-4" /> Share invitation
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {referrals.map((referral) => (
                    <ReferralRow key={referral.id} referral={referral} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            {!isLoading && !data?.appliedCode && (
              <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Have a referral code?</h3>
                    <p className="text-xs text-muted-foreground">
                      Apply it once to claim your welcome reward.
                    </p>
                  </div>
                </div>
                <form
                  className="mt-5 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (codeInput.trim()) applyCode.mutate(codeInput);
                  }}
                >
                  <Input
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                    placeholder="Referral code"
                    className="h-11 rounded-lg font-mono tracking-wider"
                  />
                  <Button
                    type="submit"
                    disabled={applyCode.isPending || !codeInput.trim()}
                    className="h-11 rounded-lg px-5"
                  >
                    {applyCode.isPending ? "Applying..." : "Apply"}
                  </Button>
                </form>
              </div>
            )}

            {data?.appliedCode && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-700/20 bg-emerald-50 p-5 text-sm text-emerald-900">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <div className="font-semibold">Welcome reward applied</div>
                  <div className="mt-1 text-emerald-800/80">
                    You joined with{" "}
                    <span className="font-mono font-semibold">{data.appliedCode}</span>.
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
              <h3 className="font-display text-xl font-semibold">How it works</h3>
              <div className="mt-5 space-y-5">
                <HowStep
                  number="01"
                  Icon={Share2}
                  title="Share your code"
                  body="Send your invitation link through WhatsApp or any messaging app."
                />
                <HowStep
                  number="02"
                  Icon={UtensilsCrossed}
                  title="They join and order"
                  body="Your friend signs up and completes their first eligible food order."
                />
                <HowStep
                  number="03"
                  Icon={Gift}
                  title="Your wallet is rewarded"
                  body="The referral reward is credited automatically after completion."
                />
              </div>
            </div>

            <Link
              to="/wallet"
              className="group flex items-center justify-between rounded-lg bg-[#173f35] p-5 text-white transition hover:bg-[#12342c]"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                  NaijaEats Wallet
                </div>
                <div className="mt-1 font-display text-lg font-semibold">
                  View your rewards balance
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </aside>
        </section>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          Referral rewards are credited automatically after an eligible first order is completed.
          Reward limits and eligibility rules apply.
        </p>
      </div>
    </RoleShell>
  );
}

function ProgressMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-display text-lg font-semibold tabular-nums ${accent ? "text-emerald-700" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function ReferralRow({ referral }: { referral: ReferralWithName }) {
  const ordered = referral.status === "ordered";
  const Icon = ordered ? Trophy : Clock;

  return (
    <li className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
          ordered ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{referral.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {ordered
            ? `First order completed${referral.rewarded_at ? ` on ${new Date(referral.rewarded_at).toLocaleDateString()}` : ""}`
            : "Joined. Reward unlocks after their first completed order."}
        </div>
      </div>
      {ordered && Number(referral.reward_amount) > 0 && (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
          +{fmt(Number(referral.reward_amount))}
        </span>
      )}
    </li>
  );
}

function HowStep({
  number,
  Icon,
  title,
  body,
}: {
  number: string;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-[var(--brand-clay)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-muted-foreground">{number}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
