import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "primary" | "success" | "violet" | "warning" | "danger" | "pink";

export const toneBg: Record<Tone, string> = {
  primary: "bg-info-soft text-primary",
  success: "bg-success-soft text-success",
  violet: "bg-violet-soft text-violet",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-destructive",
  pink: "bg-pink-soft text-pink",
};

export function Logo({ dark, sub }: { dark?: boolean; sub?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <FileText className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className={cn("block text-xl font-extrabold tracking-tight", dark ? "text-navy-foreground" : "text-foreground")}>
          Swahivo
        </span>
        {sub && <span className="block text-[11px] text-navy-muted">{sub}</span>}
      </span>
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>{children}</div>;
}

export function CardHead({ title, action, right }: { title: string; action?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-base font-bold">{title}</h3>
      {right ?? (action && (
        <button className="flex items-center gap-1 text-xs font-medium text-primary">
          {action} <ArrowRight className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

export function Stat({ icon: Icon, tone, label, value, delta, up = true, note }: {
  icon: React.ComponentType<{ className?: string }>; tone: Tone; label: string; value: string; delta: string; up?: boolean; note: string;
}) {
  return (
    <Card className="flex gap-4 p-4">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", toneBg[tone])}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-extrabold">{value}</p>
        <span className={cn("mt-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", up ? "bg-success-soft text-success" : "bg-danger-soft text-destructive")}>
          {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{delta}
        </span>
        <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
      </div>
    </Card>
  );
}

const statusTone: Record<string, Tone> = {
  Paid: "success", Active: "success", Connected: "success", Operational: "success",
  Sent: "primary", "Due soon": "primary", Viewed: "violet",
  Pending: "warning", "Not Configured": "warning", Overdue: "danger", Scheduled: "violet",
};

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? "primary";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", toneBg[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
    </span>
  );
}

export function Avatar({ name, tone = "primary" }: { name: string; tone?: Tone | undefined }) {
  return (
    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", toneBg[tone])}>
      {name.charAt(0)}
    </span>
  );
}

export const tones: Tone[] = ["primary", "violet", "success", "warning", "pink"];
