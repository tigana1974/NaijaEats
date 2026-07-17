import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RoleShell } from "@/components/naija/RoleShell";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import {
  PiLeafDuotone,
  PiEggDuotone,
  PiFishDuotone,
  PiCookingPotDuotone,
  PiPepperDuotone,
  PiBarbellDuotone,
  PiHeartDuotone,
  PiCookieDuotone,
  PiGrainsDuotone,
  PiMoonStarsDuotone,
  PiForkKnifeDuotone,
  PiCoffeeDuotone,
} from "react-icons/pi";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/book/build")({
  component: BuildMyWeekPage,
});

const STORAGE_KEY = "naijaeats.dietaryPrefs.v1";

type Diet = "vegetarian" | "vegan" | "pescatarian" | "halal" | "no-pork" | "no-beef" | "gluten-free" | "dairy-free";
type Goal = "balanced" | "protein-heavy" | "low-carb" | "high-fibre" | "comfort" | "budget";
type Spice = "mild" | "medium" | "hot" | "any";

type Prefs = {
  budgetPerMeal: number;
  diets: Diet[];
  goals: Goal[];
  spice: Spice;
  allergies: string;
  wantsBreakfast: boolean;
  wantsLunch: boolean;
  wantsDinner: boolean;
};

const DEFAULTS: Prefs = {
  budgetPerMeal: 3000,
  diets: [],
  goals: ["balanced"],
  spice: "medium",
  allergies: "",
  wantsBreakfast: true,
  wantsLunch: true,
  wantsDinner: true,
};

const DIET_OPTIONS: { id: Diet; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "vegetarian", label: "Vegetarian", Icon: PiLeafDuotone },
  { id: "vegan", label: "Vegan", Icon: PiLeafDuotone },
  { id: "pescatarian", label: "Pescatarian", Icon: PiFishDuotone },
  { id: "halal", label: "Halal", Icon: PiCookingPotDuotone },
  { id: "no-pork", label: "No pork", Icon: PiEggDuotone },
  { id: "no-beef", label: "No beef", Icon: PiEggDuotone },
  { id: "gluten-free", label: "Gluten-free", Icon: PiGrainsDuotone },
  { id: "dairy-free", label: "Dairy-free", Icon: PiCookieDuotone },
];

const GOAL_OPTIONS: { id: Goal; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "balanced", label: "Balanced", desc: "A little bit of everything", Icon: PiHeartDuotone },
  { id: "protein-heavy", label: "Protein-heavy", desc: "Fish, chicken, beans, eggs", Icon: PiBarbellDuotone },
  { id: "low-carb", label: "Low-carb", desc: "Less rice, more veg", Icon: PiLeafDuotone },
  { id: "high-fibre", label: "High-fibre", desc: "Beans, greens, whole grains", Icon: PiGrainsDuotone },
  { id: "comfort", label: "Comfort food", desc: "Rich stews, hearty portions", Icon: PiCookingPotDuotone },
  { id: "budget", label: "Budget-friendly", desc: "Everyday value picks", Icon: PiCookieDuotone },
];

const SPICE_OPTIONS: { id: Spice; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "mild", label: "Mild", Icon: PiPepperDuotone },
  { id: "medium", label: "Medium", Icon: PiPepperDuotone },
  { id: "hot", label: "Very spicy 🌶️", Icon: PiPepperDuotone },
  { id: "any", label: "Any", Icon: PiPepperDuotone },
];

function BuildMyWeekPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored) setPrefs({ ...DEFAULTS, ...stored });
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDiet = (d: Diet) =>
    setPrefs((p) => ({
      ...p,
      diets: p.diets.includes(d) ? p.diets.filter((x) => x !== d) : [...p.diets, d],
    }));

  const toggleGoal = (g: Goal) =>
    setPrefs((p) => ({
      ...p,
      goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g],
    }));

  const save = () => {
    if (!prefs.wantsBreakfast && !prefs.wantsLunch && !prefs.wantsDinner) {
      return toast.error("Pick at least one meal slot");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Preferences saved — building your week…");
    navigate({ to: "/book" });
  };

  return (
    <RoleShell
      topBar={
        <div className="flex items-center gap-3">
          <Link
            to="/book"
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-clay)]">Build my week</div>
            <div className="text-sm font-bold truncate">Your dietary preferences</div>
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-5 pt-3 pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-7 text-white bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.85_0.17_90/0.5),transparent_55%),radial-gradient(120%_120%_at_100%_100%,oklch(0.55_0.22_25/0.95),transparent_55%),linear-gradient(150deg,#1a0e0a,#3a1a14_55%,#7c2d12)]">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--brand-gold)]/25 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center rounded-full bg-white/12 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              Smart week
            </div>
            <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight mt-2 leading-[1.05]">
              Tell us how you like to eat.
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed max-w-md">
              We'll rotate menus from chefs that match your preferences and auto-fill every meal for you.
            </p>
          </div>
        </div>

        {/* Meal slots to fill */}
        <Section title="Which meals should we plan?" hint="Pick at least one">
          <div className="grid grid-cols-3 gap-2">
            <MealToggle
              Icon={PiCoffeeDuotone}
              label="Breakfast"
              active={prefs.wantsBreakfast}
              onToggle={() => setPrefs((p) => ({ ...p, wantsBreakfast: !p.wantsBreakfast }))}
            />
            <MealToggle
              Icon={PiForkKnifeDuotone}
              label="Lunch"
              active={prefs.wantsLunch}
              onToggle={() => setPrefs((p) => ({ ...p, wantsLunch: !p.wantsLunch }))}
            />
            <MealToggle
              Icon={PiMoonStarsDuotone}
              label="Dinner"
              active={prefs.wantsDinner}
              onToggle={() => setPrefs((p) => ({ ...p, wantsDinner: !p.wantsDinner }))}
            />
          </div>
        </Section>

        {/* Diet */}
        <Section title="Dietary style" hint="Any that apply — leave empty if you eat everything">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIET_OPTIONS.map((d) => (
              <ChipToggle
                key={d.id}
                Icon={d.Icon}
                label={d.label}
                active={prefs.diets.includes(d.id)}
                onToggle={() => toggleDiet(d.id)}
              />
            ))}
          </div>
        </Section>

        {/* Goals */}
        <Section title="What matters most?" hint="Pick one or a few">
          <div className="grid gap-2 sm:grid-cols-2">
            {GOAL_OPTIONS.map((g) => (
              <GoalCard
                key={g.id}
                Icon={g.Icon}
                label={g.label}
                desc={g.desc}
                active={prefs.goals.includes(g.id)}
                onToggle={() => toggleGoal(g.id)}
              />
            ))}
          </div>
        </Section>

        {/* Spice */}
        <Section title="Spice level">
          <div className="grid grid-cols-4 gap-2">
            {SPICE_OPTIONS.map((s) => {
              const active = prefs.spice === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, spice: s.id }))}
                  className={`rounded-2xl border py-2.5 text-xs font-bold transition ${
                    active
                      ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]"
                      : "border-border bg-card hover:border-[var(--brand-clay)]/40"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Budget */}
        <Section title="Budget per meal" hint={`${fmt(prefs.budgetPerMeal)} / meal`}>
          <input
            type="range"
            min={1000}
            max={10000}
            step={500}
            value={prefs.budgetPerMeal}
            onChange={(e) => setPrefs((p) => ({ ...p, budgetPerMeal: Number(e.target.value) }))}
            className="w-full accent-[var(--brand-clay)]"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{fmt(1000)}</span>
            <span>{fmt(10000)}</span>
          </div>
        </Section>

        {/* Allergies */}
        <Section title="Any allergies or dislikes?" hint="Free text — separate with commas">
          <input
            type="text"
            value={prefs.allergies}
            onChange={(e) => setPrefs((p) => ({ ...p, allergies: e.target.value }))}
            placeholder="e.g. peanuts, shellfish, coriander"
            className="w-full h-12 rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-[var(--brand-clay)] focus:ring-2 focus:ring-[var(--brand-clay)]/15 transition"
          />
        </Section>

        {/* CTA */}
        <button
          onClick={save}
          className="mt-8 w-full h-14 rounded-2xl inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--brand-clay)] to-[oklch(0.58_0.22_35)] text-white text-base font-bold shadow-xl shadow-[var(--brand-clay)]/30 hover:shadow-2xl active:scale-[0.99] transition-all"
        >
          Build my week
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          You can change these anytime.
        </p>
      </div>
    </RoleShell>
  );
}

const fmt = (n: number) => `₦${n.toLocaleString()}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground shrink-0">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function MealToggle({
  Icon,
  label,
  active,
  onToggle,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 rounded-2xl border py-3 px-2 transition ${
        active
          ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]/10 text-[var(--brand-clay)] shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-[var(--brand-clay)]/40"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function ChipToggle({
  Icon,
  label,
  active,
  onToggle,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${
        active
          ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]/10 text-[var(--brand-clay)]"
          : "border-border bg-card text-foreground hover:border-[var(--brand-clay)]/40"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-bold flex-1 truncate">{label}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
    </button>
  );
}

function GoalCard({
  Icon,
  label,
  desc,
  active,
  onToggle,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
        active
          ? "border-[var(--brand-clay)] bg-[var(--brand-clay)]/10 shadow-sm"
          : "border-border bg-card hover:border-[var(--brand-clay)]/40"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          active ? "bg-[var(--brand-clay)] text-white" : "bg-muted text-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-black truncate">{label}</div>
        <div className="text-[11px] text-black/60 truncate">{desc}</div>
      </div>
      {active && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--brand-clay)] text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
