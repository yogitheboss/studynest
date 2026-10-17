import { request } from "@/lib/api";
import { todayKey } from "@/lib/dates";
import type { NewPlanItem, Plan, PlanSettings } from "../types";

const itemPath = (id: string): string =>
  `/api/plan/items/${encodeURIComponent(id)}`;

const patchItem = (id: string, change: object): Promise<Plan> =>
  request(itemPath(id), { method: "PATCH", body: JSON.stringify(change) });

/** The user's plan, or null before the exam is set up. */
export const getPlan = (): Promise<Plan | null> => request("/api/plan");

export const savePlanSettings = (settings: PlanSettings): Promise<Plan> =>
  request("/api/plan", { method: "PUT", body: JSON.stringify(settings) });

export const addPlanItems = (items: NewPlanItem[]): Promise<Plan> =>
  request("/api/plan/items", {
    method: "POST",
    body: JSON.stringify({ items }),
  });

/** Mark done; a learn item also gets its revisions scheduled from today. */
export const completeItem = (id: string): Promise<Plan> =>
  patchItem(id, { status: "done", today: todayKey() });

/** Undo done; pending revisions of a learn item are dropped. */
export const reopenItem = (id: string): Promise<Plan> =>
  patchItem(id, { status: "pending" });

export const rescheduleItem = (id: string, date: string): Promise<Plan> =>
  patchItem(id, { date });

/** Set the solved count; reaching the target completes the item. */
export const setSolved = (id: string, solved: number): Promise<Plan> =>
  patchItem(id, { solved, today: todayKey() });

export const saveItemNotes = (id: string, notes: string): Promise<Plan> =>
  patchItem(id, { notes });

export const deletePlanItem = (id: string): Promise<Plan> =>
  request(itemPath(id), { method: "DELETE" });
