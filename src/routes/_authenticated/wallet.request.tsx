import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ChevronLeft, ArrowDownLeft, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet/request")({
  component: RequestPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function RequestPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState<number>(5000);
  const [reason, setReason] = useState("Split bill — pepper soup night");
  const [link, setLink] = useState<string | null>(null);

  const generate = () => {
    if (!amount || amount < 100) return toast.error("Minimum request is ₦100");
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setLink(`https://naijaeats.app/pay/${code}`);
    toast.success("Payment link ready");
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: "Payment request", text: `Please send ${fmt(amount)} — ${reason}`, url: link });
    } else {
      copy();
    }
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6">
        <Link to="/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Wallet
        </Link>

        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-semibold">Request</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">Ask to be paid</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate a one-time link to collect from anyone.</p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_100%,oklch(0.75_0.18_55/0.55),transparent_55%),linear-gradient(140deg,#1a1208,#3a230d_60%,#8a5a1f)]">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[var(--brand-gold)]/30 blur-3xl" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Requesting</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl text-white/70">₦</span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => { setAmount(Number(e.target.value)); setLink(null); }}
              className="w-full bg-transparent font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30"
              placeholder="0"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">From (optional)</div>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Name, @handle or phone" className="h-11 rounded-2xl" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">What for?</div>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="rounded-2xl resize-none" />
          </div>
        </div>

        {!link ? (
          <Button onClick={generate} className="mt-6 w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base">
            Generate request link <ArrowDownLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Share this link</div>
              <div className="mt-1 font-mono text-sm break-all">{link}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copy} variant="outline" className="h-12 rounded-2xl">
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button onClick={share} className="h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/wallet" })}>Done</Button>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
