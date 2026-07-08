import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleShell } from "@/components/naija/RoleShell";
import { ArrowRight, Calendar, ChevronRight, Sparkles } from "lucide-react";
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
} from "react-icons/pi";

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
    suggestion: "Akara & pap · Boli",
  },
  {
    id: "lunch",
    label: "Lunch",
    Icon: PiForkKnifeDuotone,
    time: "1:00 PM",
    tone: "from-rose-50 to-pink-50",
    chipTone: "bg-rose-100 text-rose-700",
    suggestion: "Jollof rice · Amala",
  },
  {
    id: "dinner",
    label: "Dinner",
    Icon: PiMoonStarsDuotone,
    time: "7:00 PM",
    tone: "from-indigo-50 to-purple-50",
    chipTone: "bg-indigo-100 text-indigo-700",
    suggestion: "Egusi soup · Pepper soup",
  },
];

function getWeekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun
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

function MealPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  // Track "planned" state in-memory as a UI showcase; real reservations are wired via /search.
  const [planned, setPlanned] = useState<Record<string, boolean>>({});
  const keyFor = (d: Date, m: MealId) => `${d.toDateString()}::${m}`;

  const plannedCount = Object.values(planned).filter(Boolean).length;
  const totalSlots = 21;
  const progress = plannedCount / totalSlots;

  const weekLabel = `${week[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${week[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

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
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-7 text-white shadow-[0_24px_60px_-24px_rgba(255,77,77,0.45)] bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3 text-[var(--brand-gold)]" /> Chef-prepared, home-delivered
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3 leading-[1.05]">
                Plan the whole week.<br />Eat without thinking.
              </h1>
              <p className="mt-3 text-sm sm:text-[15px] text-white/80 max-w-md leading-relaxed">
                Reserve breakfast, lunch, and dinner from real Naija kitchens. We deliver on time — every time.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Progress</div>
                <div className="font-display text-2xl font-semibold tabular-nums leading-none mt-0.5">
                  {plannedCount}
                  <span className="text-white/50 text-base"> / {totalSlots}</span>
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
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
              <span>{plannedCount === 0 ? "Kick off with tonight's dinner" : `${totalSlots - plannedCount} slots to go`}</span>
              <span className="inline-flex items-center gap-1">
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

        {/* Days list */}
        <div className="mt-5 space-y-4">
          {week.map((date, idx) => {
            const isToday = date.getTime() === todayTime;
            const isPast = date.getTime() < todayTime;

            return (
              <div
                key={date.toISOString()}
                className={`relative rounded-[1.75rem] bg-white shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 transition-all duration-300 ${
                  isToday
                    ? "ring-[var(--brand-clay)]/25 shadow-[0_18px_50px_-20px_rgba(255,77,77,0.28)]"
                    : "ring-black/[0.04]"
                } ${isPast ? "opacity-60" : ""}`}
              >
                <div className="p-5 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl font-display font-extrabold leading-none shrink-0 ${
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
                      <div>
                        <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                          {DAY_FULL[idx]}
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

                    {/* Meal count badge */}
                    <MealsPlannedBadge
                      count={MEALS.reduce((n, m) => n + (planned[keyFor(date, m.id)] ? 1 : 0), 0)}
                    />
                  </div>

                  {/* Meal slots */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {MEALS.map((meal) => {
                      const k = keyFor(date, meal.id);
                      const isPlanned = !!planned[k];
                      return (
                        <MealSlot
                          key={meal.id}
                          meal={meal}
                          planned={isPlanned}
                          disabled={isPast}
                          onToggle={() => setPlanned((p) => ({ ...p, [k]: !p[k] }))}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom prompt */}
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-200 bg-white p-6 flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shrink-0">
            <PiCookingPotDuotone className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-zinc-900">Need a hand planning?</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Tell us your dietary preferences and we'll auto-fill your week with rotating menus from top-rated chefs.
            </p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-4 py-2 text-sm font-bold hover:bg-zinc-800 transition">
              Build my week
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
      <PiCheckCircleDuotone className="h-3.5 w-3.5" />
      {count}/3 planned
    </span>
  );
}

function MealSlot({
  meal,
  planned,
  disabled,
  onToggle,
}: {
  meal: Meal;
  planned: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const inner = (
    <div
      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
        planned
          ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
          : `bg-gradient-to-br ${meal.tone} border-zinc-100 hover:border-[var(--brand-clay)]/40 hover:shadow-md`
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 shadow-sm ${
          planned ? "bg-emerald-500 text-white" : "bg-white text-zinc-800"
        }`}
      >
        {planned ? <PiCheckCircleDuotone className="h-6 w-6" /> : <meal.Icon className="h-6 w-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-zinc-900">{meal.label}</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 ${meal.chipTone}`}>
            {meal.time}
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
          {planned ? "Confirmed · you're all set" : meal.suggestion}
        </div>
      </div>
      {!planned && !disabled && (
        <PiPlusCircleDuotone className="h-6 w-6 text-zinc-400 shrink-0" />
      )}
    </div>
  );

  if (planned || disabled) {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="text-left w-full"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to="/search"
      onClick={onToggle}
      className="block group"
    >
      {inner}
    </Link>
  );
}
