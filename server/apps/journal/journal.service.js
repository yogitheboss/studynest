import { randomUUID } from "node:crypto";

import { db } from "../../auth.js";

// One document per user per day: { ownerId, date: "YYYY-MM-DD", markdown, updatedAt }.
const journal = db.collection("journal");
journal.createIndex({ ownerId: 1, date: 1 }, { unique: true }).catch(() => {});

// Legacy: one undated todo checklist per user: { ownerId, markdown, updatedAt }.
const todos = db.collection("todos");

// Todo notes: { id, ownerId, title, date: "YYYY-MM-DD" | null,
// tasks: [{ id, text, done }], markdown (the "Remember" box), createdAt, updatedAt }.
const todoNotes = db.collection("todoNotes");
todoNotes.createIndex({ ownerId: 1, id: 1 }, { unique: true }).catch(() => {});

// Everything but the Remember markdown, which has its own GET/PUT.
const NOTE_FIELDS = {
  _id: 0,
  id: 1,
  title: 1,
  date: 1,
  tasks: 1,
  updatedAt: 1,
};

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

  async listTodos(ownerId) {
    // ponytail: one-time move of the old single list into a note; drop once
    // every user has opened /todos since. The fixed id + $setOnInsert keeps
    // concurrent calls from inserting it twice.
    const legacy = await todos.findOne({ ownerId });
    if (legacy) {
      if (legacy.markdown?.trim()) {
        const now = new Date();
        await todoNotes
          .updateOne(
            { ownerId, id: "migrated-todo" },
            {
              $setOnInsert: {
                title: "To do",
                date: null,
                tasks: [],
                markdown: legacy.markdown,
                createdAt: now,
                updatedAt: now,
              },
            },
            { upsert: true }
          )
          .catch((err) => {
            if (err.code !== 11000) throw err; // lost the race: already moved
          });
      }
      await todos.deleteOne({ ownerId });
    }
    const docs = await todoNotes
      .find({ ownerId }, { projection: NOTE_FIELDS })
      .sort({ updatedAt: -1 })
      .toArray();
    return docs.map(({ tasks, ...note }) => ({
      ...note,
      done: tasks.filter((t) => t.done).length,
      total: tasks.length,
    }));
  },

  async createTodo(ownerId, { title = "", date = null }) {
    const now = new Date();
    const note = { id: randomUUID(), title, date, tasks: [], updatedAt: now };
    await todoNotes.insertOne({
      ...note,
      ownerId,
      markdown: "",
      createdAt: now,
    });
    return note;
  },

  getTodo(ownerId, id) {
    return todoNotes.findOne({ ownerId, id }, { projection: NOTE_FIELDS });
  },

  updateTodo(ownerId, id, patch) {
    return todoNotes.findOneAndUpdate(
      { ownerId, id },
      { $set: { ...patch, updatedAt: new Date() } },
      { returnDocument: "after", projection: NOTE_FIELDS }
    );
  },

  async deleteTodo(ownerId, id) {
    const result = await todoNotes.deleteOne({ ownerId, id });
    return result.deletedCount > 0;
  },

  getTodoNotes(ownerId, id) {
    return todoNotes.findOne(
      { ownerId, id },
      { projection: { _id: 0, markdown: 1, updatedAt: 1 } }
    );
  },

  async saveTodoNotes(ownerId, id, markdown) {
    const updatedAt = new Date();
    const result = await todoNotes.updateOne(
      { ownerId, id },
      { $set: { markdown, updatedAt } }
    );
    return result.matchedCount ? { markdown, updatedAt } : null;
  },
};
