/** One day's journal entry. `date` is the client's local YYYY-MM-DD. */
export interface JournalEntry {
  date: string;
  markdown: string;
  updatedAt: string | null;
}

/** Row in the past-days list. */
export interface JournalSummary {
  date: string;
  preview: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
