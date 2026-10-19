import { shiftDateKey } from "@/lib/dates";
import type { PlanItem } from "../types";

const UPCOMING_DAYS = 7;

export interface PlanGroups {
  /** Pending items whose day has passed: the backlog. */
  overdue: PlanItem[];
  today: PlanItem[];
  /** Pending items in the next week. */
  upcoming: PlanItem[];
  /** Pending items beyond the next week. */
  laterCount: number;
}

// By date, with new subjects ahead of revisions on the same day.
const byDate = (a: PlanItem, b: PlanItem): number =>
  a.date.localeCompare(b.date) || a.type.localeCompare(b.type);

export const groupItems = (items: PlanItem[], today: string): PlanGroups => {
  const weekEnd = shiftDateKey(today, UPCOMING_DAYS);
  const groups: PlanGroups = {
    overdue: [],
    today: [],
    upcoming: [],
    laterCount: 0,
  };
  for (const item of [...items].sort(byDate)) {
    if (item.date === today) groups.today.push(item);
    else if (item.status === "done") continue;
    else if (item.date < today) groups.overdue.push(item);
    else if (item.date <= weekEnd) groups.upcoming.push(item);
    else groups.laterCount += 1;
  }
  return groups;
};
