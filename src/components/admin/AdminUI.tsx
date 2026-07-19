import type { ReactNode } from "react";
import { AlertCircle, ArrowUpRight, ChevronDown, Download, Filter, Search, Sparkles } from "lucide-react";

/** Page header with title, description, and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mb-2 text-xs text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5">/</span>}
                <span>{b}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">{children}</div>;
}

/** KPI card with label, value, delta, and optional icon. */
export function KpiCard({
  label,
  value,
  delta,
  hint,
  Icon,
  accent = "green",
}: {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  accent?: "green" | "orange" | "ink" | "muted";
}) {
  const accentBg = {
    green: "bg-[var(--naija-green)]/10 text-[var(--naija-green)]",
    orange: "bg-[var(--naija-orange)]/10 text-[var(--naija-orange)]",
    ink: "bg-[var(--naija-ink)]/10 text-[var(--naija-ink)]",
    muted: "bg-muted text-muted-foreground",
  }[accent];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {Icon && (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${accentBg}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={
              delta.direction === "up"
                ? "text-[var(--naija-green)]"
                : delta.direction === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
          >
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "→"} {delta.value}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

/** Status pill for orders, stores, payouts. */
export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    // orders
    new: "bg-blue-100 text-blue-700",
    "awaiting acceptance": "bg-amber-100 text-amber-800",
    accepted: "bg-cyan-100 text-cyan-800",
    preparing: "bg-amber-100 text-amber-800",
    "ready for pickup": "bg-purple-100 text-purple-800",
    "assigned to rider": "bg-purple-100 text-purple-800",
    "picked up": "bg-purple-100 text-purple-800",
    "on the way": "bg-purple-100 text-purple-800",
    delivered: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
    refunded: "bg-rose-100 text-rose-800",
    // stores / verification
    open: "bg-emerald-100 text-emerald-800",
    closed: "bg-slate-100 text-slate-800",
    suspended: "bg-rose-100 text-rose-800",
    approved: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-rose-100 text-rose-800",
    // payouts
    requested: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
    // generic
    active: "bg-emerald-100 text-emerald-800",
    inactive: "bg-slate-100 text-slate-800",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

/** Filter bar with search + optional filter chip triggers. */
export function FilterBar({
  onSearch,
  filters,
  extra,
}: {
  onSearch?: (v: string) => void;
  filters?: { label: string }[];
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search…"
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-[var(--naija-green)]"
        />
      </div>
      {(filters ?? []).map((f, i) => (
        <button
          key={i}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
        >
          <Filter className="h-3.5 w-3.5" />
          {f.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
      >
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {extra}
    </div>
  );
}

/** Reusable card container for tables/cards. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-border px-5 py-4">
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      {action}
    </div>
  );
}

/** Empty-state box for zero data. */
export function EmptyState({
  title,
  description,
  action,
  Icon = AlertCircle,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <div className="mt-3 font-medium">{title}</div>
      {description && <div className="mt-1 max-w-md text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Coming-soon banner used on scaffolded pages. */
export function ComingSoon({
  title = "Coming soon",
  description = "This module is fully mapped in the sidebar. Detailed views will land in a follow-up push.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--naija-orange)]/40 bg-[var(--naija-orange)]/10 p-4">
      <Sparkles className="mt-0.5 h-5 w-5 text-[var(--naija-orange)]" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

/** Simple button styles used across admin pages. */
export const btn = {
  primary:
    "inline-flex items-center gap-1.5 rounded-lg bg-[var(--naija-green)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--naija-green-dark)]",
  secondary:
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted",
  danger:
    "inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90",
} as const;

/** Data-table helpers (thin wrappers over native tables so pages compose cleanly). */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
      {children}
    </thead>
  );
}
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-medium ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
export function Tr({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-border ${onClick ? "cursor-pointer hover:bg-muted/30" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

/** Quick action link card used on the dashboard. */
export function QuickActionRow({
  label,
  to,
  Icon,
}: {
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={to}
      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-[var(--naija-green)] transition"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--naija-green)]/10 text-[var(--naija-green)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

/** Currency formatter respecting store currency (defaults to GBP for UK, NGN for Nigeria). */
export function formatMoney(amount: number, currency: string = "GBP") {
  try {
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Section — titled block used by scaffolded pages. */
export function Section({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--naija-green)]" />
            {it}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** ScaffoldPage — reusable page skeleton for modules whose full data plumbing
 *  will be wired incrementally. Uber-Eats-style page title, KPI row, and section
 *  cards reflecting the spec, plus a Coming-soon banner. */
export function ScaffoldPage({
  title,
  description,
  kpis,
  sections,
  actions,
  eyebrow,
}: {
  title: string;
  description: string;
  kpis?: {
    label: string;
    value: string | number;
    Icon: React.ComponentType<{ className?: string }>;
    accent?: "green" | "orange" | "ink" | "muted";
  }[];
  sections: { title: string; description?: string; items: string[] }[];
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
      <UberPageTitle eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {kpis && kpis.length > 0 && (
        <div className={`mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-${Math.min(kpis.length, 4)}`}>
          {kpis.map((k, i) => (
            <UberKpi key={i} label={k.label} value={k.value} />
          ))}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s, i) => (
          <UberSection key={i} title={s.title} description={s.description} items={s.items} />
        ))}
      </div>
    </div>
  );
}

/** Uber-style titled section card (used inside ScaffoldPage). */
export function UberSection({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-[oklch(0.92_0.003_260)] bg-white">
      <div className="border-b border-[oklch(0.94_0.003_260)] px-5 py-4">
        <div className="text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">{title}</div>
        {description && <div className="mt-0.5 text-[12.5px] text-neutral-500">{description}</div>}
      </div>
      <ul className="grid gap-1 p-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--naija-green)]" />
            <span className="truncate">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================================
 *  Uber-Eats-Manager-style components used by the admin dashboard homepage.
 * ========================================================================== */

/** Clean KPI card matching Uber Eats: small label + info dot, big number, small hint. */
export function UberKpi({
  label,
  value,
  hint,
  ...rest
}: {
  label: string;
  value: string | number;
  hint?: string;
  Icon?: any;
  accent?: string;
  [k: string]: any;
}) {
  return (
    <div className="rounded-xl border border-[oklch(0.92_0.003_260)] bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
        <span>{label}</span>
        <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-neutral-300 text-[9px] font-semibold text-neutral-400">
          i
        </span>
      </div>
      <div className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-[oklch(0.18_0.006_260)]">
        {value}
      </div>
      {hint && <div className="mt-1 text-[12px] text-neutral-500">{hint}</div>}
    </div>
  );
}

/** The distinctive Uber Eats "Current tier" card with an SVG circular gauge — Naija green palette. */
export function CurrentTierCard({
  tier,
  benefitsLabel,
  benefitsCount,
  progress,
}: {
  tier: string;
  benefitsLabel: string;
  benefitsCount: number;
  /** 0 to 1 */
  progress: number;
}) {
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[oklch(0.9_0.05_145)] bg-[oklch(0.98_0.02_145)] p-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="oklch(0.9_0.04_145)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--naija-green)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-1 items-center gap-6 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13px] text-neutral-600">
            Current tier
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-neutral-300 text-[9px] font-semibold text-neutral-400">
              i
            </span>
          </div>
          <div className="mt-0.5 text-[22px] font-semibold leading-tight tracking-tight text-[oklch(0.18_0.006_260)]">
            {tier}
          </div>
        </div>
        <div className="mx-2 hidden h-10 w-px bg-[oklch(0.9_0.05_145)] sm:block" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13px] text-neutral-600">
            Current tier benefits
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-neutral-300 text-[9px] font-semibold text-neutral-400">
              i
            </span>
          </div>
          <div className="mt-0.5 truncate text-[15px] font-semibold text-[oklch(0.18_0.006_260)]">
            {benefitsLabel}
          </div>
          <div className="text-[12px] text-neutral-500">{benefitsCount} benefits</div>
        </div>
      </div>
      <ArrowUpRight className="hidden shrink-0 text-neutral-400 sm:block" />
    </div>
  );
}

/** Naija-brand icon color variants — used across opportunity cards and quick actions. */
export type NaijaIconColor = "green" | "orange" | "ink" | "mint" | "peach";

const NAIJA_ICON_BG: Record<NaijaIconColor, string> = {
  green: "bg-[oklch(0.95_0.05_145)] text-[var(--naija-green-dark)]",
  orange: "bg-[oklch(0.95_0.05_65)] text-[var(--naija-orange-dark)]",
  ink: "bg-[oklch(0.95_0.005_260)] text-[oklch(0.28_0.006_260)]",
  mint: "bg-[oklch(0.97_0.03_155)] text-[oklch(0.42_0.13_155)]",
  peach: "bg-[oklch(0.97_0.04_45)] text-[oklch(0.55_0.16_45)]",
};

/** Opportunity card matching Uber Eats: tag pill, title, body, primary button, big circle icon on the right, Helpful/Not helpful feedback. */
export function UberOpportunityCard({
  tag,
  title,
  body,
  ctaLabel,
  ctaHref,
  Icon,
  iconColor = "green",
}: {
  tag: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor?: NaijaIconColor;
}) {
  const bubble = NAIJA_ICON_BG[iconColor];

  return (
    <div className="rounded-xl border border-[oklch(0.92_0.003_260)] bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="inline-block rounded-full bg-[oklch(0.965_0.003_260)] px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
            {tag}
          </div>
          <div className="mt-2 text-[17px] font-semibold leading-snug text-[oklch(0.18_0.006_260)]">
            {title}
          </div>
          <div className="mt-1 text-[13.5px] text-neutral-600">{body}</div>
          <a
            href={ctaHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.18_0.006_260)] bg-white px-4 py-1.5 text-[13.5px] font-medium text-[oklch(0.18_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]"
          >
            {ctaLabel}
          </a>
        </div>
        <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-full ${bubble}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

/** Right-rail Quick Action row matching Uber Eats: colored square icon + label + chevron. */
export function UberQuickAction({
  label,
  to,
  Icon,
  iconColor = "green",
}: {
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor?: NaijaIconColor;
}) {
  const bg = NAIJA_ICON_BG[iconColor];
  return (
    <a
      href={to}
      className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[oklch(0.965_0.003_260)]"
    >
      <span className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${bg}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[14px] font-medium text-[oklch(0.18_0.006_260)]">{label}</span>
      </span>
      <ChevronRightArrow />
    </a>
  );
}

function ChevronRightArrow() {
  return (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="none">
      <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Uber-style page title used at the top of every wired admin page. */
export function UberPageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="text-[13px] text-neutral-600">{eyebrow}</div>}
        <h1 className="mt-0.5 text-[32px] font-semibold leading-tight tracking-tight text-[oklch(0.18_0.006_260)]">
          {title}
        </h1>
        {description && <div className="mt-1 text-[13px] text-neutral-500">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Uber-style tab pill row (used for order-status, store-type, payout-status filters). */
export function UberTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
              active
                ? "bg-[oklch(0.18_0.006_260)] text-white font-medium"
                : "bg-[oklch(0.965_0.003_260)] text-[oklch(0.28_0.006_260)] hover:bg-[oklch(0.94_0.003_260)]"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  active ? "bg-white/15 text-white" : "bg-white/70 text-neutral-500"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A functional filter definition: renders as a pill-shaped <select>.
 *  Filters without options/onChange are ignored (no decorative chips). */
export type UberFilter = {
  label: string;
  value?: string;
  options?: { value: string; label: string }[];
  onChange?: (value: string) => void;
};

/** Uber-style search + filter bar. Filter pills are real <select> controls. */
export function UberFilterBar({
  search,
  onSearch,
  filters,
  extra,
  onExport,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  filters?: UberFilter[];
  extra?: ReactNode;
  onExport?: () => void;
}) {
  const activeFilters = (filters ?? []).filter((f) => f.options && f.onChange);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search…"
          className="h-9 w-full rounded-full border border-[oklch(0.92_0.003_260)] bg-white pl-9 pr-3 text-[13.5px] outline-none focus:border-[var(--naija-green)]"
        />
      </div>
      {activeFilters.map((f, i) => (
        <label
          key={i}
          className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] hover:bg-[oklch(0.965_0.003_260)] ${
            f.value ? "border-[oklch(0.18_0.006_260)] font-medium" : "border-[oklch(0.92_0.003_260)]"
          }`}
        >
          <span className="pointer-events-none">
            {f.value
              ? f.options!.find((o) => o.value === f.value)?.label ?? f.label
              : f.label}
          </span>
          <ChevronDown className="pointer-events-none h-3.5 w-3.5 text-neutral-400" />
          <select
            value={f.value ?? ""}
            onChange={(e) => f.onChange!(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={f.label}
          >
            <option value="">{`All — ${f.label}`}</option>
            {f.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {extra}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.18_0.006_260)] bg-white px-3.5 py-2 text-[13px] font-medium hover:bg-[oklch(0.965_0.003_260)]"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      )}
    </div>
  );
}

/** Uber-style pill button (dark filled = primary; outlined = secondary). */
export const uberBtn = {
  primary:
    "inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.18_0.006_260)] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[oklch(0.28_0.006_260)]",
  secondary:
    "inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.18_0.006_260)] bg-white px-4 py-2 text-[13.5px] font-medium text-[oklch(0.18_0.006_260)] hover:bg-[oklch(0.965_0.003_260)]",
  green:
    "inline-flex items-center gap-1.5 rounded-full bg-[var(--naija-green)] px-4 py-2 text-[13.5px] font-medium text-white hover:bg-[var(--naija-green-dark)]",
} as const;

/** Uber-style bordered table wrapper. Wraps the whole table in a rounded card. */
export function UberTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[oklch(0.92_0.003_260)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">{children}</table>
      </div>
    </div>
  );
}
export function UberThead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[oklch(0.94_0.003_260)] bg-[oklch(0.985_0.003_260)] text-left text-[11px] font-medium uppercase tracking-wider text-neutral-500">
      {children}
    </thead>
  );
}
export function UberTh({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}
export function UberTd({ children, className = "", colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-4 py-3 align-middle ${className}`} colSpan={colSpan}>{children}</td>;
}
export function UberTr({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-[oklch(0.94_0.003_260)] first:border-t-0 ${onClick ? "cursor-pointer hover:bg-[oklch(0.985_0.003_260)]" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

/** Uber-style status pill (used in tables). Uses only Naija-brand hues. */
export function UberStatus({ status, ...rest }: { status: string; variant?: string; [k: string]: any }) {
  const s = (status || "").toLowerCase();
  const green = new Set([
    "delivered", "completed", "paid", "approved", "active", "open",
  ]);
  const orange = new Set([
    "new", "awaiting acceptance", "accepted", "preparing", "ready for pickup",
    "assigned to rider", "picked up", "on the way", "pending", "requested",
  ]);
  const danger = new Set([
    "cancelled", "refunded", "rejected", "suspended", "failed", "closed",
  ]);

  let cls: string;
  if (green.has(s)) {
    cls = "bg-[oklch(0.95_0.05_145)] text-[var(--naija-green-dark)]";
  } else if (danger.has(s)) {
    cls = "bg-[oklch(0.95_0.03_15)] text-[oklch(0.42_0.16_15)]";
  } else if (orange.has(s)) {
    cls = "bg-[oklch(0.95_0.05_65)] text-[var(--naija-orange-dark)]";
  } else {
    cls = "bg-[oklch(0.95_0.005_260)] text-[oklch(0.32_0.006_260)]";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {status}
    </span>
  );
}
