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
 *  will be wired incrementally. Provides page header, KPI cards, sections
 *  reflecting the spec, and a Coming-soon banner. */
export function ScaffoldPage({
  title,
  description,
  kpis,
  sections,
  actions,
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
}) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      <PageBody>
        {kpis && kpis.length > 0 && (
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${Math.min(kpis.length, 4)}`}>
            {kpis.map((k, i) => (
              <KpiCard key={i} label={k.label} value={k.value} Icon={k.Icon} accent={k.accent ?? "green"} />
            ))}
          </div>
        )}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {sections.map((s, i) => (
            <Section key={i} title={s.title} description={s.description} items={s.items} />
          ))}
        </div>
        <div className="mt-6">
          <ComingSoon description="Full CRUD, filters, and Supabase wiring for this module are staged and will land in follow-up pushes. All sections listed here map directly to the Naija Eats spec." />
        </div>
      </PageBody>
    </>
  );
}
