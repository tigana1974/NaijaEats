import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RoleShell } from "@/components/naija/RoleShell";
import { ArrowRight, Calendar, ChevronRight, Sparkles, Search, X, Trash2 } from "lucide-react";
import { IoFlame } from "react-icons/io5";
import {
  PiCoffeeDuotone,
  PiForkKnifeDuotone,
  PiMoonStarsDuotone,
  PiCookingPotDuotone,
  PiConfettiDuotone,
  PiClockDuotone,
  PiCheckCircleDuotone,
  PiPlusCircleDuotone,
  PiWalletDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { loadWallet, addWalletTxn } from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/book")({
  component: MealPlannerPage,
});

type MealId = "breakfast" | "lunch" | "dinner";

type Meal = {
  id: MealId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  time: string;
  tone: string;
  chipTone: string;
  bg: string;
  suggestion: string;
};

const MEALS: Meal[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    Icon: PiCoffeeDuotone,
    time: "7:00 AM",
    tone: "from-amber-50 to-orange-50",
    chipTone: "bg-amber-100 text-amber-700",
    bg: "bg-amber-50",
    suggestion: "Akara & pap · Boli",
  },
  {
    id: "lunch",
    label: "Lunch",
    Icon: PiForkKnifeDuotone,
    time: "1:00 PM",
    tone: "from-rose-50 to-pink-50",
    chipTone: "bg-rose-100 text-rose-700",
    bg: "bg-rose-50",
    suggestion: "Jollof rice · Amala",
  },
  {
    id: "dinner",
    label: "Dinner",
    Icon: PiMoonStarsDuotone,
    time: "7:00 PM",
    tone: "from-indigo-50 to-purple-50",
    chipTone: "bg-indigo-100 text-indigo-700",
    bg: "bg-indigo-50",
    suggestion: "Egusi soup · Pepper soup",
  },
];

/** Suggestions per meal slot — swap for a Supabase-driven catalogue later. */
const SUGGESTIONS: Record<MealId, { id: string; name: string; sub: string; emoji: string; price: number }[]> = {
  breakfast: [
    { id: "b1", name: "Akara & pap", sub: "Bean cakes with corn porridge", emoji: "🍯", price: 1800 },
    { id: "b2", name: "Boli & fish", sub: "Roasted plantain with grilled fish", emoji: "🍌", price: 2400 },
    { id: "b3", name: "Moi moi", sub: "Steamed bean pudding", emoji: "🫘", price: 1500 },
    { id: "b4", name: "Yam & egg sauce", sub: "Boiled yam with pepper egg sauce", emoji: "🍳", price: 2000 },
    { id: "b5", name: "Bread & tea", sub: "Fresh bread with Milo or Lipton", emoji: "🍞", price: 900 },
    { id: "b6", name: "Ogi & akara", sub: "Traditional pap combo", emoji: "🥣", price: 1400 },
  ],
  lunch: [
    { id: "l1", name: "Jollof rice & chicken", sub: "Party-style with grilled chicken", emoji: "🍚", price: 3500 },
    { id: "l2", name: "Amala & ewedu", sub: "Yam flour with jute soup", emoji: "🥘", price: 3200 },
    { id: "l3", name: "Egusi soup & fufu", sub: "Melon seed soup with pounded yam", emoji: "🍲", price: 3800 },
    { id: "l4", name: "Ofada rice", sub: "Local rice with ayamashe stew", emoji: "🌾", price: 3600 },
    { id: "l5", name: "Fried rice combo", sub: "With plantain and beef", emoji: "🍛", price: 3400 },
    { id: "l6", name: "Suya wrap", sub: "Spicy beef with fresh salad", emoji: "🌯", price: 2800 },
  ],
  dinner: [
    { id: "d1", name: "Pepper soup", sub: "Catfish or goat pepper soup", emoji: "🌶️", price: 3900 },
    { id: "d2", name: "Nkwobi", sub: "Spicy cow foot delicacy", emoji: "🥩", price: 4200 },
    { id: "d3", name: "Isi ewu", sub: "Spiced goat head", emoji: "🐐", price: 4500 },
    { id: "d4", name: "Grilled tilapia", sub: "With plantain & pepper sauce", emoji: "🐟", price: 4800 },
    { id: "d5", name: "Ewa agoyin", sub: "Mashed beans with pepper stew", emoji: "🫘", price: 2800 },
    { id: "d6", name: "Suya platter", sub: "Assorted spicy grilled meat", emoji: "🥙", price: 4000 },
  ],
};

