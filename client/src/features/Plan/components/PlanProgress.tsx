import { cn } from "@/lib/utils";
import { daysBetween, formatDateKey } from "@/lib/dates";
import type { Plan } from "../types";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  /** Optional tick showing where you should be by now. */
  expected?: number;
}

const percent = (value: number, max: number): number =>
  max ? Math.min(100, Math.round((value / max) * 100)) : 0;

const Meter = ({ label, value, max, expected }: MeterProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground tabular-nums">
        {value.toLocaleString()} / {max.toLocaleString()}
      </span>
    </div>
    <div className="bg-muted relative h-2 rounded-full">
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${percent(value, max)}%` }}
      />
      {expected !== undefined && (
        <div
          title={`Planned by today: ${expected}`}
          className="bg-foreground absolute -top-1 h-4 w-0.5"
          style={{ left: `${percent(expected, max)}%` }}
        />
      )}
    </div>
  </div>
);

interface PlanProgressProps {
  plan: Plan;
  today: string;
  overdueCount: number;
}

const countdownLabel = (daysLeft: number): string => {
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return "Tomorrow";
  if (daysLeft === 0) return "Exam day";
  return "Exam done";
};

export const PlanProgress = ({
  plan,
  today,
  overdueCount,
}: PlanProgressProps) => {
  const learn = plan.items.filter((i) => i.type === "learn");
  const done = learn.filter((i) => i.status === "done").length;
  const plannedByToday = learn.filter((i) => i.date <= today).length;
  const target = learn.reduce((sum, i) => sum + (i.target ?? 0), 0);
  const solved = learn.reduce((sum, i) => sum + i.solved, 0);

  return (
    <section className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold">{plan.examName}</h2>
          <p className="text-muted-foreground text-sm">
            {formatDateKey(plan.examDate)}
          </p>
        </div>
        <p className="text-primary shrink-0 text-right text-lg font-bold tabular-nums">
          {countdownLabel(daysBetween(today, plan.examDate))}
        </p>
      </div>

      <Meter
        label="Subjects done"
        value={done}
        max={learn.length}
        expected={plannedByToday}
      />
      <Meter label="Questions solved" value={solved} max={target} />

      <p
        className={cn(
          "text-sm font-medium",
          overdueCount ? "text-destructive" : "text-primary"
        )}
      >
        {overdueCount
          ? `${overdueCount} overdue. Clear these before anything new.`
          : "On track."}
      </p>
    </section>
  );
};
