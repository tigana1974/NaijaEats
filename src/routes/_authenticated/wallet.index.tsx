import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RoleShell } from "@/components/naija/RoleShell";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Gift,
  Sparkles,
  Receipt,
  Search,
} from "lucide-react";
import {
  PiWalletDuotone,
  PiArrowsLeftRightDuotone,
  PiHandCoinsDuotone,
  PiForkKnifeDuotone,
  PiUsersThreeDuotone,
  PiClockCounterClockwiseDuotone,
} from "react-icons/pi";
import {
  loadWallet,
  WALLET_EVENT,
  claimIncomingTransfers,
  subscribeIncomingTransfers,
  type WalletState,
  type WalletTxn,
} from "@/lib/wallet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet/")({
  component: WalletPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

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

/**
 * Claim any pending wallet_transfers rows for the current user on mount and
 * then again whenever a new one arrives via realtime. Each claim credits the
 * local wallet, so the WALLET_EVENT listeners above pick up the change.
 */
function useIncomingTransfers() {
  useEffect(() => {
    let cancelled = false;

    const claim = async () => {
      try {
        const n = await claimIncomingTransfers();
        if (!cancelled && n > 0) {
          toast.success(n === 1 ? "You received money" : `You received ${n} transfers`);
        }
      } catch {
        // network hiccup — silently retry on next event
      }
    };

    claim();
    const unsubscribe = subscribeIncomingTransfers(() => claim());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}

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
    for (const t of wallet.txns) {
      const ts = new Date(t.createdAt).getTime();
      if (ts < monthStart) continue;
      if (t.amount >= 0) credit += t.amount;
      else debit += Math.abs(t.amount);
    }
    return { credit, debit };
  }, [wallet.txns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wallet.txns.filter((t) => {
      if (filter === "in" && t.amount < 0) return false;
      if (filter === "out" && t.amount >= 0) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.note ?? "").toLowerCase().includes(q) ||
        t.type.includes(q)
      );
    });
  }, [wallet.txns, filter, query]);

  return (
    <RoleShell>
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 pt-3 sm:pt-6 pb-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Wallet</div>
            <h1 className="font-display text-xl sm:text-3xl font-semibold tracking-tight mt-0.5">Your balance</h1>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-forest)]" /> Bank-grade encryption
          </div>
        </div>

        {/* Balance card */}
        <div className="relative mt-4 overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.55),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(140deg,#1a1108,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
                <PiWalletDuotone className="h-4 w-4" /> Available balance
              </div>
              <div className="mt-2 flex items-baseline gap-2 sm:gap-3">
                <span className="font-display text-[2.5rem] leading-none sm:text-6xl font-semibold tabular-nums">
                  {hidden ? "•••••" : fmt(wallet.balance)}
                </span>
                <button
                  onClick={() => setHidden((v) => !v)}
                  className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
                  aria-label={hidden ? "Show balance" : "Hide balance"}
                >
                  {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> +{fmt(stats.credit)} this month
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/80" /> -{fmt(stats.debit)} spent
                </span>
              </div>
            </div>

            {/* Naija Eats brand chip mark */}
            <div className="hidden sm:flex flex-col items-end gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Naija Eats</div>
                <div className="font-display text-sm font-semibold">Gold member</div>
              </div>
              <div className="text-[10px] tabular-nums text-white/60 font-mono tracking-widest">
                •••• {(wallet.txns[0]?.id ?? "0000").slice(-4).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="relative mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            <Link
              to="/wallet/top-up"
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl py-3.5 bg-white text-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-clay)] text-white group-hover:scale-105 transition-transform duration-200">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold">Top up</span>
            </Link>
            <Link
              to="/wallet/send"
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl py-3.5 bg-white/10 text-white border border-white/10 backdrop-blur hover:bg-white/15 transition-all duration-200"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 group-hover:scale-105 transition-transform duration-200">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold">Send</span>
            </Link>
            <Link
              to="/wallet/request"
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl py-3.5 bg-white/10 text-white border border-white/10 backdrop-blur hover:bg-white/15 transition-all duration-200"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 group-hover:scale-105 transition-transform duration-200">
                <ArrowDownLeft className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold">Request</span>
            </Link>
            <Link
              to="/referrals"
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl py-3.5 bg-white/10 text-white border border-white/10 backdrop-blur hover:bg-white/15 transition-all duration-200"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 group-hover:scale-105 transition-transform duration-200">
                <Gift className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold">Refer</span>
            </Link>
          </div>
        </div>

        {/* Rewards / perks strip */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PerkCard
            Icon={Sparkles}
            title="10% Gold bonus"
            body="Top up ₦20,000 or more and we add 10% instantly."
            to="/wallet/top-up"
            tone="gold"
          />
          <PerkCard
            Icon={PiUsersThreeDuotone}
            title="Refer & feast"
            body="Invite 5 friends who order — earn up to ₦40,000."
            to="/referrals"
            tone="clay"
          />
          <PerkCard
            Icon={PiForkKnifeDuotone}
            title="Wallet at checkout"
            body="Pay any restaurant instantly — no cards, no fees."
            to="/discover"
            tone="forest"
          />
        </div>

        {/* Activity */}
        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Activity</h2>
              <p className="text-sm text-muted-foreground">Every naira in and out, kept private on this device.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-10 w-[190px] rounded-2xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
              <div className="inline-flex rounded-full bg-muted p-0.5 text-xs font-semibold">
                {(["all", "in", "out"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full transition capitalize ${
                      filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "in" ? "Money in" : f === "out" ? "Money out" : "All"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-border bg-card overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyActivity hasAny={wallet.txns.length > 0} />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((t) => (
                  <TxnRow key={t.id} txn={t} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
          Encrypted end-to-end · FCA-compliant partner banking
        </div>
      </div>
    </RoleShell>
  );
}

function PerkCard({
  Icon,
  title,
  body,
  to,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  to: string;
  tone: "gold" | "clay" | "forest";
}) {
  const styles =
    tone === "gold"
      ? "from-[oklch(0.96_0.05_90)] to-[oklch(0.98_0.03_90)] text-[oklch(0.62_0.13_75)] border-[oklch(0.85_0.10_85)]/40"
      : tone === "clay"
        ? "from-[oklch(0.97_0.03_25)] to-[oklch(0.99_0.01_25)] text-[var(--brand-clay)] border-[oklch(0.85_0.10_25)]/40"
        : "from-[oklch(0.96_0.04_145)] to-[oklch(0.99_0.02_145)] text-[oklch(0.42_0.14_145)] border-[oklch(0.85_0.10_145)]/40";
  return (
    <Link
      to={to}
      className={`group rounded-3xl border bg-gradient-to-br ${styles} p-5 transition-all duration-200 hover:shadow-[var(--shadow-soft)] hover:-translate-y-0.5`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 backdrop-blur">
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/70">{body}</p>
    </Link>
  );
}

const TXN_META: Record<
  WalletTxn["type"],
  { Icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  topup: { Icon: PiHandCoinsDuotone, tone: "bg-[oklch(0.95_0.04_145)] text-[oklch(0.42_0.14_145)]" },
  bonus: { Icon: Sparkles, tone: "bg-[oklch(0.96_0.05_90)] text-[oklch(0.62_0.13_75)]" },
  send: { Icon: ArrowUpRight, tone: "bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)]" },
  request: { Icon: ArrowDownLeft, tone: "bg-[oklch(0.95_0.03_250)] text-[oklch(0.55_0.15_250)]" },
  order: { Icon: PiForkKnifeDuotone, tone: "bg-[oklch(0.96_0.03_25)] text-[var(--brand-clay)]" },
  referral: { Icon: PiUsersThreeDuotone, tone: "bg-[oklch(0.96_0.05_90)] text-[oklch(0.62_0.13_75)]" },
};

function TxnRow({ txn }: { txn: WalletTxn }) {
  const meta = TXN_META[txn.type];
  const isCredit = txn.amount >= 0;
  return (
    <li className="flex items-center gap-3 px-4 sm:px-5 py-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
        <meta.Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{txn.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {new Date(txn.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {txn.note ? ` · ${txn.note}` : ""}
        </div>
      </div>
      <div
        className={`shrink-0 tabular-nums text-sm font-semibold ${
          isCredit ? "text-[oklch(0.52_0.16_145)]" : "text-foreground"
        }`}
      >
        {isCredit ? "+" : "−"}
        {fmt(Math.abs(txn.amount))}
      </div>
    </li>
  );
}

function EmptyActivity({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
        {hasAny ? <Receipt className="h-6 w-6" /> : <PiClockCounterClockwiseDuotone className="h-7 w-7" />}
      </span>
      <div className="mt-3 font-semibold">{hasAny ? "Nothing matches that filter" : "No activity yet"}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {hasAny
          ? "Try switching filters or clearing your search."
          : "Top up your wallet to unlock instant checkout, referrals, and bonuses."}
      </div>
      {!hasAny && (
        <Link
          to="/wallet/top-up"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Top up now
        </Link>
      )}
    </div>
  );
}
