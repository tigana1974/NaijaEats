import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, Gift, Copy, Share2, Mail, MessageCircle, Sparkles,
  Check, Clock, UtensilsCrossed, Trophy, Users, Plus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferralsPage,
});

type Referral = {
  id: string;
  name: string;
  contact: string;
  status: "invited" | "joined" | "ordered";
  orderTotal?: number;
  invitedAt: string;
};

const STORAGE_KEY = "naijaeats.referrals";
const CODE_KEY = "naijaeats.referralCode";
const GOAL = 5;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function loadCode(): string {
  if (typeof window === "undefined") return "JOLLOF24";
  let c = localStorage.getItem(CODE_KEY);
  if (!c) {
    c = "EAT" + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem(CODE_KEY, c);
  }
  return c;
}

function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [code, setCode] = useState("JOLLOF24");

  useEffect(() => {
    setCode(loadCode());
    try { setReferrals(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setReferrals([]); }
  }, []);

  const persist = (next: Referral[]) => {
    setReferrals(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const link = `https://naijaeats.app/join?ref=${code}`;

  const stats = useMemo(() => {
    const ordered = referrals.filter((r) => r.status === "ordered");
    const joined = referrals.filter((r) => r.status !== "invited").length;
    const reward = ordered.reduce((sum, r) => sum + Math.min(r.orderTotal ?? 0, 8000), 0);
    return { ordered: ordered.length, joined, reward };
  }, [referrals]);

  const progress = Math.min(stats.ordered / GOAL, 1);
  const unlocked = stats.ordered >= GOAL;


  // Demo helpers so the page feels alive
  const advance = (id: string) => {
    persist(referrals.map((r) => {
      if (r.id !== id) return r;
      if (r.status === "invited") return { ...r, status: "joined" };
      if (r.status === "joined") return { ...r, status: "ordered", orderTotal: 5500 + Math.floor(Math.random() * 4000) };
      return r;
    }));
  };

  const copy = async (text: string, label = "Copied") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const share = async () => {
    const text = `I'm loving Naija Eats — heritage meals from real Buka chefs. Join with my code ${code} and we both eat free 🍲`;
    if (navigator.share) {
      try { await navigator.share({ title: "Join Naija Eats", text, url: link }); } catch {}
    } else {
      copy(`${text} ${link}`, "Invite copied — paste anywhere");
    }
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-16">
        <Link to="/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        {/* Hero */}
        <div className="relative mt-4 overflow-hidden rounded-3xl sm:rounded-[32px] p-4 sm:p-9 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(110%_110%_at_0%_0%,oklch(0.85_0.17_90/0.55),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_50%),linear-gradient(150deg,#1a1108,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[var(--brand-gold)]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-[var(--brand-clay)]/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" />

          <div className="relative">
            <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-2.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-semibold">
              Refer & feast
            </div>
            <h1 className="font-display text-2xl sm:text-5xl font-semibold tracking-tight mt-2 sm:mt-3 leading-[1.05]">
              Invite 5 friends.<br />Eat on us.
            </h1>
            <p className="text-xs sm:text-base text-white/80 mt-2 sm:mt-3 max-w-md">
              For every friend who orders, we credit your wallet up to ₦8,000 toward your next meal. Hit 5 and unlock a full feast on the house.
            </p>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex items-end justify-between mb-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Progress</div>
                <div className="font-display text-sm tabular-nums">
                  <span className="text-2xl font-semibold">{stats.ordered}</span>
                  <span className="text-white/60"> / {GOAL}</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand-gold)] to-white transition-all duration-700"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                <span>{unlocked ? "Free feast unlocked!" : `${GOAL - stats.ordered} more to a free feast`}</span>
                <span className="inline-flex items-center gap-1"><Gift className="h-3 w-3" /> {fmt(stats.reward)} earned</span>
              </div>
            </div>

            {/* Code */}
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 backdrop-blur p-2 pl-4 border border-white/15">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Your code</div>
                <div className="font-mono text-lg font-semibold tracking-[0.2em] truncate">{code}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(code, "Code copied")} className="h-10 px-3 rounded-xl bg-white/15 hover:bg-white/25 transition inline-flex items-center gap-1.5 text-sm font-medium shrink-0">
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button onClick={share} className="h-10 px-3 rounded-xl bg-[var(--brand-gold)] text-foreground hover:opacity-90 transition inline-flex items-center gap-1.5 text-sm font-semibold shrink-0">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard Icon={Users} label="Invited" value={referrals.length} tone="clay" />
          <StatCard Icon={Check} label="Joined" value={stats.joined} tone="forest" />
          <StatCard Icon={Trophy} label="Ordered" value={stats.ordered} tone="gold" />
        </div>

        {/* How it works */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {[
              { Icon: Share2, title: "Share your code", body: "Send it to family on WhatsApp or socials." },
              { Icon: UtensilsCrossed, title: "They order", body: "Friend gets ₦2,000 off their first meal." },
              { Icon: Gift, title: "You get rewarded", body: "Up to ₦8,000 in wallet credit per friend." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-border bg-card p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
                  <s.Icon className="h-5 w-5" />
                </span>
                <div className="font-medium mt-3">{s.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.body}</div>
              </div>
            ))}
          </div>
        </div>



        {/* Activity */}
        <div className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">Your invites</h2>
            <span className="text-xs text-muted-foreground">{referrals.length} total</span>
          </div>
          <div className="mt-3 rounded-3xl border border-border bg-card overflow-hidden">
            {referrals.length === 0 ? (
              <div className="p-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-gold)]/30 text-[var(--brand-clay)]">
                  <Gift className="h-5 w-5" />
                </span>
                <div className="mt-3 font-medium">No invites yet</div>
                <div className="text-sm text-muted-foreground mt-1">Share your code to start earning free meals.</div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {referrals.map((r) => {
                  const tone =
                    r.status === "ordered" ? "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]" :
                    r.status === "joined" ? "bg-[var(--brand-gold)]/30 text-foreground" :
                    "bg-muted text-muted-foreground";
                  const Icon = r.status === "ordered" ? Trophy : r.status === "joined" ? Check : Clock;
                  const reward = r.status === "ordered" ? Math.min(r.orderTotal ?? 0, 8000) : 0;
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-4 sm:px-5 py-4">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {r.contact} · {r.status === "ordered" ? `Ordered ${fmt(r.orderTotal ?? 0)}` : r.status === "joined" ? "Joined — yet to order" : "Invite pending"}
                        </div>
                      </div>
                      {reward > 0 ? (
                        <span className="shrink-0 text-sm font-semibold text-[var(--brand-forest)] tabular-nums">+{fmt(reward)}</span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => advance(r.id)} className="text-[var(--brand-clay)]">
                          {r.status === "invited" ? "Mark joined" : "Mark ordered"}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground text-center max-w-md mx-auto">
          Rewards credit to your Naija Eats wallet within 24 hours of your friend's first order. Max ₦8,000 per friend.
        </p>
      </div>
    </RoleShell>
  );
}

function StatCard({ Icon, label, value, tone }: { Icon: any; label: string; value: number; tone: "clay" | "gold" | "forest" }) {
  const bg =
    tone === "clay" ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" :
    tone === "gold" ? "bg-[var(--brand-gold)]/30 text-foreground" :
    "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${bg}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="font-display text-2xl font-semibold tabular-nums mt-3">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
