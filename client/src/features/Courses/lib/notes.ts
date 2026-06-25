import type { Note } from "../types";

const STORAGE_KEY = "studynest.notes.v1";

/** All notes, keyed by `${courseId}::${nodeId}`. */
type NoteMap = Record<string, Note[]>;

const keyFor = (courseId: string, nodeId: string): string =>
  `${courseId}::${nodeId}`;

const readMap = (): NoteMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as NoteMap) : {};
  } catch {
    return {};
  }
};

const writeMap = (map: NoteMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full or unavailable — non-fatal for this UI */
  }
};

/** Read the notes for a single node. Returns [] when none exist. */
export const loadNotes = (courseId: string, nodeId: string): Note[] =>
  readMap()[keyFor(courseId, nodeId)] ?? [];

/** Persist the notes for a single node. */
export const saveNotes = (
  courseId: string,
  nodeId: string,
  notes: Note[]
): void => {
  const map = readMap();
  if (notes.length === 0) delete map[keyFor(courseId, nodeId)];
  else map[keyFor(courseId, nodeId)] = notes;
  writeMap(map);
};
