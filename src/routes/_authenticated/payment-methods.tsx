import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, CreditCard, Plus, Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payment-methods")({
  component: PaymentMethodsPage,
});

type Card = { id: string; brand: string; last4: string; exp: string; holder: string };
const STORAGE_KEY = "naijaeats.paymentMethods";

function PaymentMethodsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");

  useEffect(() => {
    try { setCards(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setCards([]); }
  }, []);

  const persist = (next: Card[]) => {
    setCards(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const detectBrand = (n: string) => {
    const d = n.replace(/\D/g, "");
    if (/^4/.test(d)) return "Visa";
    if (/^5[1-5]/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (/^5061|^5078|^6500/.test(d)) return "Verve";
    return "Card";
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length < 12) return toast.error("Enter a valid card number");
    if (!/^\d{2}\/\d{2}$/.test(exp)) return toast.error("Expiry must be MM/YY");
    const card: Card = {
      id: crypto.randomUUID(),
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      exp,
      holder: holder || "Cardholder",
    };
    persist([card, ...cards]);
    setHolder(""); setNumber(""); setExp(""); setShowForm(false);
    toast.success("Card saved");
  };

  const remove = (id: string) => {
    persist(cards.filter((c) => c.id !== id));
    toast.success("Card removed");
  };

  return (
    <RoleShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Payment Methods</h1>
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="rounded-full">
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add"}
          </Button>
        </div>

        <Link to="/wallet" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-[var(--brand-clay)]/40 transition">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-clay)]">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium">Naija Eats Wallet</div>
            <div className="text-xs text-muted-foreground">Top up and pay instantly</div>
          </div>
        </Link>

        {showForm && (
          <form onSubmit={add} className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label>Cardholder name</Label>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name on card" />
            </div>
            <div className="space-y-1.5">
              <Label>Card number</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry (MM/YY)</Label>
              <Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="04/28" />
            </div>
            <p className="text-[11px] text-muted-foreground">Cards are stored locally on this device for demo purposes.</p>
            <Button type="submit" className="w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90">Save card</Button>
          </form>
        )}

        <ul className="mt-6 space-y-3">
          {cards.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No saved cards yet.
            </li>
          ) : cards.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{c.brand} •• {c.last4}</div>
                <div className="text-xs text-muted-foreground">{c.holder} · Exp {c.exp}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-[var(--brand-clay)]">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </RoleShell>
  );
}
