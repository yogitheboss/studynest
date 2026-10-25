import { useEffect, useState } from "react";

import { listTodos } from "../services/journalApi";
import type { TodoSummary } from "../types";

interface UseTodoListResult {
  /** null until the first load finishes. */
  notes: TodoSummary[] | null;
  error: string | null;
}

/** The user's todo notes, newest edit first. Reloads when `version` bumps. */
export const useTodoList = (version: number): UseTodoListResult => {
  const [notes, setNotes] = useState<TodoSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTodos()
      .then((list) => {
        if (!active) return;
        setNotes(list);
        setError(null);
      })
      // Keep showing the last good list if a refresh fails.
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [version]);

  return { notes, error };
};
