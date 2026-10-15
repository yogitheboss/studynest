import { randomUUID } from "node:crypto";

import { db } from "../../auth.js";

// One document per course. Notes and attachments are embedded as maps keyed by
// node id so a single read returns everything a viewer needs. Courses are
// private by default; a course is only readable without auth once its owner
// flips `isPublic` on, and even then only via its unguessable `publicId`.
const courses = db.collection("courses");

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "course";

// Shape returned to the owner: full editable course plus its share state.
const toOwnerCourse = (doc) => ({
  id: doc.id,
  name: doc.name,
  root: doc.root,
  isPublic: Boolean(doc.isPublic),
  publicId: doc.publicId,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt ?? null,
});

// Shape returned to anonymous viewers of a public link: read-only content, no
// owner id and no internal flags.
const toPublicCourse = (doc) => ({
  id: doc.id,
  name: doc.name,
  root: doc.root,
  notes: doc.notes ?? {},
  attachments: doc.attachments ?? {},
  createdAt: doc.createdAt,
});

// Data-access layer. Every owner-scoped query filters on `ownerId` so one user
// can never touch another's course. Returns mapped API shapes (or null when a
// course isn't found / owned) — controllers stay free of Mongo details.
export const courseService = {
  /** The owner's courses, newest first. */
  async listByOwner(ownerId) {
    const docs = await courses
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toOwnerCourse);
  },

  /** Create a course owned by `ownerId`. Private until shared. */
  async create({ ownerId, name, root }) {
    const now = new Date().toISOString();
    const doc = {
      id: `${slugify(name)}-${randomUUID().slice(0, 8)}`,
      ownerId,
      name,
      root,
      notes: {},
      attachments: {},
      isPublic: false,
      publicId: randomUUID().replace(/-/g, ""),
      createdAt: now,
      updatedAt: now,
    };
    await courses.insertOne(doc);
    return toOwnerCourse(doc);
  },

  /** Replace an owned course's name + tree. Returns the updated course, or null. */
  async updateTree(id, ownerId, { name, root }) {
    const set = { root, updatedAt: new Date().toISOString() };
    if (name) set.name = name;
    const result = await courses.findOneAndUpdate(
      { id, ownerId },
      { $set: set },
      { returnDocument: "after" }
    );
    const doc = result?.value ?? result; // driver v5 vs v6 return shape
    if (!doc) return null;
    return toOwnerCourse(doc);
  },

  /** Delete an owned course. Returns false if nothing matched. */
  async remove(id, ownerId) {
    const result = await courses.deleteOne({ id, ownerId });
    return result.deletedCount > 0;
  },

  /** Flip visibility. Returns the new share state, or null if not owned. */
  async setVisibility(id, ownerId, isPublic) {
    const result = await courses.findOneAndUpdate(
      { id, ownerId },
      { $set: { isPublic, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    const doc = result?.value ?? result; // driver v5 vs v6 return shape
    if (!doc) return null;
    return { isPublic: Boolean(doc.isPublic), publicId: doc.publicId };
  },

  /** Notes for one node, or null if the course isn't owned/found. */
  async getNotes(id, ownerId, nodeId) {
    const doc = await courses.findOne({ id, ownerId });
    if (!doc) return null;
    return doc.notes?.[nodeId] ?? [];
  },

  /** Replace one node's notes. Returns the saved list, or null if not owned. */
  async replaceNotes(id, ownerId, nodeId, notes) {
    const doc = await courses.findOne({ id, ownerId });
    if (!doc) return null;
    // Node ids contain dots, so read-modify-write the map rather than $set on a
    // dotted path. An empty list removes the key entirely.
    const map = { ...(doc.notes ?? {}) };
    if (notes.length === 0) delete map[nodeId];
    else map[nodeId] = notes;
    await courses.updateOne(
      { id: doc.id },
      { $set: { notes: map, updatedAt: new Date().toISOString() } }
    );
    return notes;
  },

  /** Attachments for one node, or null if the course isn't owned/found. */
  async getAttachments(id, ownerId, nodeId) {
    const doc = await courses.findOne({ id, ownerId });
    if (!doc) return null;
    return doc.attachments?.[nodeId] ?? [];
  },

  /** Replace one node's attachments. Returns the saved list, or null. */
  async replaceAttachments(id, ownerId, nodeId, attachments) {
    const doc = await courses.findOne({ id, ownerId });
    if (!doc) return null;
    const map = { ...(doc.attachments ?? {}) };
    if (attachments.length === 0) delete map[nodeId];
    else map[nodeId] = attachments;
    await courses.updateOne(
      { id: doc.id },
      { $set: { attachments: map, updatedAt: new Date().toISOString() } }
    );
    return attachments;
  },

  /** A public course by share token, or null unless it exists AND is public. */
  async getPublic(publicId) {
    const doc = await courses.findOne({ publicId, isPublic: true });
    if (!doc) return null;
    return toPublicCourse(doc);
  },
};
