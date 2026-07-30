import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Gift,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  PiClockCounterClockwiseDuotone,
  PiForkKnifeDuotone,
  PiHandCoinsDuotone,
  PiUsersThreeDuotone,
  PiWalletDuotone,
} from "react-icons/pi";
import { toast } from "sonner";

import { RoleShell } from "@/components/naija/RoleShell";
import {
  claimIncomingTransfers,
  loadWallet,
  subscribeIncomingTransfers,
  WALLET_EVENT,
  type WalletState,
  type WalletTxn,
} from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/wallet/")({
  component: WalletPage,
});

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

function useWallet(): WalletState {
  const [state, setState] = useState<WalletState>(() => loadWallet());

  useEffect(() => {
    const refresh = () => setState(loadWallet());
    window.addEventListener(WALLET_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WALLET_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return state;
}

function useIncomingTransfers() {
  useEffect(() => {
    let cancelled = false;

    const claim = async () => {
      try {
        const count = await claimIncomingTransfers();
        if (!cancelled && count > 0) {
          toast.success(count === 1 ? "You received money" : `You received ${count} transfers`);
        }
      } catch {
        // Realtime will retry the claim when the next transfer event arrives.
      }
    };

    void claim();
    const unsubscribe = subscribeIncomingTransfers(() => void claim());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}

const ACTIONS: Array<{
  to: string;
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    to: "/wallet/top-up",
    label: "Top up",
    description: "Add money to your wallet",
    Icon: Plus,
    tone: "bg-[var(--brand-clay)] text-white",
  },
  {
    to: "/wallet/send",
    label: "Send",
    description: "Pay a NaijaEats user",
    Icon: ArrowUpRight,
    tone: "bg-[#173f35] text-white",
  },
  {
    to: "/wallet/request",
    label: "Request",
    description: "Ask someone to pay you",
    Icon: ArrowDownLeft,
    tone: "bg-[#e9b949] text-[#201806]",
  },
  {
    to: "/wallet/split",
    label: "Split bill",
    description: "Share a food bill fairly",
    Icon: Users,
    tone: "bg-[#363258] text-white",
  },
  {
    to: "/referrals",
    label: "Referral",
    description: "Invite friends and earn",
    Icon: Gift,
    tone: "bg-[#20201d] text-white",
  },
];

function WalletPage() {
  const wallet = useWallet();
  useIncomingTransfers();
  const [hidden, setHidden] = useState(false);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let credit = 0;
    let debit = 0;

    for (const transaction of wallet.txns) {
      if (new Date(transaction.createdAt).getTime() < monthStart) continue;
      if (transaction.amount >= 0) credit += transaction.amount;
      else debit += Math.abs(transaction.amount);
    }

    return { credit, debit };
  }, [wallet.txns]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return wallet.txns.filter((transaction) => {
      if (filter === "in" && transaction.amount < 0) return false;
      if (filter === "out" && transaction.amount >= 0) return false;
      if (!search) return true;
      return (
        transaction.title.toLowerCase().includes(search) ||
        (transaction.note ?? "").toLowerCase().includes(search) ||
        transaction.type.includes(search)
      );
    });
  }, [filter, query, wallet.txns]);

  return (
    <RoleShell containerClassName="w-full px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-clay)]">
              NaijaEats Wallet
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Money for every meal
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Top up, pay people, collect money, and manage food spending from one place.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4" /> Protected wallet
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-lg bg-[#171714] text-white shadow-[0_24px_70px_-38px_rgba(0,0,0,0.7)]">
          <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                <PiWalletDuotone className="h-5 w-5 text-[#e9b949]" /> Available balance
              </div>
              <div className="mt-5 flex min-w-0 items-center gap-3">
                <div className="min-w-0 font-display text-[2.65rem] font-semibold leading-none tracking-tight sm:text-6xl lg:text-7xl">
                  {hidden ? "*****" : fmt(wallet.balance)}
                </div>
                <button
                  type="button"
                  onClick={() => setHidden((value) => !value)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10"
                  aria-label={hidden ? "Show balance" : "Hide balance"}
                >
                  {hidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
                <span>Ready for instant checkout</span>
                <span className="hidden h-1 w-1 rounded-full bg-[#e9b949] sm:block" />
                <span>No transfer fees inside NaijaEats</span>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.04] p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                This month
              </div>
              <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-1">
                <MonthlyMetric
                  Icon={ArrowDownLeft}
                  label="Money in"
                  value={stats.credit}
                  iconClass="bg-emerald-400/15 text-emerald-300"
                />
                <MonthlyMetric
                  Icon={ArrowUpRight}
                  label="Money out"
                  value={stats.debit}
                  iconClass="bg-[#e9b949]/15 text-[#f2cc72]"
                />
              </div>
              <div className="mt-6 border-t border-white/10 pt-5 text-xs text-white/50">
                Wallet ID ending in {(wallet.txns[0]?.id ?? "0000").slice(-4).toUpperCase()}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                What would you like to do?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your most important wallet tools, ready in one tap.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:gap-4">
            {ACTIONS.map((action, index) => (
              <Link
                key={action.label}
                to={action.to}
                className={`group min-h-32 rounded-lg border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg sm:min-h-40 sm:p-5 ${
                  index === ACTIONS.length - 1 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-lg ${action.tone}`}>
                  <action.Icon className="h-5 w-5" />
                </span>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <BenefitRow
            Icon={Sparkles}
            title="Gold top-up bonus"
            body="Add at least N20,000 and receive your eligible bonus instantly."
            to="/wallet/top-up"
          />
          <BenefitRow
            Icon={PiUsersThreeDuotone}
            title="Refer and earn"
            body="Track invitations and rewards from your referral dashboard."
            to="/referrals"
          />
          <BenefitRow
            Icon={PiForkKnifeDuotone}
            title="Pay at checkout"
            body="Use your wallet with participating restaurants, chefs, and stores."
            to="/discover"
          />
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Recent activity
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A clear record of money moving in and out.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block sm:w-60">
                <span className="sr-only">Search wallet activity</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search activity"
                  className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-foreground/30"
                />
              </label>
              <div className="grid grid-cols-3 rounded-lg bg-muted p-1 text-xs font-semibold">
                {(["all", "in", "out"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-md px-3 py-2 transition ${
                      filter === value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {value === "in" ? "Money in" : value === "out" ? "Money out" : "All"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            {filtered.length === 0 ? (
              <EmptyActivity hasAny={wallet.txns.length > 0} />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((transaction) => (
                  <TxnRow key={transaction.id} txn={transaction} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-700" /> Encrypted and protected wallet
          activity
        </div>
      </div>
    </RoleShell>
  );
}

function MonthlyMetric({
  Icon,
  label,
  value,
  iconClass,
}: {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-white/50">{label}</div>
        <div className="truncate font-display text-xl font-semibold tabular-nums">{fmt(value)}</div>
      </div>
    </div>
  );
}

function BenefitRow({
  Icon,
  title,
  body,
  to,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20 hover:shadow-md"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 font-semibold">
          {title}
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}

const TXN_META: Record<
  WalletTxn["type"],
  { Icon: ComponentType<{ className?: string }>; tone: string }
> = {
  topup: { Icon: PiHandCoinsDuotone, tone: "bg-emerald-50 text-emerald-700" },
  bonus: { Icon: Sparkles, tone: "bg-amber-50 text-amber-700" },
  send: { Icon: ArrowUpRight, tone: "bg-red-50 text-[var(--brand-clay)]" },
  receive: { Icon: ArrowDownLeft, tone: "bg-emerald-50 text-emerald-700" },
  request: { Icon: ArrowDownLeft, tone: "bg-indigo-50 text-indigo-700" },
  order: { Icon: PiForkKnifeDuotone, tone: "bg-red-50 text-[var(--brand-clay)]" },
  referral: { Icon: PiUsersThreeDuotone, tone: "bg-amber-50 text-amber-700" },
  premium: { Icon: Sparkles, tone: "bg-red-50 text-[var(--brand-clay)]" },
  invoice: { Icon: Receipt, tone: "bg-violet-50 text-violet-700" },
};

function TxnRow({ txn }: { txn: WalletTxn }) {
  const meta = TXN_META[txn.type];
  const isCredit = txn.amount >= 0;

  return (
    <li className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
        <meta.Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{txn.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {new Date(txn.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {txn.note ? ` - ${txn.note}` : ""}
        </div>
      </div>
      <div
        className={`shrink-0 text-sm font-semibold tabular-nums sm:text-base ${
          isCredit ? "text-emerald-700" : "text-foreground"
        }`}
      >
        {isCredit ? "+" : "-"}
        {fmt(Math.abs(txn.amount))}
      </div>
    </li>
  );
}

function EmptyActivity({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
        {hasAny ? (
          <Receipt className="h-6 w-6" />
        ) : (
          <PiClockCounterClockwiseDuotone className="h-7 w-7" />
        )}
      </span>
      <div className="mt-4 font-semibold">
        {hasAny ? "Nothing matches that filter" : "No activity yet"}
      </div>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {hasAny
          ? "Try another filter or clear your search."
          : "Top up your wallet to start paying, sharing bills, and earning rewards."}
      </p>
      {!hasAny && (
        <Link
          to="/wallet/top-up"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
        >
          <Plus className="h-4 w-4" /> Top up now
        </Link>
      )}
    </div>
  );
}
