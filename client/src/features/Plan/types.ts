/** "learn" items come from your plan; "revise" items are auto-scheduled. */
export type PlanItemType = "learn" | "revise";

export type PlanItemStatus = "pending" | "done";

/** One subject (or its revision) planned for a day. Dates are YYYY-MM-DD. */
export interface PlanItem {
  id: string;
  title: string;
  date: string;
  type: PlanItemType;
  status: PlanItemStatus;
  /** Day it was finished, or null while pending. */
  doneOn: string | null;
  /** For revisions: the learn item they revise. */
  sourceId?: string;
  /** Questions to solve; null for revisions. */
  target: number | null;
  solved: number;
  /** Concepts and related topics picked up from the questions. */
  notes: string;
}

export interface PlanSettings {
  examName: string;
  examDate: string;
}

export interface Plan extends PlanSettings {
  items: PlanItem[];
}

/** A subject parsed from pasted plan lines, before the server stores it. */
export interface NewPlanItem {
  title: string;
  date: string;
  target: number;
  /** Starting notes, e.g. concepts and related topics from imported JSON. */
  notes: string;
}
