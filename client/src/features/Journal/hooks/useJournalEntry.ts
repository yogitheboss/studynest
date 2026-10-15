import { useCallback, useEffect, useRef, useState } from "react";

import { getEntry, saveEntry } from "../services/journalApi";
import type { SaveStatus } from "../types";

const SAVE_DELAY_MS = 1000;

interface UseJournalEntryResult {
  markdown: string;
  setMarkdown: (markdown: string) => void;
  loading: boolean;
  error: string | null;
  status: SaveStatus;
  /** Bumps after every successful save so the past-days list can refresh. */
  savedCount: number;
}

/**
 * Loads one day's entry and debounce-saves edits. A pending save is flushed
 * (not dropped) when the date changes or the view unmounts, and save failures
 * surface as `status: "error"` instead of being swallowed.
 */
export const useJournalEntry = (date: string): UseJournalEntryResult => {
  const [markdown, setMarkdownState] = useState<string>("");
  // Which date the current markdown/error belongs to; loading until it matches.
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedCount, setSavedCount] = useState<number>(0);

  const pending = useRef<{ date: string; markdown: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setStatus("saving");
    saveEntry(job.date, job.markdown)
      .then(() => {
        // A newer edit may have queued while this one was in flight.
        if (!pending.current) setStatus("saved");
        setSavedCount((n) => n + 1);
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    let active = true;
    getEntry(date)
      .then((entry) => {
        if (!active) return;
        setMarkdownState(entry.markdown);
        setError(null);
        setStatus("idle");
        setLoadedDate(date);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        setLoadedDate(date);
      });
    return () => {
      active = false;
      flush();
    };
  }, [date, flush]);

  const setMarkdown = useCallback(
    (next: string) => {
      setMarkdownState(next);
      pending.current = { date, markdown: next };
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [date, flush]
  );

  const loading = loadedDate !== date;
  return {
    markdown,
    setMarkdown,
    loading,
    error: loading ? null : error,
    status,
    savedCount,
  };
};
