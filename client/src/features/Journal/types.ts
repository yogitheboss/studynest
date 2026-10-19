/** A saved markdown doc: one day's journal entry or the todo list. */
export interface MarkdownDoc {
  markdown: string;
  updatedAt: string | null;
}

/** Row in the past-days list. */
export interface JournalSummary {
  date: string;
  preview: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
