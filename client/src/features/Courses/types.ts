/**
 * Domain types for courses.
 *
 * A course is a recursive tree. The depth of a node determines its "kind":
 *
 *   depth 0 → Course   (the root, named after the whole subject)
 *   depth 1 → Module   (a major part of the course)
 *   depth 2 → Topic    (a subject inside a module)
 *   depth 3+ → Subtopic (anything deeper)
 *
 * The uploaded JSON uses the raw `CourseInputNode` shape (loose, human/LLM
 * authored). After validation it is normalized into `CourseNode`, where every
 * node has a stable id and a concrete `children` array.
 */

/** Human/LLM-authored shape accepted from uploaded or pasted JSON. */
export interface CourseInputNode {
  title: string;
  description?: string;
  /**
   * Child nodes. Any of these keys is accepted as the children array so the
   * generated JSON can read naturally at each level
   * (modules → topics → subtopics …).
   */
  children?: CourseInputNode[];
  modules?: CourseInputNode[];
  topics?: CourseInputNode[];
  chapters?: CourseInputNode[];
  subtopics?: CourseInputNode[];
  lessons?: CourseInputNode[];
  items?: CourseInputNode[];
}

/** Normalized node used throughout the app. */
export interface CourseNode {
  /** Stable, path-based id (e.g. "root", "root.0", "root.0.2"). */
  id: string;
  title: string;
  description?: string;
  /** Depth from the course root (root = 0). */
  depth: number;
  children: CourseNode[];
}

/** A fully parsed, persisted course. */
export interface Course {
  /** Unique id for this course instance. */
  id: string;
  /** Convenience mirror of `root.title`. */
  name: string;
  /** ISO timestamp string. */
  createdAt: string;
  root: CourseNode;
}

/** A file uploaded as content for a single course node. */
export interface Attachment {
  /** Client-generated id, stable for the lifetime of the attachment. */
  id: string;
  /** Original filename as chosen by the user. */
  name: string;
  /** Public GCS URL the file is served from. */
  url: string;
  /** GCS object key (the server's `name`), used for future deletes. */
  objectName: string;
  /** MIME type reported on upload. */
  contentType: string;
  /** Size in bytes. */
  size: number;
  /** ISO timestamp string. */
  uploadedAt: string;
}

/** Names for each depth level, clamped to the last entry when deeper. */
export const LEVEL_LABELS = ["Course", "Module", "Topic", "Subtopic"] as const;

export const levelLabel = (depth: number): string =>
  LEVEL_LABELS[Math.min(depth, LEVEL_LABELS.length - 1)];
