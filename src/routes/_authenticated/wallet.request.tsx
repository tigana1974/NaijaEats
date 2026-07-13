import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { WalletKeypad } from "@/components/naija/WalletKeypad";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Share2,
  Check,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Mail,
  X,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  PiWhatsappLogoDuotone,
  PiPaperPlaneTiltDuotone,
  PiQrCodeDuotone,
  PiCurrencyNgnDuotone,
  PiClockCounterClockwiseDuotone,
  PiCheckCircleDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import {
  createRequest,
  loadRequests,
  markRequest,
  requestUrl,
  REQUESTS_EVENT,
  type MoneyRequest,
} from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/wallet/request")({
  component: RequestPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];
const REASON_CHIPS = ["Split bill", "Rent share", "Suya money", "Groceries", "Chop life 🎉"];

type Step = "form" | "share";

function RequestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [request, setRequest] = useState<MoneyRequest | null>(null);
  const [history, setHistory] = useState<MoneyRequest[]>([]);
  const [tab, setTab] = useState<"open" | "paid">("open");

  useEffect(() => {
    const refresh = () => setHistory(loadRequests());
    refresh();
    window.addEventListener(REQUESTS_EVENT, refresh);
    return () => window.removeEventListener(REQUESTS_EVENT, refresh);
  }, []);

  const canGenerate = amount >= 100;
  const openCount = history.filter((r) => r.status === "open").length;

  const generate = () => {
    if (!canGenerate) return toast.error("Minimum request is ₦100");
    const req = createRequest({
      amount,
      reason: reason.trim() || "Payment request",
      from: from.trim() || undefined,
    });
    setRequest(req);
    setStep("share");
    toast.success("Request link ready");
  };

  const goBack = () => {
    if (step === "form") return navigate({ to: "/wallet" });
    setStep("form");
    setRequest(null);
    setAmount(0);
    setReason("");
    setFrom("");
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

          {step !== "share" && (
            <div className="mt-2 sm:mt-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-amber-600 font-bold">Request money</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                Generate link
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Anyone can pay you instantly via this link
              </p>
            </div>
          )}

          {step === "form" ? (
            <FormStep
              amount={amount}
              setAmount={setAmount}
              reason={reason}
              setReason={setReason}
              from={from}
              setFrom={setFrom}
              openCount={openCount}
              history={history}
              tab={tab}
              setTab={setTab}
              onMarkPaid={(id) => markRequest(id, "paid")}
              onCancel={(id) => markRequest(id, "cancelled")}
            />
          ) : request ? (
            <ShareStep request={request} onDone={() => navigate({ to: "/wallet" })} />
          ) : null}

          {step === "form" && (
            <div className={`pt-2 sm:pt-6 pb-2 sm:pb-4 ${step === "form" ? "mt-4" : "mt-auto"}`}>
              <button
                onClick={generate}
                disabled={!canGenerate}
                className={`w-full h-14 rounded-2xl inline-flex items-center justify-center gap-2 text-base font-bold shadow-xl transition-all ${
                  canGenerate
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 hover:shadow-2xl active:scale-[0.99]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                Generate link <ArrowRight className="h-5 w-5" />
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
                Encrypted · No fees on incoming requests
              </div>
            </div>
          )}
      </div>
    </RoleShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["form", "share"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === idx ? "w-8 bg-amber-500" : i < idx ? "w-3 bg-amber-400/40" : "w-3 bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

function FormStep({
  amount,
  setAmount,
  reason,
  setReason,
  from,
  setFrom,
  openCount,
  history,
  tab,
  setTab,
  onMarkPaid,
  onCancel,
}: {
  amount: number;
  setAmount: (n: number) => void;
  reason: string;
  setReason: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  openCount: number;
  history: MoneyRequest[];
  tab: "open" | "paid";
  setTab: (t: "open" | "paid") => void;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const list = history.filter((r) => (tab === "open" ? r.status === "open" : r.status === "paid"));

  return (
    <>
      {/* Amount hero */}
      <div className="relative mt-3 sm:mt-6 overflow-hidden rounded-2xl sm:rounded-[28px] p-3 sm:p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_0%_100%,oklch(0.78_0.19_60/0.5),transparent_55%),linear-gradient(140deg,#1a1208,#3a230d_55%,#a65a1e)]">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Requesting</div>
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
                    setAmount(prev => {
                      const s = String(prev).slice(0, -1);
                      return s ? Number(s) : 0;
                    });
                  }
                } else if (/^[0-9]$/.test(e.key)) {
                  setAmount(prev => {
                    const next = prev === 0 ? Number(e.key) : Number(String(prev) + e.key);
                    return Math.min(next, 100000000);
                  });
                } else if (e.key === "Escape" || e.key === "Delete" || e.key.toLowerCase() === "c") {
                  setAmount(0);
                }
              }}
              className="w-full bg-transparent font-display text-4xl sm:text-5xl font-semibold tabular-nums outline-none placeholder:text-white/30 caret-transparent"
            />
          </div>
          <div className="mt-3 text-[11px] text-white/70">
            Payer can send via card, bank transfer, or their wallet.
          </div>
        </div>
      </div>



      {/* Quick amounts */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`rounded-xl border py-3 text-sm font-bold transition ${
              amount === q
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            {fmt(q).replace('.00', '')}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="mt-auto pt-3 sm:pt-4">
        <WalletKeypad value={amount} onChange={setAmount} />
      </div>

      {/* Form fields */}
      <div className="mt-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">What's it for?</div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 120))}
            rows={2}
            placeholder="Add a short reason so payers know what to expect"
            className="rounded-2xl resize-none bg-white border-zinc-200"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REASON_CHIPS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  reason === r ? "border-amber-500 bg-amber-50 text-amber-700" : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
            From (optional)
          </div>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Name, @handle or phone"
            className="h-12 rounded-2xl bg-white border-zinc-200"
          />
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Your requests
            </div>
            <div className="inline-flex rounded-full bg-zinc-100 p-0.5 text-xs font-semibold">
              {(["open", "paid"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full transition capitalize ${
                    tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                  }`}
                >
                  {t}
                  {t === "open" && openCount > 0 && ` (${openCount})`}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
              No {tab} requests yet.
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <RequestRow key={r.id} req={r} onMarkPaid={onMarkPaid} onCancel={onCancel} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function RequestRow({
  req,
  onMarkPaid,
  onCancel,
}: {
  req: MoneyRequest;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const url = requestUrl(req.code);
  const isPaid = req.status === "paid";
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {isPaid ? <PiCheckCircleDuotone className="h-6 w-6" /> : <PiCurrencyNgnDuotone className="h-6 w-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold tabular-nums text-zinc-900">{fmt(req.amount)}</div>
            <div className="text-xs text-zinc-500 truncate">{req.reason}</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {new Date(req.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {req.from ? ` · from ${req.from}` : ""}
            </div>
          </div>
        </div>
      </div>
      {!isPaid && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("Link copied");
            }}
            className="flex-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
          <button
            onClick={() => onMarkPaid(req.id)}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Mark paid
          </button>
          <button
            onClick={() => onCancel(req.id)}
            aria-label="Cancel request"
            className="rounded-xl bg-zinc-100 hover:bg-red-50 hover:text-red-600 transition p-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ShareStep({ request, onDone }: { request: MoneyRequest; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => requestUrl(request.code), [request.code]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1600);
  };

  const shareText = `Please send ${fmt(request.amount)}${request.reason ? ` — ${request.reason}` : ""}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Payment request", text: shareText, url });
      } catch {
        // dismissed
      }
    } else {
      copy();
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(`${shareText} ${url}`)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent("Payment request")}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`;

  return (
    <>
      {/* Amount + QR */}
      <div className="mt-6 relative overflow-hidden rounded-2xl sm:rounded-[28px] bg-white border border-amber-100 p-6 text-center shadow-[0_20px_60px_-24px_rgba(245,158,11,0.35)]">
        <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-amber-700 font-extrabold">Payment request</div>
          <div className="font-display text-4xl font-bold text-zinc-900 tabular-nums mt-2">{fmt(request.amount)}</div>
          <div className="mt-1 text-sm text-zinc-500">{request.reason}</div>
          {request.from && <div className="text-xs text-zinc-400 mt-0.5">from {request.from}</div>}

          {/* QR */}
          <div className="mt-5 mx-auto w-fit rounded-3xl bg-white p-4 border border-zinc-200 shadow-inner">
            <FauxQR seed={request.code} />
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold">
            <PiQrCodeDuotone className="h-3.5 w-3.5" />
            <span className="font-mono tracking-widest tabular-nums">{request.code}</span>
          </div>
        </div>
      </div>

      {/* Link box */}
      <div className="mt-4 rounded-2xl bg-white border border-zinc-200 p-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <PiPaperPlaneTiltDuotone className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Payment link</div>
          <div className="text-xs font-mono truncate">{url}</div>
        </div>
        <button
          onClick={copy}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
            copied ? "bg-emerald-100 text-emerald-700" : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {copied ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Copied
            </span>
          ) : (
            "Copy"
          )}
        </button>
      </div>

      {/* Share targets */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <ShareTile href={whatsappUrl} Icon={PiWhatsappLogoDuotone} label="WhatsApp" tone="bg-emerald-100 text-emerald-700" />
        <ShareTile href={smsUrl} Icon={MessageCircle} label="SMS" tone="bg-blue-100 text-blue-700" />
        <ShareTile href={mailUrl} Icon={Mail} label="Email" tone="bg-purple-100 text-purple-700" />
        <button
          onClick={share}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-zinc-200 p-3 hover:bg-zinc-50 transition"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
            <Share2 className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
        </button>
      </div>

      <button
        onClick={onDone}
        className="mt-6 w-full h-13 flex items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition py-3.5"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Done
      </button>
    </>
  );
}

function ShareTile({
  href,
  Icon,
  label,
  tone,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-zinc-200 p-3 hover:bg-zinc-50 transition"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </a>
  );
}

/**
 * Faux QR code — visually convincing SVG derived deterministically from the
 * request code. Renders offline, doesn't need a QR library, and looks premium
 * next to the amber card. Swap for a real encoder (`qrcode` npm) when the
 * pay-me URL is scanned by a real bank app.
 */
function FauxQR({ seed }: { seed: string }) {
  const grid = 25;
  const cells = useMemo(() => {
    const h = Array.from(seed).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
    const rng = mulberry32(h);
    const out: boolean[] = [];
    for (let i = 0; i < grid * grid; i++) out.push(rng() > 0.52);
    return out;
  }, [seed]);

  const cell = 8;
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={cell * 7} height={cell * 7} rx={4} fill="#0a0a0a" />
      <rect x={x + cell} y={y + cell} width={cell * 5} height={cell * 5} rx={3} fill="white" />
      <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} rx={2} fill="#0a0a0a" />
    </g>
  );

  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= grid - 7 && y < 7) || (x < 7 && y >= grid - 7);

  return (
    <svg width={grid * cell} height={grid * cell} viewBox={`0 0 ${grid * cell} ${grid * cell}`}>
      {cells.map((on, i) => {
        const x = i % grid;
        const y = Math.floor(i / grid);
        if (!on || inFinder(x, y)) return null;
        return <rect key={i} x={x * cell} y={y * cell} width={cell} height={cell} rx={1} fill="#0a0a0a" />;
      })}
      {finder(0, 0)}
      {finder((grid - 7) * cell, 0)}
      {finder(0, (grid - 7) * cell)}
      {/* Brand chip in center — Naija Eats logo */}
      <g>
        <rect
          x={grid * cell / 2 - 24}
          y={grid * cell / 2 - 24}
          width={48}
          height={48}
          rx={12}
          fill="white"
        />
        <image
          href="/logo.png"
          x={grid * cell / 2 - 20}
          y={grid * cell / 2 - 20}
          width={40}
          height={40}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </svg>
  );
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
