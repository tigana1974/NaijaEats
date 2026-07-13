import { Delete } from "lucide-react";

/**
 * Numeric keypad used across the wallet Top-up / Send / Request flows.
 * Keeps the amount as a stringified number so leading zeros never render
 * and single-digit typing feels natural on mobile.
 */
export function WalletKeypad({
  value,
  onChange,
  max = 100000000,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  const press = (k: string) => {
    if (k === "back") {
      const next = String(value).slice(0, -1);
      onChange(next ? Number(next) : 0);
      return;
    }
    if (k === "00") {
      const next = value === 0 ? 0 : Number(String(value) + "00");
      if (next <= max) onChange(next);
      return;
    }
    const next = value === 0 ? Number(k) : Number(String(value) + k);
    if (next <= max) onChange(next);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          className="h-[3.75rem] sm:h-16 rounded-3xl bg-white border border-zinc-100 text-zinc-900 font-display text-xl sm:text-2xl font-semibold hover:bg-zinc-50 active:scale-95 transition-all shadow-sm"
        >
          {k === "back" ? <Delete className="h-6 w-6 mx-auto text-zinc-500" /> : k}
        </button>
      ))}
    </div>
  );
}
