import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleShell } from "@/components/naija/RoleShell";
import { ArrowRight, Calendar, ChevronRight, Sparkles, Search, X, Trash2, Utensils, Star, MapPin } from "lucide-react";
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
  PiChefHatDuotone,
} from "react-icons/pi";
import { toast } from "sonner";
import { loadWallet, addWalletTxn } from "@/lib/wallet";
import { useCountry } from "@/hooks/useCountry";

export const Route = createFileRoute("/_authenticated/book")({
  component: BookPage,
});

type BookTab = "planner" | "chef";

/**
 * The Book page is two experiences in one: the weekly Meal Planner, and
 * Book a Chef — hiring a chef by the hour for an event or occasion.
 */
function BookPage() {
  const [tab, setTab] = useState<BookTab>("planner");

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/25">
            {tab === "planner" ? <Calendar className="h-5 w-5" /> : <PiChefHatDuotone className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-clay)] font-extrabold">
              {tab === "planner" ? "Meal planner" : "Book a chef"}
            </div>
            <div className="text-sm font-bold truncate text-zinc-900">
              {tab === "planner" ? "Book your week" : "Chefs for your occasion"}
            </div>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl pt-3 px-3 sm:px-4">
        <div className="flex rounded-full bg-zinc-100 p-1 shadow-inner">
          {(
            [
              { id: "planner", label: "Meal Planner", Icon: Calendar },
              { id: "chef", label: "Book a Chef", Icon: PiChefHatDuotone },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all duration-300 ${
                tab === t.id
                  ? "bg-white text-zinc-900 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.15)]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <t.Icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "planner" ? <MealPlannerSection /> : <BookChefSection />}
    </RoleShell>
  );
}

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

/**
 * Latest hour (24h) at which each meal slot can still be booked for TODAY.
 * Past-cutoff slots are hidden from today's card entirely so customers
 * don't try to book food they can't realistically receive on time.
 */
const CUTOFF_HOUR: Record<MealId, number> = {
  breakfast: 11, // 11:00 AM
  lunch: 16,     // 4:00 PM
  dinner: 22,    // 10:00 PM
};

function isMealBookableForToday(mealId: MealId, now: Date): boolean {
  return now.getHours() < CUTOFF_HOUR[mealId];
}

/**
 * Real menu item as fetched from Supabase, decorated with the vendor and
 * a computed match score against a meal type (breakfast / lunch / dinner).
 * We compute the score client-side so vendors don't have to tag their items
 * perfectly — a category called "Breakfast" or an item named "Jollof lunch"
 * still surfaces in the right slot.
 */
type VendorMenuItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency: string;
  tags: string[] | null;
  meal_times: string[];
  vendor: { name: string; slug: string; type: string | null };
  category_name: string | null;
};

type PickedItem = {
  id: string;
  name: string;
  sub: string;            // vendor label / description
  price: number;
  imageUrl: string | null;
  currency: string;
  vendorName: string;
  vendorSlug: string;
};

type PlanState = Record<string, PickedItem[]>;

/**
 * Rank a menu item by how strongly it matches a meal type:
 *   4 → the vendor explicitly assigned this meal time on the item
 *   3 → item tagged with the meal id
 *   2 → its category name contains the meal id (e.g. "Breakfast menu")
 *   1 → its name or description mentions the meal id
 *   0 → no link; only shown when the vendor didn't assign any meal times
 */
function scoreForMeal(item: VendorMenuItem, meal: MealId): number {
  if (item.meal_times.includes(meal)) return 4;
  const tags = (item.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes(meal)) return 3;
  const cat = (item.category_name ?? "").toLowerCase();
  if (cat.includes(meal)) return 2;
  const blob = `${item.name} ${item.description ?? ""}`.toLowerCase();
  if (blob.includes(meal)) return 1;
  return 0;
}

/**
 * The vendor's own meal-time assignment is authoritative: a dish tagged only
 * "dinner" never appears in the Breakfast picker. Untagged dishes (legacy or
 * "any time") stay visible everywhere.
 */
function servedAtMeal(item: VendorMenuItem, meal: MealId): boolean {
  return item.meal_times.length === 0 || item.meal_times.includes(meal);
}

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

function MealPlannerSection() {
  const [weekOffset, setWeekOffset] = useState(() => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isPastDinner = now.getHours() >= 22; // 22 is dinner cutoff
    // If it's Sunday and dinner cutoff has passed, there are no bookable slots left this week.
    // Default to the next week.
    if (isSunday && isPastDinner) return 1;
    return 0;
  });
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

  const [confirming, setConfirming] = useState(false);
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
      setConfirming(false);
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
    <>
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl pt-5 px-3 sm:px-4 pb-8">
        <h1 className="hidden lg:block font-display text-2xl font-bold tracking-tight mb-5">Meal planner</h1>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-7 text-white shadow-[0_16px_40px_-20px_rgba(255,77,77,0.4)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3 text-[var(--brand-gold)]" /> Chef-prepared
              </div>
              <h1 className="font-display text-xl sm:text-4xl font-bold tracking-tight mt-2 leading-[1.05]">
                Plan the whole week.<br />Eat without thinking.
              </h1>
              <p className="mt-2 text-xs sm:text-[15px] text-white/80 max-w-md leading-relaxed">
                Add meals to breakfast, lunch, and dinner slots.
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
            // For today, drop any meal slot whose booking window has already
            // passed. Other days show the full three-slot layout.
            const now = new Date();
            const mealsForDay = isToday
              ? MEALS.filter((m) => isMealBookableForToday(m.id, now))
              : MEALS;
            const dayItems = mealsForDay.map((m) => plan[keyFor(date, m.id)] ?? []);
            const dayCount = dayItems.reduce((n, arr) => n + arr.length, 0);
            const hiddenTodayMealCount = isToday ? MEALS.length - mealsForDay.length : 0;

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

                  {mealsForDay.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
                      <p className="text-xs text-muted-foreground font-semibold">
                        All meal windows for today have passed — book for tomorrow.
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`mt-5 grid gap-2.5 sm:gap-3 grid-cols-1 ${
                        mealsForDay.length === 1
                          ? "sm:grid-cols-1"
                          : mealsForDay.length === 2
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-3"
                      }`}
                    >
                      {mealsForDay.map((meal, mIdx) => (
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
                  )}
                  {hiddenTodayMealCount > 0 && mealsForDay.length > 0 && (
                    <p className="mt-3 text-[11px] text-muted-foreground font-semibold text-center">
                      {hiddenTodayMealCount} meal window{hiddenTodayMealCount > 1 ? "s" : ""} for today already closed
                    </p>
                  )}
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
              onClick={() => {
                if (totalPrice <= 0) {
                  toast.error("Add some meals first");
                  return;
                }
                setConfirming(true);
              }}
              disabled={paying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-clay)] text-white px-8 py-3.5 text-[15px] font-bold shadow-lg shadow-[var(--brand-clay)]/30 hover:scale-105 active:scale-95 transition disabled:opacity-70 disabled:hover:scale-100"
            >
              Pay Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-6 flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shrink-0">
              <PiCookingPotDuotone className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground">Need a hand planning?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us your dietary preferences and we'll auto-fill your week with rotating menus.
              </p>
              <Link
                to="/xora"
                search={{ intent: "meal-plan" }}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white px-4 py-2 text-sm font-bold shadow-md shadow-[var(--brand-clay)]/25 hover:shadow-lg transition"
              >
                <Sparkles className="h-4 w-4" />
                Build my week with Xora
                <ArrowRight className="h-4 w-4" />
              </Link>
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
      {confirming && (
        <PaymentConfirmationModal
          plan={plan}
          totalPrice={totalPrice}
          onConfirm={handlePay}
          onCancel={() => setConfirming(false)}
          paying={paying}
        />
      )}
    </>
  );
}

