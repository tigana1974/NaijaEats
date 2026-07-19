import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { useMemo, useState } from "react";
import { ChevronLeft, Copy, Share2, Users, Check, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import {
  createRequest,
  loadContacts,
  loadWallet,
  requestUrl,
  upsertContact,
  type Contact,
  type MoneyRequest,
} from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/wallet/split")({
  component: SplitBillPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const toneCls: Record<Contact["tone"], string> = {
  clay: "bg-[var(--brand-clay)]/12 text-[var(--brand-clay)]",
  forest: "bg-emerald-100 text-emerald-700",
  gold: "bg-amber-100 text-amber-700",
  ink: "bg-zinc-200 text-zinc-700",
};

/**
 * Split a food bill: enter the total (or pick a recent order), choose the
 * friends who ate with you, and each friend gets a payment request for their
 * share — with a link you can drop straight into WhatsApp.
 */
function SplitBillPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Food bill");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeMe, setIncludeMe] = useState(true);
  const [newFriend, setNewFriend] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts());
  const [sent, setSent] = useState<{ contact: Contact; request: MoneyRequest }[] | null>(null);

  // Recent food orders make a one-tap starting point for the bill amount.
  const recentOrders = useMemo(
    () => loadWallet().txns.filter((t) => t.type === "order" && t.amount < 0).slice(0, 3),
    [],
  );

  const total = Number(amount) || 0;
  const friendCount = selected.size;
  const headCount = friendCount + (includeMe ? 1 : 0);
  const perHead = headCount > 0 ? Math.ceil(total / headCount) : 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addFriend = () => {
    const name = newFriend.trim();
    if (!name) return;
    const contact = upsertContact({ name });
    setContacts(loadContacts());
    setSelected((prev) => new Set(prev).add(contact.id));
    setNewFriend("");
  };

  const sendSplit = async () => {
    if (total <= 0) return void toast.error("Enter the bill amount first");
    if (friendCount === 0) return void toast.error("Pick at least one friend to split with");
    const chosen = contacts.filter((c) => selected.has(c.id));
    try {
      const results = [];
      for (const contact of chosen) {
        const request = await createRequest({
          amount: perHead,
          reason: `${reason.trim() || "Food bill"} — your share (1 of ${headCount})`,
          from: contact.name,
        });
        results.push({ contact, request });
      }
      setSent(results);
      toast.success(`Created ${results.length} payment request${results.length > 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the requests");
    }
  };

  const shareLink = async (contact: Contact, request: MoneyRequest) => {
    const url = requestUrl(request.code);
    const text = `Hey ${contact.name.split(" ")[0]}! Your share of "${reason.trim() || "our food bill"}" is ${fmt(perHead)}. Pay here: ${url}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Message copied — paste it to your friend");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition" aria-label="Back to wallet">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-clay)] font-extrabold">Wallet</div>
            <div className="text-sm font-bold text-zinc-900">Split a bill</div>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-xl pt-5 px-4 pb-10">
        {sent ? (
          /* ── Success: share each friend's payment link ── */
          <div>
            <div className="rounded-3xl bg-emerald-50 p-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <h2 className="mt-3 font-display text-xl font-bold">Requests sent</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {fmt(perHead)} each from {sent.length} friend{sent.length > 1 ? "s" : ""}
                {includeMe ? " (you cover your own share)" : ""}. Share each link so they can pay you.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {sent.map(({ contact, request }) => (
                <div key={request.id} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/[0.05] p-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${toneCls[contact.tone]}`}>
                    {contact.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{contact.name}</div>
                    <div className="text-xs text-zinc-500">{fmt(perHead)} · code {request.code}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(requestUrl(request.code));
                      toast.success("Link copied");
                    }}
                    aria-label="Copy link"
                    className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => shareLink(contact, request)}
                    aria-label="Share link"
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-clay)] text-white shadow-md transition hover:scale-105"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/wallet" })}
              className="mt-6 w-full rounded-full bg-zinc-900 py-3.5 text-sm font-bold text-white"
            >
              Back to wallet
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total bill (₦)</label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 24000"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-zinc-200 px-4 py-4 font-display text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] transition"
              />
              {recentOrders.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {recentOrders.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setAmount(String(Math.abs(t.amount)));
                        setReason(t.title);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 transition"
                    >
                      <ReceiptText className="h-3.5 w-3.5" />
                      {t.title} · {fmt(Math.abs(t.amount))}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What's it for?</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Jollof night at Mama Put"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-zinc-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Split with</label>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMe}
                    onChange={(e) => setIncludeMe(e.target.checked)}
                    className="accent-[var(--brand-clay)]"
                  />
                  Include my own share
                </label>
              </div>
              <div className="mt-2.5 space-y-2">
                {contacts.map((c) => {
                  const on = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                        on ? "bg-[var(--brand-clay)]/8 ring-2 ring-[var(--brand-clay)]" : "bg-white ring-1 ring-zinc-200 hover:ring-zinc-300"
                      }`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${toneCls[c.tone]}`}>
                        {c.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">{c.name}</div>
                        <div className="text-xs text-zinc-500">{c.handle}</div>
                      </div>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${
                          on ? "bg-[var(--brand-clay)] text-white" : "bg-zinc-100 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex gap-2">
                <input
                  value={newFriend}
                  onChange={(e) => setNewFriend(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFriend();
                    }
                  }}
                  placeholder="Add a friend by name…"
                  className="flex-1 rounded-2xl bg-white ring-1 ring-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-clay)] transition"
                />
                <button
                  type="button"
                  onClick={addFriend}
                  className="rounded-2xl bg-zinc-900 px-4 text-sm font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Live breakdown */}
            <div className="rounded-3xl bg-zinc-900 p-5 text-white">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                <Users className="h-4 w-4" /> The split
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="font-display text-3xl font-extrabold tabular-nums">{fmt(perHead)}</div>
                  <div className="text-xs text-white/60 mt-0.5">
                    per person · {headCount || 0} {headCount === 1 ? "person" : "people"}
                    {includeMe && friendCount > 0 ? " (incl. you)" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums">{fmt(total)}</div>
                  <div className="text-xs text-white/60">total bill</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={sendSplit}
              disabled={total <= 0 || friendCount === 0}
              className="w-full rounded-full bg-[var(--brand-clay)] py-4 text-sm font-bold text-white shadow-lg shadow-[var(--brand-clay)]/30 transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              Request {friendCount > 0 ? `${fmt(perHead)} from ${friendCount} friend${friendCount > 1 ? "s" : ""}` : "shares"}
            </button>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
