import { useCallback, useEffect, useRef, useState } from "react";

import { todayKey } from "@/lib/dates";
import {
  addPlanItems,
  completeItem,
  deletePlanItem,
  getPlan,
  reopenItem,
  rescheduleItem,
  saveItemNotes,
  savePlanSettings,
  setSolved,
} from "../services/planApi";
import type { NewPlanItem, Plan, PlanItem, PlanSettings } from "../types";

/** Every action replaces the plan with the server's copy; rejects on failure. */
export interface PlanActions {
  saveSettings: (settings: PlanSettings) => Promise<void>;
  addItems: (items: NewPlanItem[]) => Promise<void>;
  toggleDone: (item: PlanItem) => Promise<void>;
  moveToToday: (item: PlanItem) => Promise<void>;
  setSolved: (item: PlanItem, solved: number) => Promise<void>;
  saveNotes: (item: PlanItem, notes: string) => Promise<void>;
  remove: (item: PlanItem) => Promise<void>;
}

interface UsePlanResult {
  plan: Plan | null;
  loading: boolean;
  error: string | null;
  actions: PlanActions;
}

export const usePlan = (): UsePlanResult => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPlan()
      .then((loaded) => active && setPlan(loaded))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // The server read-modify-writes the item list, so run one request at a time
  // or two quick edits (notes blur + checkbox) could overwrite each other.
  // ponytail: per-tab queue only; a second open tab can still race.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const run = useCallback((work: () => Promise<Plan>): Promise<void> => {
    const next = queue.current.then(work).then(setPlan);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const [actions] = useState<PlanActions>(() => ({
    saveSettings: (settings) => run(() => savePlanSettings(settings)),
    addItems: (items) => run(() => addPlanItems(items)),
    toggleDone: (item) =>
      run(() =>
        item.status === "done" ? reopenItem(item.id) : completeItem(item.id)
      ),
    moveToToday: (item) => run(() => rescheduleItem(item.id, todayKey())),
    setSolved: (item, solved) => run(() => setSolved(item.id, solved)),
    saveNotes: (item, notes) => run(() => saveItemNotes(item.id, notes)),
    remove: (item) => run(() => deletePlanItem(item.id)),
  }));

  return { plan, loading, error, actions };
};
