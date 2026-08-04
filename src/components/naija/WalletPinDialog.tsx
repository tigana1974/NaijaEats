import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { getPinStatus, setWalletPin, verifyWalletPin } from "@/lib/walletPin";

/**
 * One dialog for every money movement. If the user has no PIN yet it walks them
 * through creating one, then authorises the payment. Nothing is charged until
 * `onVerified` fires, so this is the single gate in front of the wallet.
 */
export function WalletPinDialog({
  open,
  title = "Confirm payment",
  amountLabel,
  onVerified,
  onClose,
}: {
  open: boolean;
  title?: string;
  amountLabel?: string;
  onVerified: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"loading" | "enter" | "create">("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setConfirmPin("");
    setError(null);
    setMode("loading");
    getPinStatus()
      .then((s) => setMode(s.has_pin ? "enter" : "create"))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not check your PIN");
        setMode("enter");
      });
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        if (pin !== confirmPin) throw new Error("Those PINs don't match");
        await setWalletPin(pin);
      } else {
        const ok = await verifyWalletPin(pin);
        if (!ok) throw new Error("Incorrect PIN. Please try again.");
      }
      await onVerified();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPin("");
      setConfirmPin("");
    } finally {
      setBusy(false);
    }
  };

  const valid =
    /^[0-9]{4,6}$/.test(pin) && (mode !== "create" || /^[0-9]{4,6}$/.test(confirmPin));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 font-display text-lg font-bold text-zinc-900">
          {mode === "create" ? "Create your wallet PIN" : title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "create"
            ? "Set a 4–6 digit PIN. You'll enter it to authorise every payment, including ones you ask Xora to make."
            : amountLabel
              ? `Enter your PIN to authorise ${amountLabel}.`
              : "Enter your wallet PIN to continue."}
        </p>

        <div className="mt-5 space-y-3">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={mode === "create" ? "New PIN" : "Wallet PIN"}
            className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
          />
          {mode === "create" && (
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Confirm PIN"
              className="w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-[var(--brand-clay)]"
            />
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!valid || busy || mode === "loading"}
          onClick={() => void submit()}
          className="mt-5 w-full rounded-full bg-[var(--brand-clay)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Please wait…" : mode === "create" ? "Set PIN & continue" : "Authorise payment"}
        </button>
        <p className="mt-3 text-center text-[11px] text-zinc-400">
          Your PIN is encrypted and never shared — not even with Xora.
        </p>
      </div>
    </div>
  );
}
