import { db } from "../../auth.js";

// One document per user per day: { ownerId, date: "YYYY-MM-DD", markdown, updatedAt }.
const journal = db.collection("journal");
journal.createIndex({ ownerId: 1, date: 1 }, { unique: true }).catch(() => {});

export const journalService = {
  async list(ownerId) {
    const docs = await journal
      .find({ ownerId }, { projection: { _id: 0, date: 1, markdown: 1 } })
      .sort({ date: -1 })
      .toArray();
    return docs.map((d) => ({
      date: d.date,
      preview: d.markdown.slice(0, 120),
    }));
  },

  async get(ownerId, date) {
    const doc = await journal.findOne({ ownerId, date });
    return {
      date,
      markdown: doc?.markdown ?? "",
      updatedAt: doc?.updatedAt ?? null,
    };
  },

  async upsert(ownerId, date, markdown) {
    const updatedAt = new Date();
    await journal.updateOne(
      { ownerId, date },
      { $set: { markdown, updatedAt } },
      { upsert: true }
    );
    return { date, markdown, updatedAt };
  },
};
