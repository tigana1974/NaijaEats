import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Send, Share2, ShieldCheck } from "lucide-react";
import { PiCurrencyNgnDuotone, PiReceiptDuotone, PiWhatsappLogoDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { chatInvoiceUrl, formatInvoiceAmount, shareChatInvoiceWithUser } from "@/lib/chatInvoices";

const shareControlClasses =
  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-zinc-100 px-2 text-[10px] font-bold transition hover:bg-zinc-200";

export type InvoicePresentation = {
  code?: string;
  amount: number;
  currency: string;
  note: string;
  status: "unpaid" | "paid" | "cancelled";
  createdAt: string;
};

export function PayableInvoiceCard({
  invoice,
  from,
  to,
  paid,
  paying,
  canPay,
  onPay,
}: {
  invoice: InvoicePresentation;
  from: string;
  to: string;
  paid: boolean;
  paying: boolean;
  canPay: boolean;
  onPay: () => void;
}) {
  const [side, setSide] = useState<"details" | "code">("details");
  const [qrUrl, setQrUrl] = useState("");
  const [username, setUsername] = useState("");
  const [sharingToUser, setSharingToUser] = useState(false);
  const paymentUrl = useMemo(
    () => (invoice.code ? chatInvoiceUrl(invoice.code) : ""),
    [invoice.code],
  );
  const amountLabel = formatInvoiceAmount(invoice.amount, invoice.currency);
  const invoiceNumber = invoice.code ? `INV-${invoice.code}` : "Legacy invoice";
  const issued = new Date(invoice.createdAt);

  useEffect(() => {
    if (!paymentUrl) {
      setQrUrl("");
      return;
    }
    let active = true;
    QRCode.toDataURL(paymentUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        if (active) setQrUrl("");
      });
    return () => {
      active = false;
    };
  }, [paymentUrl]);

  const copyLink = async () => {
    if (!paymentUrl) return;
    await navigator.clipboard.writeText(paymentUrl);
    toast.success("Invoice payment link copied");
  };

  const shareInvoice = async () => {
    if (!paymentUrl) return;
    const shareData = {
      title: `NaijaEats invoice ${invoiceNumber}`,
      text: `${amountLabel} for ${invoice.note}`,
      url: paymentUrl,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await copyLink();
  };

  const shareToUsername = async () => {
    if (!invoice.code || !username.trim()) return;
    setSharingToUser(true);
    try {
      const recipient = await shareChatInvoiceWithUser(invoice.code, username);
      toast.success(`Invoice sent to @${recipient.username}`);
      setUsername("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not share this invoice");
    } finally {
      setSharingToUser(false);
    }
  };

  const whatsappUrl = paymentUrl
    ? `https://wa.me/?text=${encodeURIComponent(`NaijaEats invoice ${invoiceNumber}\n${amountLabel} for ${invoice.note}\nPay securely: ${paymentUrl}`)}`
    : "";

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white text-zinc-950">
      <div className="bg-emerald-700 px-6 pb-5 pt-6 text-white">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100">
          <PiReceiptDuotone className="h-5 w-5" /> NaijaEats invoice
        </div>
        <div className="mt-2 font-mono text-sm text-emerald-100">{invoiceNumber}</div>
        <div className="mt-3 font-display text-4xl font-extrabold tabular-nums leading-none">
          {amountLabel}
        </div>
        <div className="mt-3">
          {paid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> Paid
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
              Awaiting payment
            </span>
          )}
        </div>
      </div>

      {invoice.code && (
        <div className="mx-5 mt-4 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSide("details")}
            className={`rounded-lg py-2 transition ${side === "details" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setSide("code")}
            className={`rounded-lg py-2 transition ${side === "code" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}
          >
            Pay code
          </button>
        </div>
      )}

      {side === "details" || !invoice.code ? (
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InvoiceField label="From" value={from} />
            <InvoiceField label="Billed to" value={to} />
            <div className="col-span-2">
              <InvoiceField
                label="Issued"
                value={`${issued.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })} · ${issued.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              />
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-zinc-200" />
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <div className="font-semibold break-words">{invoice.note}</div>
              <div className="mt-0.5 text-xs text-zinc-500">Food invoice</div>
            </div>
            <div className="shrink-0 font-semibold tabular-nums">{amountLabel}</div>
          </div>
          <div className="my-4 border-t border-dashed border-zinc-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-zinc-500">Total</span>
            <span className="font-display text-2xl font-extrabold tabular-nums">{amountLabel}</span>
          </div>
          <PaymentAction
            paid={paid}
            paying={paying}
            canPay={canPay}
            amount={amountLabel}
            onPay={onPay}
          />
        </div>
      ) : (
        <div className="px-6 py-5">
          <div className="text-center text-xs font-semibold text-zinc-500">
            Scan to open this secure invoice
          </div>
          <div className="relative mx-auto mt-3 aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
            {qrUrl ? (
              <img src={qrUrl} alt="Invoice payment QR code" className="h-full w-full" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-xl bg-zinc-100" />
            )}
            {qrUrl && (
              <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white p-1.5 shadow-md ring-4 ring-white">
                <img src="/logo.png" alt="NaijaEats" className="h-full w-full object-contain" />
              </span>
            )}
          </div>
          <div className="mt-3 text-center font-mono text-sm font-bold tracking-wider">
            {invoiceNumber}
          </div>
          <PaymentAction
            paid={paid}
            paying={paying}
            canPay={canPay}
            amount={amountLabel}
            onPay={onPay}
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={copyLink} className={shareControlClasses}>
              <Copy className="h-4 w-4" /> Copy link
            </button>
            <button type="button" onClick={shareInvoice} className={shareControlClasses}>
              <Share2 className="h-4 w-4" /> Share
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={`${shareControlClasses} text-emerald-700`}
            >
              <PiWhatsappLogoDuotone className="h-5 w-5" /> WhatsApp
            </a>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 p-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Send to NaijaEats ID
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="@username"
                className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={shareToUsername}
                disabled={!username.trim() || sharingToUser}
                aria-label="Send invoice to NaijaEats ID"
                className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Payment updates this invoice
            automatically
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="mt-0.5 truncate font-semibold">{value}</div>
    </div>
  );
}

function PaymentAction({
  paid,
  paying,
  canPay,
  amount,
  onPay,
}: {
  paid: boolean;
  paying: boolean;
  canPay: boolean;
  amount: string;
  onPay: () => void;
}) {
  if (paid) {
    return (
      <div className="mt-5 rounded-2xl bg-emerald-50 py-3 text-center text-sm font-bold text-emerald-700">
        Paid and confirmed
      </div>
    );
  }
  if (!canPay) return null;
  return (
    <button
      type="button"
      onClick={onPay}
      disabled={paying}
      className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-clay)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--brand-clay)]/25 transition active:scale-[0.99] disabled:opacity-60"
    >
      {paying ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />{" "}
          Processing...
        </>
      ) : (
        <>
          <PiCurrencyNgnDuotone className="h-4 w-4" /> Pay {amount} from wallet
        </>
      )}
    </button>
  );
}
