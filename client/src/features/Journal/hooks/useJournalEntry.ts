import { useCallback, useEffect, useRef, useState } from "react";

import { getEntry, saveEntry } from "../services/journalApi";
import type { SaveStatus } from "../types";

const SAVE_DELAY_MS = 1000;

// Last-known markdown per path (fetched or typed), so revisiting a doc —
// journal ↔ todo notes, past days — renders instantly while a fetch revalidates it.
const cache = new Map<string, string>();
// Latest save per path; a revalidating fetch waits for it so it can't read the
// doc from before that save landed and roll back the user's last edit.
const lastSave = new Map<string, Promise<unknown>>();

/** Warm the cache for a doc the user is likely to open next. */
export const prefetchDoc = (path: string): void => {
  if (cache.has(path)) return;
  getEntry(path)
    .then((entry) => {
      if (!cache.has(path)) cache.set(path, entry.markdown);
    })
    .catch(() => {});
};

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
 * Loads one markdown doc (a day's entry, or a todo note's notes) from `path` and
 * debounce-saves edits. A pending save is flushed (not dropped) when the path
 * changes or the view unmounts, and save failures surface as `status: "error"`
 * instead of being swallowed.
 */
export const useJournalEntry = (path: string): UseJournalEntryResult => {
  const [markdown, setMarkdownState] = useState<string>("");
  // Which path the current markdown/error belongs to; loading until it matches.
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedCount, setSavedCount] = useState<number>(0);

  // Cached doc for a new path: show it this render instead of a spinner.
  const cachedNow = cache.get(path);
  if (loadedPath !== path && cachedNow !== undefined) {
    setMarkdownState(cachedNow);
    setError(null);
    setStatus("idle");
    setLoadedPath(path);
  }

  const pending = useRef<{ path: string; markdown: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    setStatus("saving");
    const save = saveEntry(job.path, job.markdown);
    lastSave.set(
      job.path,
      save.catch(() => {})
    );
    save
      .then(() => {
        // A newer edit may have queued while this one was in flight.
        if (!pending.current) setStatus("saved");
        setSavedCount((n) => n + 1);
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    let active = true;
    const cached = cache.get(path);
    // ponytail: last-write-wins, same as before — typing over a stale cached
    // copy before this fetch returns still overwrites another device's edit.
    (lastSave.get(path) ?? Promise.resolve())
      .then(() => getEntry(path))
      .then((entry) => {
        // Edited since we showed the cached copy? Keep the user's text.
        if (cached !== undefined && cache.get(path) !== cached) return;
        cache.set(path, entry.markdown);
        if (!active) return;
        setMarkdownState(entry.markdown);
        setError(null);
        setStatus("idle");
        setLoadedPath(path);
      })
      .catch((err: Error) => {
        // A failed revalidation leaves the cached copy on screen.
        if (!active || cached !== undefined) return;
        setError(err.message);
        setLoadedPath(path);
      });
    return () => {
      active = false;
      flush();
    };
  }, [path, flush]);

  const setMarkdown = useCallback(
    (next: string) => {
      setMarkdownState(next);
      cache.set(path, next);
      pending.current = { path, markdown: next };
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [path, flush]
  );

  const loading = loadedPath !== path;
  return {
    markdown,
    setMarkdown,
    loading,
    error: loading ? null : error,
    status,
    savedCount,
  };
};