function PaymentConfirmationModal({
  plan,
  totalPrice,
  onConfirm,
  onCancel,
  paying,
}: {
  plan: PlanState;
  totalPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
  paying: boolean;
}) {
  const items = Object.entries(plan).flatMap(([key, list]) =>
    list.map((item) => {
      // key is like "Sun Jul 12 2026::dinner"
      const [datePart, mealPart] = key.split("::");
      // convert datePart like "Sun Jul 12 2026" to "Sun, Jul 12"
      const d = new Date(datePart);
      const dayStr = isNaN(d.getTime())
        ? datePart
        : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const mealStr = mealPart ? mealPart.charAt(0).toUpperCase() + mealPart.slice(1) : "";
      return { ...item, slot: `${dayStr} · ${mealStr}` };
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={paying ? undefined : onCancel} />
      <div className="relative w-full sm:max-w-md max-h-[85dvh] bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="font-display text-xl font-bold text-foreground">Confirm your order</h2>
          <p className="text-sm text-muted-foreground mt-1">Review your meals before paying</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <ul className="space-y-4">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.vendorName}</div>
                  <div className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-clay)] bg-[var(--brand-clay)]/10 px-1.5 py-0.5 rounded">
                    {item.slot}
                  </div>
                </div>
                <div className="font-bold text-foreground shrink-0 mt-0.5">
                  {item.currency === "GBP" ? "£" : "₦"}{item.price.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span className="text-[var(--brand-clay)]">₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-4 sm:p-5 border-t border-border bg-white flex gap-3">
          <button
            onClick={onCancel}
            disabled={paying}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={paying}
            className="flex-1 rounded-full bg-[var(--brand-clay)] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {paying ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
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
          {items.map((it) => {
            const symbol = it.currency === "GBP" ? "£" : "₦";
            return (
            <li key={it.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <span className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-black/5 grid place-items-center">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <Utensils className="h-4 w-4 text-zinc-400" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 truncate">{it.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {it.vendorName ? `${it.vendorName} · ` : ""}
                  <span className="tabular-nums">{symbol}{it.price.toLocaleString()}</span>
                </div>
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
            );
          })}
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

  // Live catalogue — every available item from every approved vendor.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["book-catalogue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select(
          "id, name, description, image_url, price, currency, tags, meal_times, is_available, vendors!inner(name, slug, status, type), menu_categories(name)",
        )
        .eq("is_available", true)
        .eq("vendors.status", "approved")
        .order("is_featured", { ascending: false })
        .limit(400);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        image_url: row.image_url,
        price: Number(row.price),
        currency: row.currency,
        tags: row.tags,
        meal_times: (row.meal_times as string[] | null) ?? [],
        vendor: {
          name: row.vendors?.name ?? "",
          slug: row.vendors?.slug ?? "",
          type: row.vendors?.type ?? null,
        },
        category_name: row.menu_categories?.name ?? null,
      })) as VendorMenuItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Vendors assign meal times to each dish; the picker only shows dishes the
  // vendor serves at this slot (untagged dishes count as "any time"). Within
  // that, stronger matches float to the top.
  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withScore = items
      .filter((it) => servedAtMeal(it, meal.id))
      .map((it) => ({ item: it, score: scoreForMeal(it, meal.id) }));
    const searched = q
      ? withScore.filter(({ item }) =>
          (item.name + " " + (item.description ?? "") + " " + item.vendor.name)
            .toLowerCase()
            .includes(q),
        )
      : withScore;
    // Sort: strongest meal match first, then alphabetical.
    return searched
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map((r) => r.item);
  }, [items, meal.id, query]);

  const currencySymbol = (c: string) => (c === "GBP" ? "£" : "₦");

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
      <div className="relative w-full sm:max-w-lg max-h-[85dvh] bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        {/* Drag handle — gives a mobile sheet feel and visually separates the header from the viewport edge */}
        <div className="sm:hidden pt-3 pb-2 grid place-items-center shrink-0">
          <span className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        {/* Header — the "Add to {meal}" title sits comfortably on its own row */}
        <div className={`relative overflow-hidden px-4 sm:px-5 pt-4 pb-4 sm:pt-5 sm:pb-5 ${meal.bg} border-b border-black/5 shrink-0`}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-zinc-800 shadow-sm shrink-0">
              <meal.Icon className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] sm:text-[11px] uppercase tracking-widest font-bold ${meal.chipTone.replace("bg-", "text-").split(" ")[1]}`}>
                {meal.time} · {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className="font-display text-lg sm:text-xl font-bold text-zinc-900 leading-snug mt-0.5">
                Add to {meal.label}
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
        </div>

        {/* Search — its own strip directly below the header, sticky so it stays visible while scrolling */}
        <div className="px-4 sm:px-5 py-3 bg-card border-b border-border shadow-[0_2px_10px_-6px_rgba(0,0,0,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any dish, chef, or restaurant"
              className="w-full h-11 rounded-2xl border border-border bg-muted/40 pl-11 pr-10 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/20 transition"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="w-full flex items-center gap-3 rounded-2xl p-3 bg-white border border-border animate-pulse">
                  <span className="h-14 w-14 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-muted rounded-full" />
                    <div className="h-2.5 w-1/2 bg-muted/70 rounded-full" />
                    <div className="h-3 w-16 bg-muted rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : ranked.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <PiCookingPotDuotone className="h-10 w-10 mx-auto text-zinc-300" />
              <p className="mt-2 font-semibold text-zinc-700">
                {query ? "Nothing matches" : "No dishes available yet"}
              </p>
              <p className="text-xs mt-1">
                {query
                  ? "Try a different search or clear it to see everything."
                  : "Come back soon — chefs are still adding their menus."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {ranked.map((item) => {
                const already = picked.some((p) => p.id === item.id);
                const symbol = currencySymbol(item.currency);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onAdd({
                          id: item.id,
                          name: item.name,
                          sub: item.vendor.name || item.description || "",
                          price: item.price,
                          imageUrl: item.image_url,
                          currency: item.currency,
                          vendorName: item.vendor.name,
                          vendorSlug: item.vendor.slug,
                        })
                      }
                      disabled={already}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                        already
                          ? "bg-emerald-50 border border-emerald-200 cursor-default"
                          : "bg-white border border-border hover:border-[var(--brand-clay)]/40 hover:shadow-md active:scale-[0.99]"
                      }`}
                    >
                      <span className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-muted ring-1 ring-black/5 grid place-items-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Utensils className="h-6 w-6 text-zinc-400" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-zinc-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.vendor.name}
                          {item.category_name ? ` · ${item.category_name}` : ""}
                        </div>
                        <div className="text-xs font-bold text-[var(--brand-clay)] tabular-nums mt-0.5">
                          {symbol}{item.price.toLocaleString()}
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

