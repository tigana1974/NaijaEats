import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/naija/RoleShell";
import { Coffee, Utensils, Moon, ArrowRight, Calendar } from "lucide-react";
import { IoFlame } from "react-icons/io5";

export const Route = createFileRoute("/_authenticated/book")({
  component: MealPlannerPage,
});

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const MEALS = [
  { id: "breakfast", label: "Breakfast", Icon: Coffee, time: "07:00 AM" },
  { id: "lunch", label: "Lunch", Icon: Utensils, time: "01:00 PM" },
  { id: "dinner", label: "Dinner", Icon: Moon, time: "07:00 PM" },
];

function MealPlannerPage() {
  const todayIndex = new Date().getDay() - 1; // 0 = Monday, -1 = Sunday
  const currentDayIndex = todayIndex < 0 ? 6 : todayIndex; // Adjust Sunday to 6

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-clay)] to-[#ff6b35] text-white shadow-lg shadow-[var(--brand-clay)]/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-clay)] font-extrabold">Weekly Planner</div>
            <div className="text-sm font-bold truncate text-zinc-900">Plan your meals</div>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl pt-6 px-2 space-y-6">
        
        {/* Header Section */}
        <div className="text-center px-4">
           <h1 className="font-display text-3xl font-extrabold text-zinc-900 tracking-tight">Your Weekly Menu</h1>
           <p className="mt-2 text-zinc-500 text-sm leading-relaxed max-w-md mx-auto">
             Select a meal slot to find chef-prepared food for breakfast, lunch, and dinner.
           </p>
        </div>

        {/* Days List */}
        <div className="space-y-6 mt-6">
          {DAYS.map((day, idx) => {
            const isToday = idx === currentDayIndex;
            return (
              <div key={day} className="relative group">
                <div className={`absolute -inset-0.5 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500 ${isToday ? "bg-gradient-to-r from-[var(--brand-clay)] to-[#ff6b35] opacity-30" : "bg-zinc-200"}`} />
                <div className={`relative bg-white rounded-[1.75rem] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] ring-1 ${isToday ? "ring-[var(--brand-clay)]/30" : "ring-black/[0.04]"} p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1`}>
                  
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-display font-extrabold text-xl shadow-inner ${isToday ? "bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]" : "bg-zinc-100 text-zinc-600"}`}>
                        {day.substring(0, 3)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                          {day}
                          {isToday && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                              <IoFlame className="h-3 w-3 text-amber-500" /> Today
                            </span>
                          )}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MEALS.map((meal) => (
                      <Link 
                        key={meal.id}
                        to="/search"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-[var(--brand-clay)]/30 hover:shadow-md transition-all duration-300 group/meal"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm text-zinc-500 group-hover/meal:text-[var(--brand-clay)] group-hover/meal:scale-110 transition-all duration-300">
                            <meal.Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-zinc-900 group-hover/meal:text-[var(--brand-clay)] transition-colors">{meal.label}</div>
                            <div className="text-[10px] text-zinc-500 font-semibold">{meal.time}</div>
                          </div>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover/meal:bg-[var(--brand-clay)] group-hover/meal:text-white transition-all duration-300">
                           <ArrowRight className="h-3 w-3" />
                        </div>
                      </Link>
                    ))}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </RoleShell>
  );
}
