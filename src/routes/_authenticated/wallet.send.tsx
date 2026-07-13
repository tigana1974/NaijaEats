import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { WalletKeypad } from "@/components/naija/WalletKeypad";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ShieldCheck,
  Search,
  Send as SendIcon,
  ArrowRight,
  Check,
  CheckCircle2,
  UserPlus,
  X,
} from "lucide-react";
import { PiWalletDuotone, PiUserCircleDuotone, PiPaperPlaneTiltDuotone, PiLightningDuotone } from "react-icons/pi";
import { AtSign } from "lucide-react";
import { toast } from "sonner";
import {
  addWalletTxn,
  loadWallet,
  loadContacts,
  upsertContact,
  initialsOf,
  sendToUser,
  type Contact,
} from "@/lib/wallet";
import { searchUsersByUsername, normalizeUsername, loadLocalUsernameForCurrentUser, type FoundUser } from "@/lib/username";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/wallet/send")({
  component: SendPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const QUICK_NOTES = ["Split bill 🍲", "Chop life 🎉", "Suya money 🌶️", "Thanks 🙏", "Rent share 🏠"];

type Step = "pick" | "amount" | "review" | "success";

function SendPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("pick");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recipient, setRecipient] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");

  useEffect(() => {
    setContacts(loadContacts());
    setBalance(loadWallet().balance);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => (c.name + c.handle).toLowerCase().includes(q));
  }, [contacts, search]);

  const overBalance = amount > balance;

  const pickContact = (c: Contact) => {
    setRecipient(c);
    setStep("amount");
  };

  const addContact = () => {
    if (!newName.trim()) return toast.error("Name is required");
    const c = upsertContact({ name: newName, handle: newHandle });
    setContacts(loadContacts());
    setAddOpen(false);
    setNewName("");
    setNewHandle("");
    pickContact(c);
  };

  const submit = async () => {
    if (!recipient) return;
    if (amount < 100) return toast.error("Minimum send is ₦100");
    if (overBalance) return toast.error("Not enough balance");
    setLoading(true);
    try {
      // Bump the recipient's "last sent to" in the local contacts either way.
      upsertContact({
        name: recipient.name,
        handle: recipient.handle,
        tone: recipient.tone,
        userId: recipient.userId,
      });

      if (recipient.userId) {
        // Real Naija Eats user — this actually credits their wallet on the
        // other side via the wallet_transfers table.
        const { data: me } = await supabase.auth.getUser();
        const myUsername = await loadLocalUsernameForCurrentUser();
        const myName = (me.user?.user_metadata as any)?.full_name
          ?? me.user?.email?.split("@")[0]
          ?? null;
        await sendToUser({
          recipientId: recipient.userId,
          recipientLabel: recipient.name,
          amount,
          note: note || undefined,
          senderName: myName,
          senderUsername: myUsername,
        });
      } else {
        // Legacy local-only contact — debit-only, no counterparty exists.
        addWalletTxn({
          type: "send",
          title: `Sent to ${recipient.name}`,
          note: note || undefined,
          amount: -amount,
        });
      }
      setStep("success");
    } catch (e: any) {
      toast.error(e?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === "pick") return navigate({ to: "/wallet" });
    if (step === "amount") return setStep("pick");
    if (step === "review") return setStep("amount");
    if (step === "success") return navigate({ to: "/wallet" });
  };

  return (
    <RoleShell hideBottomNav containerClassName="fixed inset-0 z-50 bg-[oklch(0.985_0.002_90)] flex flex-col lg:relative lg:inset-auto lg:z-auto lg:flex-1">
      <div className="mx-auto max-w-md w-full px-4 sm:px-6 py-3 sm:py-5 flex-1 flex flex-col h-full">
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

          {step !== "success" && (
            <div className="mt-2 sm:mt-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--brand-clay)] font-bold">Send money</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {step === "pick" && "Who's it for?"}
                {step === "amount" && "How much?"}
                {step === "review" && "Confirm & send"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "pick" && "Search a contact or start a new transfer"}
                {step === "amount" && `Available balance ${fmt(balance)}`}
                {step === "review" && "Instant & free between Naija Eats friends"}
              </p>
            </div>
          )}

          {step === "pick" && (
            <PickStep
              contacts={contacts}
              filtered={filtered}
              search={search}
              setSearch={setSearch}
              onPick={pickContact}
              onOpenAdd={() => setAddOpen(true)}
            />
          )}

          {step === "amount" && recipient && (
            <AmountStep
              recipient={recipient}
              amount={amount}
              setAmount={setAmount}
              balance={balance}
              overBalance={overBalance}
              onNext={() => amount >= 100 && !overBalance && setStep("review")}
            />
          )}

          {step === "review" && recipient && (
            <ReviewStep
              recipient={recipient}
              amount={amount}
              note={note}
              setNote={setNote}
              balance={balance}
            />
          )}

          {step === "success" && recipient && (
            <SuccessStep recipient={recipient} amount={amount} balance={balance - amount} />
          )}

          {/* Sticky footer CTA */}
          {step !== "pick" && step !== "success" && (
            <div className={`pt-2 sm:pt-6 pb-2 sm:pb-4 ${step === "amount" ? "mt-4" : "mt-auto"}`}>
              <button
                onClick={step === "amount" ? () => setStep("review") : submit}
                disabled={loading || amount < 100 || overBalance}
                className={`w-full h-14 rounded-2xl inline-flex items-center justify-center gap-2 text-base font-bold shadow-xl transition-all ${
                  amount >= 100 && !overBalance && !loading
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/30 hover:shadow-2xl active:scale-[0.99]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending…
                  </>
                ) : step === "review" ? (
                  <>
                    <SendIcon className="h-4 w-4" />
                    Send {fmt(amount)}
                  </>
                ) : (
                  <>
                    Review <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-forest)]" />
                Instant & free between Naija Eats users
              </div>
            </div>
          )}

          {/* Add contact sheet */}
          {addOpen && (
            <AddContactSheet
              name={newName}
              handle={newHandle}
              setName={setNewName}
              setHandle={setNewHandle}
              onClose={() => setAddOpen(false)}
              onSave={addContact}
            />
          )}
      </div>
    </RoleShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["pick", "amount", "review", "success"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {steps.slice(0, 3).map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === idx ? "w-8 bg-emerald-600" : i < idx ? "w-3 bg-emerald-500/40" : "w-3 bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

const TONE_MAP: Record<Contact["tone"], string> = {
  clay: "bg-[var(--brand-clay)]/15 text-[var(--brand-clay)]",
  forest: "bg-emerald-100 text-emerald-700",
  gold: "bg-amber-100 text-amber-700",
  ink: "bg-zinc-200 text-zinc-800",
};

function Avatar({ contact, size = 12 }: { contact: Contact; size?: number }) {
  const sizePx = `h-${size} w-${size}`;
  return (
    <span
      className={`grid ${sizePx} place-items-center rounded-full font-display font-bold ${TONE_MAP[contact.tone]}`}
    >
      {contact.initials}
    </span>
  );
}

function PickStep({
  contacts,
  filtered,
  search,
  setSearch,
  onPick,
  onOpenAdd,
}: {
  contacts: Contact[];
  filtered: Contact[];
  search: string;
  setSearch: (v: string) => void;
  onPick: (c: Contact) => void;
  onOpenAdd: () => void;
}) {
  const recents = contacts.filter((c) => c.lastSentAt).slice(0, 6);

  // Live username search. Kicks in when the query starts with @ or is a
  // valid handle prefix (3+ chars, no spaces).
  const [users, setUsers] = useState<FoundUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const usernameQuery = useMemo(() => {
    const raw = search.trim();
    if (!raw) return "";
    // Only treat as username query if it starts with @ or looks handle-ish
    if (raw.startsWith("@")) return normalizeUsername(raw);
    if (/^[a-zA-Z][a-zA-Z0-9_]{1,}$/.test(raw) && !raw.includes(" ")) return normalizeUsername(raw);
    return "";
  }, [search]);

  useEffect(() => {
    if (usernameQuery.length < 2) {
      setUsers([]);
      setSearchingUsers(false);
      return;
    }
    let cancelled = false;
    setSearchingUsers(true);
    const t = window.setTimeout(async () => {
      const found = await searchUsersByUsername(usernameQuery, 8);
      if (!cancelled) {
        setUsers(found);
        setSearchingUsers(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [usernameQuery]);

  const pickUser = (u: FoundUser) => {
    const c: Contact = upsertContact({
      name: u.full_name || `@${u.username}`,
      handle: `@${u.username}`,
      userId: u.id,
    });
    onPick(c);
  };

  // Hide local contacts we've already surfaced from the users list (match by handle)
  const userHandles = new Set(users.map((u) => `@${u.username}`.toLowerCase()));
  const filteredExcludingDupes = filtered.filter((c) => !userHandles.has(c.handle.toLowerCase()));

  return (
    <>
      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or @username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="pl-11 h-12 rounded-2xl bg-white border-zinc-200 shadow-sm"
        />
        {searchingUsers && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            searching…
          </span>
        )}
      </div>

      {/* Add new + Quick tiles */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={onOpenAdd}
          className="flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 p-3.5 hover:border-[var(--brand-clay)]/40 hover:bg-zinc-50 transition text-left"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-zinc-900">New contact</div>
            <div className="text-[11px] text-zinc-500">Send to someone new</div>
          </div>
        </button>
        <Link
          to="/wallet/request"
          className="flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 p-3.5 hover:border-emerald-500/40 hover:bg-zinc-50 transition"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <PiLightningDuotone className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-left">
            <div className="text-sm font-bold text-zinc-900">Request instead</div>
            <div className="text-[11px] text-zinc-500">Share a pay-me link</div>
          </div>
        </Link>
      </div>

      {/* Recents row */}
      {recents.length > 0 && !search && (
        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Recent</div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {recents.map((c) => (
              <button
                key={c.id}
                onClick={() => onPick(c)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
              >
                <span className={`grid h-14 w-14 place-items-center rounded-full font-display text-lg font-bold ${TONE_MAP[c.tone]} group-hover:scale-105 transition-transform`}>
                  {c.initials}
                </span>
                <span className="text-[11px] font-semibold truncate w-full text-center">{c.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live username search results */}
      {users.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2 inline-flex items-center gap-1.5">
            <AtSign className="h-3 w-3" /> Naija Eats users
          </div>
          <div className="rounded-2xl bg-white border border-emerald-200 divide-y divide-emerald-100 overflow-hidden">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => pickUser(u)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-emerald-50 transition text-left"
              >
                <div className="relative h-11 w-11 shrink-0">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="h-full w-full rounded-full object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full font-display font-bold bg-emerald-100 text-emerald-700">
                      {(u.full_name || u.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900 truncate">{u.full_name || `@${u.username}`}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold truncate">@{u.username}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No users found for a valid @-query */}
      {usernameQuery.length >= 2 && !searchingUsers && users.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-5 text-center">
          <AtSign className="h-8 w-8 mx-auto text-zinc-300" />
          <div className="mt-2 text-sm font-semibold text-zinc-700">
            No Naija Eats user with @{usernameQuery}
          </div>
          <div className="text-xs text-zinc-500">Double-check the handle or add them as a contact.</div>
        </div>
      )}

      {/* All contacts */}
      <div className="mt-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
          {search ? `Contacts (${filteredExcludingDupes.length})` : "All contacts"}
        </div>
        {filteredExcludingDupes.length === 0 ? (
          users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
              <PiUserCircleDuotone className="h-10 w-10 mx-auto text-zinc-300" />
              <div className="mt-2 text-sm font-semibold text-zinc-700">No matches</div>
              <div className="text-xs text-zinc-500">Try a different search or add a new contact.</div>
            </div>
          )
        ) : (
          <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
            {filteredExcludingDupes.map((c) => (
              <button
                key={c.id}
                onClick={() => onPick(c)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-50 transition text-left"
              >
                <Avatar contact={c} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900 truncate">{c.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{c.handle}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AmountStep({
  recipient,
  amount,
  setAmount,
  balance,
  overBalance,
  onNext,
}: {
  recipient: Contact;
  amount: number;
  setAmount: (n: number) => void;
  balance: number;
  overBalance: boolean;
  onNext: () => void;
}) {
  return (
    <>
      {/* Recipient card */}
      <div className="mt-3 sm:mt-6 flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 p-3.5">
        <Avatar contact={recipient} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Sending to</div>
          <div className="text-sm font-bold text-zinc-900 truncate">{recipient.name}</div>
          <div className="text-[11px] text-zinc-500 truncate">{recipient.handle}</div>
        </div>
      </div>

      {/* Amount hero */}
      <div className="relative mt-3 sm:mt-4 overflow-hidden rounded-2xl sm:rounded-[28px] p-3 sm:p-6 text-white shadow-[var(--shadow-warm)] bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.75_0.15_160/0.55),transparent_55%),linear-gradient(140deg,#0a2d1f,#14463a_55%,#1f7a5d)]">
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Amount</div>
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
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-white/70">Balance {fmt(balance)}</span>
            {overBalance && (
              <span className="rounded-full bg-red-500/20 text-red-100 px-2 py-0.5 font-bold">
                Exceeds balance
              </span>
            )}
          </div>
        </div>
      </div>



      {/* Quick amounts */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2">
        {[500, 1000, 2000, 5000, 10000, 20000].map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`rounded-xl border py-3 text-sm font-bold transition ${
              amount === q
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            {fmt(q).replace('.00', '')}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="mt-auto pt-3 sm:pt-5">
        <WalletKeypad value={amount} onChange={setAmount} />
      </div>
    </>
  );
}

function ReviewStep({
  recipient,
  amount,
  note,
  setNote,
  balance,
}: {
  recipient: Contact;
  amount: number;
  note: string;
  setNote: (v: string) => void;
  balance: number;
}) {
  return (
    <>
      {/* Big amount */}
      <div className="mt-6 relative overflow-hidden rounded-2xl sm:rounded-[28px] p-7 text-center bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-100">
        <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white shadow-lg ring-1 ring-emerald-100">
            <PiPaperPlaneTiltDuotone className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="font-display text-5xl font-bold text-zinc-900 tabular-nums">{fmt(amount)}</div>
          <div className="mt-2 text-sm text-zinc-500">to</div>
          <div className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1.5 shadow-sm">
            <span className={`grid h-6 w-6 place-items-center rounded-full font-display text-[10px] font-bold ${TONE_MAP[recipient.tone]}`}>
              {recipient.initials}
            </span>
            <span className="text-sm font-bold">{recipient.name}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Add a note</div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 120))}
          rows={2}
          placeholder="What's this for?"
          className="rounded-2xl resize-none bg-white border-zinc-200"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_NOTES.map((n) => (
            <button
              key={n}
              onClick={() => setNote(n)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                note === n ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-5 rounded-2xl bg-white border border-zinc-200 overflow-hidden">
        <BreakdownRow label="Amount" value={fmt(amount)} />
        <BreakdownRow label="Fee" value="Free" tone="emerald" />
        <BreakdownRow label="Balance after" value={fmt(Math.max(0, balance - amount))} bold />
      </div>
    </>
  );
}

function BreakdownRow({ label, value, tone, bold }: { label: string; value: string; tone?: "emerald"; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 last:border-b-0">
      <span className="text-sm text-zinc-600">{label}</span>
      <span
        className={`text-sm tabular-nums ${bold ? "font-bold text-zinc-900" : tone === "emerald" ? "font-bold text-emerald-700" : "text-zinc-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SuccessStep({ recipient, amount, balance }: { recipient: Contact; amount: number; balance: number }) {
  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-100 p-7 text-center">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />

        <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />
        </div>

        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-extrabold">Money sent</div>
          <div className="font-display text-4xl font-bold text-zinc-900 mt-2 tabular-nums">{fmt(amount)}</div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1.5">
            <span className={`grid h-6 w-6 place-items-center rounded-full font-display text-[10px] font-bold ${TONE_MAP[recipient.tone]}`}>
              {recipient.initials}
            </span>
            <span className="text-sm font-bold">{recipient.name}</span>
          </div>
          <p className="text-sm text-zinc-500 mt-3">They'll get a notification instantly.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white border border-zinc-200 p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">New balance</div>
          <div className="font-display text-xl font-bold tabular-nums mt-0.5">{fmt(balance)}</div>
        </div>
        <PiWalletDuotone className="h-10 w-10 text-[var(--brand-clay)]" />
      </div>

      <div className="mt-6 space-y-2">
        <Link
          to="/wallet"
          className="w-full h-13 flex items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition py-3.5"
        >
          Back to wallet
        </Link>
        <Link
          to="/wallet/send"
          className="w-full h-13 flex items-center justify-center gap-2 rounded-2xl bg-white border border-zinc-200 text-zinc-900 font-bold hover:bg-zinc-50 transition py-3.5"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          <SendIcon className="h-4 w-4" /> Send again
        </Link>
      </div>
    </div>
  );
}

function AddContactSheet({
  name,
  handle,
  setName,
  setHandle,
  onClose,
  onSave,
}: {
  name: string;
  handle: string;
  setName: (v: string) => void;
  setHandle: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--brand-clay)] font-bold">Add contact</div>
            <div className="font-display text-xl font-bold">New recipient</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full font-display text-lg font-bold bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]">
            {name ? initialsOf(name) : "?"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{name || "New contact"}</div>
            <div className="text-[11px] text-zinc-500 truncate">{handle || "@handle"}</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="h-12 rounded-2xl"
          />
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle or phone (optional)"
            className="h-12 rounded-2xl"
          />
        </div>

        <button
          onClick={onSave}
          disabled={!name.trim()}
          className={`mt-5 w-full h-12 rounded-2xl font-bold transition ${
            name.trim() ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-200 text-zinc-400"
          }`}
        >
          Save & continue
        </button>
      </div>
    </div>
  );
}
