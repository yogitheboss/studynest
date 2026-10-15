import { randomUUID } from "node:crypto";
import { z } from "zod";

// Validation + normalization layer. Request bodies are either *rejected* (the
// visibility/create gates) or *coerced* into a safe stored shape (notes,
// attachments, the course tree) so we never persist arbitrary client structure.

const MAX_DEPTH = 6;
const MAX_NODE_TEXT = 20_000;

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value, max) =>
  typeof value === "string" ? value.slice(0, max) : "";

// A course tree can arrive with children under any of these aliases; we accept
// the first array we find and store it under the canonical `children`.
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
// enforcing types/depth. Mirrors the client's parseCourse. Returns null if the
// node is unusable. Kept as a plain recursive function — depth-limited recursion
// over aliased child keys is clearer here than a z.lazy() schema.
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

/** Normalize a raw course root into the stored tree, or null if unusable. */
export const normalizeCourseTree = (root) => sanitizeNode(root, "root", 0);

// Like sanitizeNode, but *preserves* each node's existing `id` instead of
// re-deriving it from position. Editing the tree (add/remove/reorder) must not
// renumber surviving nodes, or the notes/attachments maps — keyed by node id —
// would silently point at the wrong nodes. New nodes arrive with a client-made
// id; anything missing one falls back to a positional id.
function sanitizeNodeKeepingId(raw, depth, fallbackId) {
  if (!isRecord(raw)) return null;
  if (typeof raw.title !== "string" || raw.title.trim() === "") return null;

  const id =
    typeof raw.id === "string" && raw.id.trim() !== ""
      ? raw.id.trim().slice(0, 200)
      : fallbackId;

  const node = { id, title: raw.title.trim(), depth, children: [] };
  if (typeof raw.description === "string" && raw.description.trim() !== "") {
    node.description = raw.description.trim().slice(0, MAX_NODE_TEXT);
  }

  if (depth < MAX_DEPTH) {
    const rawChildren =
      CHILD_KEYS.map((key) => raw[key]).find(Array.isArray) ?? [];
    rawChildren.forEach((child, index) => {
      const childNode = sanitizeNodeKeepingId(
        child,
        depth + 1,
        `${id}.${index}`
      );
      if (childNode) node.children.push(childNode);
    });
  }
  return node;
}

/** Normalize an edited course tree, preserving existing node ids. */
export const normalizeCourseTreeKeepingIds = (root) =>
  sanitizeNodeKeepingId(root, 0, "root");

// POST /api/courses — accept an optional name and any root, normalize the tree,
// and reject if it didn't yield a valid course.
export const createCourseSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    root: z.unknown(),
  })
  .transform(({ name, root }) => ({ name, root: normalizeCourseTree(root) }))
  .refine((value) => value.root !== null, {
    message: "A valid course tree is required.",
    path: ["root"],
  });

// PUT /api/courses/:id — replace the (edited) course tree, keeping node ids so
// the per-node notes/attachments stay attached to the right nodes.
export const updateCourseSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    root: z.unknown(),
  })
  .transform(({ name, root }) => ({
    name,
    root: normalizeCourseTreeKeepingIds(root),
  }))
  .refine((value) => value.root !== null, {
    message: "A valid course tree is required.",
    path: ["root"],
  });

// PATCH /api/courses/:id/visibility — strictly a boolean.
export const visibilitySchema = z.object({ isPublic: z.boolean() });

// One persisted note. Coerces every field so malformed input never throws;
// missing/blank ids get a fresh uuid. Mirrors the old sanitizeNotes item.
const noteSchema = z
  .preprocess((value) => (isRecord(value) ? value : {}), z.looseObject({}))
  .transform((raw) => ({
    id: asString(raw.id, 100) || randomUUID(),
    text: asString(raw.text, MAX_NODE_TEXT),
    createdAt: asString(raw.createdAt, 40),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  }));

// One persisted attachment, coerced the same lenient way.
const attachmentSchema = z
  .preprocess((value) => (isRecord(value) ? value : {}), z.looseObject({}))
  .transform((raw) => ({
    id: asString(raw.id, 100) || randomUUID(),
    name: asString(raw.name, 500),
    url: asString(raw.url, 2000),
    objectName: asString(raw.objectName, 500),
    contentType: asString(raw.contentType, 200),
    size: typeof raw.size === "number" ? raw.size : 0,
    uploadedAt: asString(raw.uploadedAt, 40),
  }));

// Non-arrays collapse to []; the list is capped at 500 before coercion. These
// never reject — PUT notes/attachments is normalization, not a gate.
export const notesSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value.slice(0, 500) : []),
  z.array(noteSchema)
);

export const attachmentsSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value.slice(0, 500) : []),
  z.array(attachmentSchema)
);
