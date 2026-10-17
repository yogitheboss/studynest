import { randomUUID } from "node:crypto";

// Spaced-repetition gaps: days after a subject is finished to revise it again.
export const REVISION_GAPS = [1, 3, 7, 21];

/** Shift a YYYY-MM-DD key by whole days (UTC math, so no DST surprises). */
export const addDays = (dateKey, days) => {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Revision items for a learn item finished on `doneOn`, all before the exam. */
export const revisionsFor = (item, doneOn, examDate) =>
  REVISION_GAPS.map((gap) => addDays(doneOn, gap))
    .filter((date) => date < examDate)
    .map((date) => ({
      id: randomUUID(),
      title: item.title,
      date,
      type: "revise",
      status: "pending",
      doneOn: null,
      sourceId: item.id,
      target: null,
      solved: 0,
      notes: "",
    }));
