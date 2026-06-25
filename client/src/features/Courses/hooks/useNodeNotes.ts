import { useCallback, useEffect, useState } from "react";

import type { Note } from "../types";
import { loadNotes, saveNotes } from "../lib/notes";

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
 * Owns the free-text notes for a single course node, backed by localStorage.
 * Re-reads when the node selection changes and persists on every mutation.
 * Mirrors {@link useNodeAttachments}.
 */
export const useNodeNotes = (
  courseId: string,
  nodeId: string
): UseNodeNotesResult => {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes(courseId, nodeId));

  // Reload when the selected node (or course) changes.
  useEffect(() => {
    setNotes(loadNotes(courseId, nodeId));
  }, [courseId, nodeId]);

  // Persist after any change to this node's list.
  useEffect(() => {
    saveNotes(courseId, nodeId, notes);
  }, [courseId, nodeId, notes]);

  const addNote = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note: Note = {
      id: crypto.randomUUID(),
      text: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setNotes((prev) => [note, ...prev]);
  }, []);

  const updateNote = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, text: trimmed, updatedAt: new Date().toISOString() }
          : note
      )
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  return { notes, addNote, updateNote, removeNote };
};
