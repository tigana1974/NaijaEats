import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ChevronLeft, Send, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet/send")({
  component: SendPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const RECENT = [
  { id: "1", name: "Tunde A.", handle: "@tunde", initials: "TA", tone: "clay" },
  { id: "2", name: "Amaka O.", handle: "@amaka", initials: "AO", tone: "forest" },
  { id: "3", name: "Bola K.", handle: "@bola", initials: "BK", tone: "gold" },
  { id: "4", name: "Chinedu", handle: "@chi", initials: "CN", tone: "clay" },
];

function SendPage() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState<number>(2000);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = RECENT.filter((r) =>
    (r.name + r.handle).toLowerCase().includes(search.toLowerCase()),
  );

  const submit = async () => {
    if (!recipient) return toast.error("Pick a recipient");
    if (!amount || amount < 100) return toast.error("Minimum send is ₦100");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Sent ${fmt(amount)} to ${recipient}`);
    navigate({ to: "/wallet" });
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6">
        <Link to="/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Send</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">Send to friends</h1>
          <p className="text-sm text-muted-foreground mt-1">Split a bill or surprise someone with jollof.</p>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, @handle or phone"
            className="pl-9 h-11 rounded-2xl"
          />
        </div>

        {/* Recents */}
        <div className="mt-5">
          <div className="text-xs font-medium text-muted-foreground mb-3">Recent</div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {filtered.map((r) => {
              const active = recipient === r.name;
              const bg =
                r.tone === "clay" ? "bg-[var(--brand-clay)]/15 text-[var(--brand-clay)]" :
                r.tone === "forest" ? "bg-[var(--brand-forest)]/15 text-[var(--brand-forest)]" :
                "bg-[var(--brand-gold)]/30 text-foreground";
              return (
                <button
                  key={r.id}
                  onClick={() => setRecipient(r.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-16"
                >
                  <span className={`grid h-14 w-14 place-items-center rounded-full font-display text-lg font-semibold ${bg} ${active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}>
                    {r.initials}
                  </span>
                  <span className="text-[11px] font-medium truncate w-full text-center">{r.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount card */}
        <div className="relative mt-5 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.75_0.15_160/0.6),transparent_55%),linear-gradient(140deg,#0d2a1f,#14463a_60%,#1f6d52)]">
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">{recipient ? `To ${recipient}` : "Amount"}</div>
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
        </div>

        <div className="mt-5">
          <div className="text-xs font-medium text-muted-foreground mb-2">Note (optional)</div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="For the suya last night 🌶️"
            className="rounded-2xl resize-none"
          />
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" /> Transfers are instant and free between users.
        </div>

        <Button
          onClick={submit}
          disabled={loading}
          className="mt-5 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base"
        >
          {loading ? "Sending…" : <>Send {fmt(amount || 0)} <Send className="h-4 w-4" /></>}
        </Button>
      </div>
    </RoleShell>
  );
}
