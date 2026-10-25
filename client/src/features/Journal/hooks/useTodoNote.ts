import { useCallback, useEffect, useRef, useState } from "react";

import { getTodo, updateTodo } from "../services/journalApi";
import type { SaveStatus, TodoNote, TodoPatch } from "../types";

const SAVE_DELAY_MS = 500;

// All note saves run one after another so a slow request can't land after a
// newer one, and a (re)load waits for them so it can't read a stale note.
let saves: Promise<unknown> = Promise.resolve();

interface UseTodoNoteResult {
  note: TodoNote | null;
  loading: boolean;
  error: string | null;
  /** Apply a change now and save it shortly (changes are batched). */
  update: (patch: TodoPatch) => void;
  status: SaveStatus;
  /** Bumps after every successful save so the notes list can refresh. */
  savedCount: number;
}

/**
 * Loads a todo note's title, date and tasks and debounce-saves changes. Like
 * useJournalEntry, a pending save is flushed (not dropped) when the note
 * changes or the view unmounts, and failures surface as `status: "error"`.
 */
export const useTodoNote = (id: string): UseTodoNoteResult => {
  const [note, setNote] = useState<TodoNote | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedCount, setSavedCount] = useState<number>(0);

  const pending = useRef<{ id: string; patch: TodoPatch } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setStatus("saving");
    saves = saves
      .then(() => updateTodo(job.id, job.patch))
      .then(
        () => {
          // A newer change may have queued while this one was in flight.
          if (!pending.current) setStatus("saved");
          setSavedCount((n) => n + 1);
        },
        () => setStatus("error")
      );
  }, []);

  useEffect(() => {
    let active = true;
    saves
      .then(() => getTodo(id))
      .then((loaded) => {
        if (!active) return;
        setNote(loaded);
        setStatus("idle");
      })
      .catch((err: Error) => active && setError({ id, message: err.message }));
    return () => {
      active = false;
      flush();
    };
  }, [id, flush]);

  const update = useCallback(
    (patch: TodoPatch) => {
      setNote((n) => n && { ...n, ...patch });
      const queued = pending.current?.id === id ? pending.current.patch : {};
      pending.current = { id, patch: { ...queued, ...patch } };
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [id, flush]
  );

  // Ignore state left over from the previous note until this one loads.
  const current = note?.id === id ? note : null;
  const currentError = error?.id === id ? error.message : null;
  return {
    note: current,
    loading: !current && !currentError,
    error: currentError,
    update,
    status,
    savedCount,
  };
};