type PickedItem = { id: string; name: string; emoji: string; price: number };
type PlanState = Record<string, PickedItem[]>;

const STORAGE_KEY = "naijaeats.mealplan.v1";

function loadPlan(): PlanState {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && typeof raw === "object") return raw as PlanState;
  } catch {
    // ignore
  }
  return {};
}

function savePlan(p: PlanState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function getWeekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function keyFor(d: Date, m: MealId) {
  return `${d.toDateString()}::${m}`;
}

function MealPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const [plan, setPlan] = useState<PlanState>(() => loadPlan());
  const [picker, setPicker] = useState<{ date: Date; meal: Meal } | null>(null);

  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const totalPlanned = Object.values(plan).reduce((n, arr) => n + (arr?.length ?? 0), 0);
  const totalPrice = Object.values(plan).reduce(
    (sum, arr) => sum + (arr?.reduce((s, item) => s + item.price, 0) ?? 0),
    0
  );

  const daysWithFullMeals = week.filter((d) =>
    MEALS.every((m) => (plan[keyFor(d, m.id)]?.length ?? 0) > 0),
  ).length;
  const progress = daysWithFullMeals / 7;

  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (totalPrice <= 0) {
      toast.error("Add some meals first");
      return;
    }
    setPaying(true);
    try {
      const w = loadWallet();
      if (!w || w.balance < totalPrice) {
        toast.error("Insufficient wallet balance");
        return;
      }
      addWalletTxn({
        amount: -totalPrice,
        type: "order",
        title: "Weekly Meal Plan",
        note: `Paid for ${totalPlanned} meals`,
      });
      toast.success("Payment successful! Your meals are booked.");
      setPlan({});
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const weekLabel = `${week[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${week[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const addItem = (date: Date, meal: MealId, item: PickedItem) => {
    setPlan((prev) => {
      const k = keyFor(date, meal);
      const list = prev[k] ?? [];
      if (list.some((i) => i.id === item.id)) {
        toast.info(`${item.name} is already in this slot`);
        return prev;
      }
      toast.success(`Added ${item.name}`);
      return { ...prev, [k]: [...list, item] };
    });
  };

  const removeItem = (date: Date, meal: MealId, itemId: string) => {
    setPlan((prev) => {
      const k = keyFor(date, meal);
      const list = (prev[k] ?? []).filter((i) => i.id !== itemId);
      const next = { ...prev };
      if (list.length === 0) delete next[k];
      else next[k] = list;
      return next;
    });
  };

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/25">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-clay)] font-extrabold">Meal planner</div>
            <div className="text-sm font-bold truncate text-zinc-900">Book your week</div>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl pt-4 px-2 sm:px-4 pb-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] p-5 sm:p-7 text-white shadow-[0_24px_60px_-24px_rgba(255,77,77,0.45)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3 text-[var(--brand-gold)]" /> Chef-prepared, home-delivered
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mt-3 leading-[1.05]">
                Plan the whole week.<br />Eat without thinking.
              </h1>
              <p className="mt-3 text-sm sm:text-[15px] text-white/80 max-w-md leading-relaxed">
                Add meals to breakfast, lunch, and dinner slots. We deliver on time — every time.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Meals</div>
                <div className="font-display text-2xl font-semibold tabular-nums leading-none mt-0.5">
                  {totalPlanned}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="h-2 rounded-full bg-white/12 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-gold)] to-white transition-all duration-500"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/70 gap-2">
              <span className="truncate">
                {daysWithFullMeals === 7 ? "🎉 Full week complete" : `${daysWithFullMeals}/7 days fully planned`}
              </span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <PiConfettiDuotone className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                Full week = 15% off
              </span>
            </div>
          </div>
        </div>

        {/* Week navigator */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setWeekOffset((v) => v - 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 hover:bg-zinc-50 transition"
            aria-label="Previous week"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Week of</div>
            <div className="text-sm font-bold text-zinc-900">{weekLabel}</div>
          </div>
          <button
            onClick={() => setWeekOffset((v) => v + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 hover:bg-zinc-50 transition"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days */}
        <div className="mt-5 space-y-4">
          {week.map((date, idx) => {
            const isToday = date.getTime() === todayTime;
            const isPast = date.getTime() < todayTime;
            const dayItems = MEALS.map((m) => plan[keyFor(date, m.id)] ?? []);
            const dayCount = dayItems.reduce((n, arr) => n + arr.length, 0);

            return (
              <div
                key={date.toISOString()}
                className={`relative rounded-[1.75rem] bg-white shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 transition-all duration-300 ${
                  isToday
                    ? "ring-[var(--brand-clay)]/25 shadow-[0_18px_50px_-20px_rgba(255,77,77,0.28)]"
                    : "ring-black/[0.04]"
                } ${isPast ? "opacity-60" : ""}`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div
                        className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-2xl font-display font-extrabold leading-none shrink-0 ${
                          isToday
                            ? "bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/30"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-widest opacity-80 mb-0.5">
                          {DAY_NAMES[idx]}
                        </span>
                        <span className="text-lg">{date.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2 flex-wrap">
                          <span className="truncate">{DAY_FULL[idx]}</span>
                          {isToday && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                              <IoFlame className="h-3 w-3 text-amber-500" /> Today
                            </span>
                          )}
                          {isPast && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Past
                            </span>
                          )}
                        </h2>
                        <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                          {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <MealsPlannedBadge count={dayCount} />
                  </div>

                  <div className="mt-5 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-3">
                    {MEALS.map((meal, mIdx) => (
                      <MealSlot
                        key={meal.id}
                        meal={meal}
                        items={dayItems[mIdx]}
                        disabled={isPast}
                        onOpen={() => setPicker({ date, meal })}
                        onRemove={(id) => removeItem(date, meal.id, id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom prompt */}
        {totalPrice > 0 ? (
          <div className="mt-8 rounded-3xl border border-[var(--brand-clay)]/20 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_8px_30px_-12px_rgba(217,75,58,0.2)]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shrink-0">
                <PiWalletDuotone className="h-6 w-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">Checkout</div>
                <h3 className="font-display text-2xl font-bold text-zinc-900 leading-tight">
                  ₦{totalPrice.toLocaleString()}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  For {totalPlanned} meals this week. Money will be deducted from your wallet.
                </p>
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-8 py-3.5 text-[15px] font-bold shadow-lg shadow-[var(--brand-clay)]/30 hover:scale-105 active:scale-95 transition disabled:opacity-70 disabled:hover:scale-100"
            >
              {paying ? "Processing..." : "Pay Now"}
              {!paying && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-zinc-200 bg-white p-6 flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shrink-0">
              <PiCookingPotDuotone className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base sm:text-lg font-bold text-zinc-900">Need a hand planning?</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Tell us your dietary preferences and we'll auto-fill your week with rotating menus.
              </p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-4 py-2 text-sm font-bold hover:bg-zinc-800 transition">
                Build my week
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {picker && (
        <MealPickerSheet
          date={picker.date}
          meal={picker.meal}
          picked={plan[keyFor(picker.date, picker.meal.id)] ?? []}
          onAdd={(item) => addItem(picker.date, picker.meal.id, item)}
          onClose={() => setPicker(null)}
        />
      )}
    </RoleShell>
  );
}

function MealsPlannedBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-zinc-100 text-zinc-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
        <PiClockDuotone className="h-3.5 w-3.5" /> Open
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shrink-0">
      <PiCheckCircleDuotone className="h-3.5 w-3.5" />
      {count} planned
    </span>
  );
}

function MealSlot({
  meal,
  items,
  disabled,
  onOpen,
  onRemove,
}: {
  meal: Meal;
  items: PickedItem[];
  disabled?: boolean;
  onOpen: () => void;
  onRemove: (id: string) => void;
}) {
  const hasItems = items.length > 0;
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 flex flex-col ${
        hasItems
          ? "bg-white border-emerald-200 shadow-[0_8px_20px_-12px_rgba(16,185,129,0.35)]"
          : `bg-gradient-to-br ${meal.tone} border-zinc-100`
      } ${disabled ? "opacity-70" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 shadow-sm ${
            hasItems ? "bg-emerald-500 text-white" : "bg-white text-zinc-800"
          }`}
        >
          {hasItems ? <PiCheckCircleDuotone className="h-6 w-6" /> : <meal.Icon className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-zinc-900">{meal.label}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 ${meal.chipTone}`}>
              {meal.time}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
            {hasItems ? `${items.length} item${items.length === 1 ? "" : "s"}` : meal.suggestion}
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Add ${meal.label.toLowerCase()}`}
            className={`grid h-9 w-9 place-items-center rounded-full shrink-0 transition-all ${
              hasItems
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-white text-zinc-700 shadow-sm hover:scale-105"
            }`}
          >
            <PiPlusCircleDuotone className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Picked items */}
      {hasItems && (
        <ul className="border-t border-emerald-100 divide-y divide-emerald-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 px-3.5 py-2.5">
              <span className="text-lg shrink-0">{it.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 truncate">{it.name}</div>
                <div className="text-[10px] text-zinc-500 tabular-nums">₦{it.price.toLocaleString()}</div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  aria-label="Remove"
                  className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MealPickerSheet({
  date,
  meal,
  picked,
  onAdd,
  onClose,
}: {
  date: Date;
  meal: Meal;
  picked: PickedItem[];
  onAdd: (item: PickedItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const options = SUGGESTIONS[meal.id];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.name + " " + o.sub).toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[85dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className={`relative overflow-hidden p-5 ${meal.bg} border-b border-black/5`}>
          <div className="flex items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-white text-zinc-800 shadow-sm`}>
              <meal.Icon className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] uppercase tracking-widest font-bold ${meal.chipTone.replace("bg-", "text-").split(" ")[1]}`}>
                Add to {meal.label}
              </div>
              <div className="font-display text-lg font-bold text-zinc-900 truncate">
                {date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} · {meal.time}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full bg-white hover:bg-zinc-100 transition shadow-sm shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${meal.label.toLowerCase()} dishes`}
              className="w-full h-11 rounded-2xl border border-black/5 bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/15 transition shadow-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <PiCookingPotDuotone className="h-10 w-10 mx-auto text-zinc-300" />
              <p className="mt-2 font-semibold text-zinc-700">Nothing matches</p>
              <p className="text-xs mt-1">Try a different search.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => {
                const already = picked.some((p) => p.id === item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      disabled={already}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                        already
                          ? "bg-emerald-50 border border-emerald-200 cursor-default"
                          : "bg-white border border-border hover:border-[var(--brand-clay)]/40 hover:shadow-md active:scale-[0.99]"
                      }`}
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-2xl">
                        {item.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-zinc-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{item.sub}</div>
                        <div className="text-xs font-bold text-[var(--brand-clay)] tabular-nums mt-0.5">
                          ₦{item.price.toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                          already
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]"
                        }`}
                      >
                        {already ? <PiCheckCircleDuotone className="h-5 w-5" /> : <PiPlusCircleDuotone className="h-5 w-5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-white flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              In this slot
            </div>
            <div className="text-sm font-bold truncate">
              {picked.length === 0 ? "Nothing yet" : `${picked.length} item${picked.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <Link
            to="/search"
            className="rounded-full bg-zinc-100 text-zinc-800 px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition inline-flex items-center gap-1.5"
          >
            Browse chefs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
