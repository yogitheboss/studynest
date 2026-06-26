import { randomUUID } from "node:crypto";

import { db } from "./auth.js";

// One document per course. Notes and attachments are embedded as maps keyed by
// node id so a single read returns everything a viewer needs. Courses are
// private by default; a course is only readable without auth once its owner
// flips `isPublic` on, and even then only via its unguessable `publicId`.
const courses = db.collection("courses");

const MAX_DEPTH = 6;
const MAX_NODE_TEXT = 20_000;

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const CHILD_KEYS = [
  "children",
  "modules",
  "topics",
  "chapters",
  "subtopics",
  "lessons",
  "items",
];

// Normalize one raw node into the stored shape, dropping unknown fields and
// enforcing types/depth. Mirrors the client's parseCourse so we never persist
// arbitrary client-supplied structure. Returns null if the node is unusable.
function sanitizeNode(raw, id, depth) {
  if (!isRecord(raw)) return null;
  if (typeof raw.title !== "string" || raw.title.trim() === "") return null;

  const node = { id, title: raw.title.trim(), depth, children: [] };
  if (typeof raw.description === "string" && raw.description.trim() !== "") {
    node.description = raw.description.trim().slice(0, MAX_NODE_TEXT);
  }

  if (depth < MAX_DEPTH) {
    const rawChildren =
      CHILD_KEYS.map((key) => raw[key]).find(Array.isArray) ?? [];
    rawChildren.forEach((child, index) => {
      const childNode = sanitizeNode(child, `${id}.${index}`, depth + 1);
      if (childNode) node.children.push(childNode);
    });
  }
  return node;
}

const asString = (value, max) =>
  typeof value === "string" ? value.slice(0, max) : "";

// Keep only the fields we recognise on a note, with sane types.
function sanitizeNotes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 500).map((raw) => ({
    id: asString(raw?.id, 100) || randomUUID(),
    text: asString(raw?.text, MAX_NODE_TEXT),
    createdAt: asString(raw?.createdAt, 40),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : null,
  }));
}

// Keep only the fields we recognise on an attachment, with sane types.
function sanitizeAttachments(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 500).map((raw) => ({
    id: asString(raw?.id, 100) || randomUUID(),
    name: asString(raw?.name, 500),
    url: asString(raw?.url, 2000),
    objectName: asString(raw?.objectName, 500),
    contentType: asString(raw?.contentType, 200),
    size: typeof raw?.size === "number" ? raw.size : 0,
    uploadedAt: asString(raw?.uploadedAt, 40),
  }));
}

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

/**
 * Register all course routes. `requireAuth` is the session middleware from the
 * main server; owner routes use it, the public route deliberately does not.
 */
export function registerCourseRoutes(app, requireAuth) {
  // List the signed-in user's own courses (newest first).
  app.get("/api/courses", requireAuth, async (req, res) => {
    const docs = await courses
      .find({ ownerId: req.session.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(docs.map(toOwnerCourse));
  });

  // Create a course owned by the signed-in user. Private until shared.
  app.post("/api/courses", requireAuth, async (req, res) => {
    const root = sanitizeNode(req.body?.root, "root", 0);
    if (!root) {
      return res
        .status(400)
        .json({ error: "A valid course tree is required." });
    }
    const name =
      typeof req.body?.name === "string" && req.body.name.trim()
        ? req.body.name.trim()
        : root.title;
    const now = new Date().toISOString();
    const doc = {
      id: `${slugify(name)}-${randomUUID().slice(0, 8)}`,
      ownerId: req.session.user.id,
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
    res.status(201).json(toOwnerCourse(doc));
  });

  // Delete one of the user's own courses.
  app.delete("/api/courses/:id", requireAuth, async (req, res) => {
    const result = await courses.deleteOne({
      id: req.params.id,
      ownerId: req.session.user.id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(204).end();
  });

  // Toggle a course between public and private. Only the owner can do this.
  app.patch("/api/courses/:id/visibility", requireAuth, async (req, res) => {
    if (typeof req.body?.isPublic !== "boolean") {
      return res.status(400).json({ error: "`isPublic` must be a boolean." });
    }
    const result = await courses.findOneAndUpdate(
      { id: req.params.id, ownerId: req.session.user.id },
      {
        $set: {
          isPublic: req.body.isPublic,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );
    const doc = result?.value ?? result; // driver v5 vs v6 return shape
    if (!doc) return res.status(404).json({ error: "Course not found" });
    res.json({ isPublic: Boolean(doc.isPublic), publicId: doc.publicId });
  });

  // Read the notes for a single node (owner only).
  app.get("/api/courses/:id/notes/:nodeId", requireAuth, async (req, res) => {
    const doc = await courses.findOne({
      id: req.params.id,
      ownerId: req.session.user.id,
    });
    if (!doc) return res.status(404).json({ error: "Course not found" });
    res.json(doc.notes?.[req.params.nodeId] ?? []);
  });

  // Replace the notes for a single node (owner only). Node ids contain dots, so
  // we read-modify-write the map in JS rather than using a dotted $set path.
  app.put("/api/courses/:id/notes/:nodeId", requireAuth, async (req, res) => {
    const doc = await courses.findOne({
      id: req.params.id,
      ownerId: req.session.user.id,
    });
    if (!doc) return res.status(404).json({ error: "Course not found" });

    const notes = sanitizeNotes(req.body?.notes);
    const map = { ...(doc.notes ?? {}) };
    if (notes.length === 0) delete map[req.params.nodeId];
    else map[req.params.nodeId] = notes;

    await courses.updateOne(
      { id: doc.id },
      { $set: { notes: map, updatedAt: new Date().toISOString() } }
    );
    res.json(notes);
  });

  // Read the attachments for a single node (owner only).
  app.get(
    "/api/courses/:id/attachments/:nodeId",
    requireAuth,
    async (req, res) => {
      const doc = await courses.findOne({
        id: req.params.id,
        ownerId: req.session.user.id,
      });
      if (!doc) return res.status(404).json({ error: "Course not found" });
      res.json(doc.attachments?.[req.params.nodeId] ?? []);
    }
  );

  // Replace the attachments for a single node (owner only).
  app.put(
    "/api/courses/:id/attachments/:nodeId",
    requireAuth,
    async (req, res) => {
      const doc = await courses.findOne({
        id: req.params.id,
        ownerId: req.session.user.id,
      });
      if (!doc) return res.status(404).json({ error: "Course not found" });

      const attachments = sanitizeAttachments(req.body?.attachments);
      const map = { ...(doc.attachments ?? {}) };
      if (attachments.length === 0) delete map[req.params.nodeId];
      else map[req.params.nodeId] = attachments;

      await courses.updateOne(
        { id: doc.id },
        { $set: { attachments: map, updatedAt: new Date().toISOString() } }
      );
      res.json(attachments);
    }
  );

  // Public, unauthenticated read of a shared course. Returns 404 unless the
  // course exists AND its owner has made it public — so a stale/guessed link to
  // a now-private course leaks nothing.
  app.get("/api/public/courses/:publicId", async (req, res) => {
    const doc = await courses.findOne({
      publicId: req.params.publicId,
      isPublic: true,
    });
    if (!doc) return res.status(404).json({ error: "Course not found" });
    res.json(toPublicCourse(doc));
  });
}
