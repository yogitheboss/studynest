import type { Attachment } from "../types";

const STORAGE_KEY = "studynest.attachments.v1";

/** All attachments, keyed by `${courseId}::${nodeId}`. */
type AttachmentMap = Record<string, Attachment[]>;

const keyFor = (courseId: string, nodeId: string): string =>
  `${courseId}::${nodeId}`;

const readMap = (): AttachmentMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as AttachmentMap)
      : {};
  } catch {
    return {};
  }
};

const writeMap = (map: AttachmentMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full or unavailable — non-fatal for this UI */
  }
};

/** Read the attachments for a single node. Returns [] when none exist. */
export const loadAttachments = (
  courseId: string,
  nodeId: string
): Attachment[] => readMap()[keyFor(courseId, nodeId)] ?? [];

/** Persist the attachments for a single node. */
export const saveAttachments = (
  courseId: string,
  nodeId: string,
  attachments: Attachment[]
): void => {
  const map = readMap();
  if (attachments.length === 0) delete map[keyFor(courseId, nodeId)];
  else map[keyFor(courseId, nodeId)] = attachments;
  writeMap(map);
};