/* ───────────────────────────── Book a Chef ───────────────────────────── */

type EventChef = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  rating: number | null;
  currency: string;
  hourly_rate: number;
  event_services: string | null;
  tagline: string | null;
};

function BookChefSection() {
  const [country] = useCountry();
  const [booking, setBooking] = useState<EventChef | null>(null);

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ["event-chefs", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, slug, city, cover_image_url, logo_url, rating, currency, hourly_rate, event_services, tagline")
        .eq("type", "chef")
        .eq("status", "approved")
        .eq("country", country)
        .not("hourly_rate", "is", null)
        .order("rating", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({ ...c, hourly_rate: Number(c.hourly_rate) })) as EventChef[];
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl lg:max-w-4xl pt-5 px-3 sm:px-4 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-4 sm:p-7 text-white shadow-[0_16px_40px_-20px_rgba(255,77,77,0.4)] bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.85_0.17_90/0.4),transparent_55%),linear-gradient(150deg,#14100a,#2d2010_55%,#7c5210)]">
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--brand-gold)]/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
            <PiChefHatDuotone className="h-3.5 w-3.5 text-[var(--brand-gold)]" /> Private chefs, by the hour
          </div>
          <h1 className="font-display text-xl sm:text-4xl font-bold tracking-tight mt-2 leading-[1.05]">
            A chef for your party,<br />owambe, or quiet dinner.
          </h1>
          <p className="mt-2 text-xs sm:text-[15px] text-white/80 max-w-md leading-relaxed">
            Pick a chef, choose your date and hours, and they cook right where the occasion is.
          </p>
        </div>
      </div>

      {/* Chef grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] rounded-3xl bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : chefs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <PiChefHatDuotone className="h-10 w-10 mx-auto text-zinc-300" />
            <p className="mt-2 font-semibold text-zinc-700">No chefs are taking event bookings yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chefs appear here once they publish an hourly rate. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {chefs.map((chef) => {
              const symbol = chef.currency === "GBP" ? "£" : "₦";
              return (
                <div key={chef.id} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.05] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] transition hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.22)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                    {chef.cover_image_url ? (
                      <img src={chef.cover_image_url} alt={chef.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-zinc-300">
                        <PiChefHatDuotone className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold shadow-md">
                      {symbol}{chef.hourly_rate.toLocaleString()}<span className="text-zinc-500 font-semibold">/hr</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-zinc-900 truncate">{chef.name}</h3>
                      {chef.rating != null && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 shrink-0">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(chef.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                      {chef.city && (
                        <>
                          <MapPin className="h-3 w-3" /> {chef.city}
                        </>
                      )}
                    </div>
                    {(chef.event_services || chef.tagline) && (
                      <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{chef.event_services || chef.tagline}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setBooking(chef)}
                      className="mt-3.5 w-full rounded-full bg-[var(--brand-clay)] py-2.5 text-sm font-bold text-white shadow-md shadow-[var(--brand-clay)]/25 transition hover:scale-[1.02] active:scale-95"
                    >
                      Book {chef.name.split(" ")[0]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MyChefBookings />

      {booking && <ChefBookingModal chef={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}

function ChefBookingModal({ chef, onClose }: { chef: EventChef; onClose: () => void }) {
  const qc = useQueryClient();
  const symbol = chef.currency === "GBP" ? "£" : "₦";
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [hours, setHours] = useState(3);
  const [guests, setGuests] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = Math.max(0, hours) * chef.hourly_rate;
  const minDate = new Date().toISOString().split("T")[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) return void toast.error("Pick a date for your event");
    if (hours <= 0) return void toast.error("How many hours do you need the chef?");
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("chef_bookings").insert({
        customer_id: uid,
        chef_id: chef.id,
        event_date: eventDate,
        start_time: startTime || null,
        hours,
        guests: guests ? Number(guests) : null,
        note: note.trim() || null,
        currency: chef.currency,
        hourly_rate: chef.hourly_rate,
        total,
      });
      if (error) throw error;
      toast.success(`Request sent — ${chef.name} will confirm your booking`);
      qc.invalidateQueries({ queryKey: ["my-chef-bookings"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="p-5 border-b border-border flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shrink-0">
            <PiChefHatDuotone className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold truncate">Book {chef.name}</div>
            <div className="text-xs text-muted-foreground">
              {symbol}{chef.hourly_rate.toLocaleString()}/hour{chef.city ? ` · ${chef.city}` : ""}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-zinc-200 transition shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground mb-1 block">Event date</span>
              <input type="date" required min={minDate} value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground mb-1 block">Start time</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground mb-1 block">Hours needed</span>
              <input type="number" min={1} max={24} required value={hours || ""} onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground mb-1 block">Guests (approx.)</span>
              <input type="number" min={1} placeholder="e.g. 25" value={guests} onChange={(e) => setGuests(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground mb-1 block">Tell the chef about your occasion</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="e.g. Birthday party — we'd love a live jollof station and small chops"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none" />
          </label>

          <div className="rounded-2xl bg-muted/50 p-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-bold">Estimated total</div>
              <div className="text-xs text-muted-foreground">
                {hours || 0} hr{hours === 1 ? "" : "s"} × {symbol}{chef.hourly_rate.toLocaleString()}
              </div>
            </div>
            <div className="font-display text-2xl font-extrabold tabular-nums">
              {symbol}{total.toLocaleString()}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--brand-clay)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--brand-clay)]/30 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {submitting ? "Sending request…" : "Send booking request"}
          </button>
          <p className="text-[11px] text-center text-muted-foreground">
            The chef confirms first — you'll only pay once your booking is accepted.
          </p>
        </div>
      </form>
    </div>
  );
}

function MyChefBookings() {
  const qc = useQueryClient();
  const { data: bookings = [] } = useQuery({
    queryKey: ["my-chef-bookings"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("chef_bookings")
        .select("*, vendors:chef_id(name, logo_url)")
        .eq("customer_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase.from("chef_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Booking cancelled");
    qc.invalidateQueries({ queryKey: ["my-chef-bookings"] });
  };

  if (bookings.length === 0) return null;

  const statusCls: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-zinc-100 text-zinc-600",
  };

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-zinc-900 mb-3">My chef bookings</h2>
      <div className="space-y-3">
        {bookings.map((b: any) => {
          const symbol = b.currency === "GBP" ? "£" : "₦";
          return (
            <div key={b.id} className="rounded-2xl bg-white ring-1 ring-black/[0.05] p-4 flex items-center gap-3">
              <span className="h-11 w-11 shrink-0 rounded-2xl overflow-hidden bg-muted grid place-items-center">
                {b.vendors?.logo_url ? (
                  <img src={b.vendors.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PiChefHatDuotone className="h-6 w-6 text-zinc-400" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{b.vendors?.name ?? "Chef"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(b.event_date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
                  {b.start_time ? ` · ${b.start_time}` : ""} · {Number(b.hours)} hr{Number(b.hours) > 1 ? "s" : ""} · {symbol}{Number(b.total).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusCls[b.status] ?? "bg-muted"}`}>
                  {b.status}
                </span>
                {b.status === "pending" && (
                  <button type="button" onClick={() => cancel(b.id)} className="text-[11px] font-semibold text-zinc-400 hover:text-red-600 transition">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
