import { useEffect, useState } from "react";

import { listEntries } from "../services/journalApi";
import type { JournalSummary } from "../types";

/** Past days that have an entry, newest first. Reloads when `version` bumps. */
export const useJournalList = (version: number): JournalSummary[] => {
  const [entries, setEntries] = useState<JournalSummary[]>([]);

  useEffect(() => {
    let active = true;
    listEntries()
      .then(
        (list) => active && setEntries(list.filter((e) => e.preview.trim()))
      )
      .catch(() => {}); // the list is a convenience; the editor shows real errors
    return () => {
      active = false;
    };
  }, [version]);

  return entries;
};
