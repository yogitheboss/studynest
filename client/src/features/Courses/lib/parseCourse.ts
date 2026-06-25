import type { CourseDraft, CourseInputNode, CourseNode } from "../types";

/** Discriminated result so callers can render either the draft or errors. */
export type ParseResult =
  | { ok: true; course: CourseDraft }
  | { ok: false; errors: string[] };

/** Keys that, on any node, are treated as the array of child nodes. */
const CHILD_KEYS = [
  "children",
  "modules",
  "topics",
  "chapters",
  "subtopics",
  "lessons",
  "items",
] as const satisfies readonly (keyof CourseInputNode)[];

const MAX_DEPTH = 6;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Pull the first present, array-valued child key from a raw node. */
const readChildren = (raw: Record<string, unknown>): unknown[] => {
  for (const key of CHILD_KEYS) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

/**
 * Recursively validate + normalize one raw node. Pushes human-readable
 * messages into `errors` (keyed by a path like `root.modules[0]`) and returns
 * the normalized node, or null if this node is unrecoverable.
 */
const normalizeNode = (
  raw: unknown,
  id: string,
  path: string,
  depth: number,
  errors: string[]
): CourseNode | null => {
  if (!isRecord(raw)) {
    errors.push(`${path}: expected an object, received ${typeof raw}.`);
    return null;
  }

  const title = raw.title;
  if (typeof title !== "string" || title.trim() === "") {
    errors.push(`${path}: "title" is required and must be a non-empty string.`);
    return null;
  }

  const description =
    typeof raw.description === "string" && raw.description.trim() !== ""
      ? raw.description.trim()
      : undefined;

  const children: CourseNode[] = [];
  if (depth < MAX_DEPTH) {
    readChildren(raw).forEach((child, index) => {
      const node = normalizeNode(
        child,
        `${id}.${index}`,
        `${path} › ${title.trim()}[${index}]`,
        depth + 1,
        errors
      );
      if (node) children.push(node);
    });
  }

  return { id, title: title.trim(), description, depth, children };
};

/**
 * Parse raw JSON text into a Course. Reports JSON syntax errors and schema
 * violations separately so the UI can guide the user.
 */
export const parseCourseJson = (jsonText: string): ParseResult => {
  const trimmed = jsonText.trim();
  if (trimmed === "") {
    return { ok: false, errors: ["Paste or upload some JSON to continue."] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown parsing error.";
    return { ok: false, errors: [`Invalid JSON: ${message}`] };
  }

  const errors: string[] = [];
  const root = normalizeNode(parsed, "root", "root", 0, errors);

  if (!root) {
    return {
      ok: false,
      errors: errors.length
        ? errors
        : ["The top-level value must be a course object with a title."],
    };
  }

  // Non-fatal warnings still surface, but the root parsed — let it through.
  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    course: {
      name: root.title,
      root,
    },
  };
};

/** Flatten a node tree into a list (depth-first), useful for counts/search. */
export const flattenNodes = (node: CourseNode): CourseNode[] => [
  node,
  ...node.children.flatMap(flattenNodes),
];
