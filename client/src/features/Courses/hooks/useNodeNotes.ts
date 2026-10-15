import { useCallback, useEffect, useState } from "react";

import type { Note } from "../types";
import { saveNotes } from "../services/coursesApi";
import { notesCache } from "../services/nodeContentCache";

interface UseNodeNotesResult {
  notes: Note[];
  /** Create a note from the given text. No-ops on empty/whitespace-only text. */
  addNote: (text: string) => void;
  /** Replace the body of an existing note and stamp `updatedAt`. */
  updateNote: (id: string, text: string) => void;
  /** Remove a note from this node. */
  removeNote: (id: string) => void;
}

/**
 * Owns the free-text notes for a single course node, backed by the server.
 * Loads when the node selection changes and persists the whole list on every
 * mutation. Mirrors {@link useNodeAttachments}.
 */
export const useNodeNotes = (
  courseId: string,
  nodeId: string
): UseNodeNotesResult => {
  // Seed from cache so revisiting an already-loaded node paints instantly with
  // no fetch flash. Empty array when this node hasn't been loaded yet.
  const [notes, setNotes] = useState<Note[]>(
    () => notesCache.peek(courseId, nodeId) ?? []
  );

  // (Re)load when the selected node (or course) changes. A cache hit short-
  // circuits the request; a miss loads (deduped with any hover-prefetch).
  useEffect(() => {
    let active = true;
    const cached = notesCache.peek(courseId, nodeId);
    if (cached) {
      setNotes(cached);
      return;
    }
    notesCache
      .load(courseId, nodeId)
      .then((loaded) => {
        if (active) setNotes(loaded);
      })
      .catch(() => {
        if (active) setNotes([]);
      });
    return () => {
      active = false;
    };
  }, [courseId, nodeId]);

  // Optimistically apply locally, update the cache so a later revisit sees the
  // new state, then persist. Persistence failures are swallowed to keep the
  // editing UI responsive (matches the prior behaviour).
  const persist = useCallback(
    (next: Note[]) => {
      setNotes(next);
      notesCache.set(courseId, nodeId, next);
      void saveNotes(courseId, nodeId, next).catch(() => {});
    },
    [courseId, nodeId]
  );

  const addNote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const note: Note = {
        id: crypto.randomUUID(),
        text: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      persist([note, ...notes]);
    },
    [persist, notes]
  );

  const updateNote = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      persist(
        notes.map((note) =>
          note.id === id
            ? { ...note, text: trimmed, updatedAt: new Date().toISOString() }
            : note
        )
      );
    },
    [persist, notes]
  );

  const removeNote = useCallback(
    (id: string) => {
      persist(notes.filter((note) => note.id !== id));
    },
    [persist, notes]
  );

  return { notes, addNote, updateNote, removeNote };
};
