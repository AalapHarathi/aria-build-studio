import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/aria-data";
import { FlaskConical } from "lucide-react";

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-card px-8 py-5">
      <div>
        {eyebrow && <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {desc && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const stageTone: Record<Stage, string> = {
  Draft: "bg-muted text-muted-foreground",
  "In review": "bg-warning-soft text-warning",
  Approved: "bg-blue-soft text-primary",
  Staged: "bg-violet-soft text-violet",
  Canary: "bg-teal-soft text-teal",
  Production: "bg-teal text-primary-foreground",
};
export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", stageTone[stage])}>{stage}</span>;
}

export function Pill({ tone = "muted", children }: { tone?: "muted" | "blue" | "teal" | "violet" | "warn" | "danger"; children: ReactNode }) {
  const t = { muted: "bg-muted text-muted-foreground", blue: "bg-blue-soft text-primary", teal: "bg-teal-soft text-teal", violet: "bg-violet-soft text-violet", warn: "bg-warning-soft text-warning", danger: "bg-danger-soft text-destructive" }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", t)}>{children}</span>;
}

export function RiskPill({ risk }: { risk: "Low" | "Medium" | "High" }) {
  return <Pill tone={risk === "High" ? "danger" : risk === "Medium" ? "warn" : "teal"}>{risk} risk</Pill>;
}

export function SampleTag({ children = "Sample data" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <FlaskConical className="h-3 w-3" /> {children}
    </span>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Meter({ value, threshold }: { value: number; threshold?: number }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-muted">
      <div className={cn("h-2 rounded-full", threshold && value < threshold ? "bg-warning" : "bg-teal")} style={{ width: `${value}%` }} />
      {threshold && <div className="absolute -top-1 h-4 w-0.5 bg-navy" style={{ left: `${threshold}%` }} title={`Threshold ${threshold}%`} />}
    </div>
  );
}
