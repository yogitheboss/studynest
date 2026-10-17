import { randomUUID } from "node:crypto";

import { db } from "../../auth.js";
import { revisionsFor } from "./plan.schedule.js";

// One plan per user: { ownerId, examName, examDate, items, updatedAt }.
// Items are embedded: { id, title, date: "YYYY-MM-DD", type: "learn"|"revise",
// status: "pending"|"done", doneOn, sourceId?, target, solved, notes }.
// Revise items are generated from a learn item and point back via sourceId.
const plans = db.collection("plans");
plans.createIndex({ ownerId: 1 }, { unique: true }).catch(() => {});

const toPlan = (doc) =>
  doc && {
    examName: doc.examName,
    examDate: doc.examDate,
    items: doc.items,
  };

function complete(doc, item, today) {
  item.status = "done";
  item.doneOn = today;
  if (item.type === "learn") {
    doc.items.push(...revisionsFor(item, today, doc.examDate));
  }
}

function reopen(doc, item) {
  item.status = "pending";
  item.doneOn = null;
  // Revisions not done yet no longer make sense; finished ones stay as history.
  doc.items = doc.items.filter(
    (i) => !(i.sourceId === item.id && i.status === "pending")
  );
}

async function saveItems(doc) {
  await plans.updateOne(
    { ownerId: doc.ownerId },
    { $set: { items: doc.items, updatedAt: new Date() } }
  );
  return toPlan(doc);
}

// Every query filters on ownerId. Methods return the whole plan (or null when
// the plan / item doesn't exist) so the client can just replace its copy.
export const planService = {
  async get(ownerId) {
    return toPlan(await plans.findOne({ ownerId }));
  },

  async saveSettings(ownerId, { examName, examDate }) {
    await plans.updateOne(
      { ownerId },
      {
        $set: { examName, examDate, updatedAt: new Date() },
        $setOnInsert: { items: [] },
      },
      { upsert: true }
    );
    return this.get(ownerId);
  },

  async addItems(ownerId, entries) {
    const items = entries.map(({ title, date, target, notes }) => ({
      id: randomUUID(),
      title,
      date,
      type: "learn",
      status: "pending",
      doneOn: null,
      target,
      solved: 0,
      notes,
    }));
    const result = await plans.updateOne(
      { ownerId },
      { $push: { items: { $each: items } }, $set: { updatedAt: new Date() } }
    );
    if (!result.matchedCount) return null;
    return this.get(ownerId);
  },

  // Read-modify-write: completing or reopening adds/removes revision items.
  async updateItem(ownerId, itemId, change) {
    const doc = await plans.findOne({ ownerId });
    const item = doc?.items.find((i) => i.id === itemId);
    if (!item) return null;

    if ("date" in change) item.date = change.date;
    if ("notes" in change) item.notes = change.notes;
    if ("solved" in change) {
      item.solved = change.solved;
      // Hitting the question target finishes the subject automatically.
      if (
        item.status === "pending" &&
        item.target &&
        item.solved >= item.target
      ) {
        complete(doc, item, change.today);
      }
    }
    if (change.status === "done" && item.status === "pending") {
      complete(doc, item, change.today);
    }
    if (change.status === "pending" && item.status === "done") {
      reopen(doc, item);
    }
    return saveItems(doc);
  },

  // Deleting a subject also deletes its revisions.
  async removeItem(ownerId, itemId) {
    const doc = await plans.findOne({ ownerId });
    if (!doc?.items.some((i) => i.id === itemId)) return null;
    doc.items = doc.items.filter(
      (i) => i.id !== itemId && i.sourceId !== itemId
    );
    return saveItems(doc);
  },
};
