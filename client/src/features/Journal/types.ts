/** A saved markdown doc: one day's journal entry or a todo note's notes. */
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

export interface TodoTask {
  id: string;
  text: string;
  done: boolean;
}

/** A todo note without its "Remember" markdown (that loads like a MarkdownDoc). */
export interface TodoNote {
  id: string;
  title: string;
  /** YYYY-MM-DD for a daily note; null for "someday". */
  date: string | null;
  tasks: TodoTask[];
  updatedAt: string;
}

export type TodoPatch = Partial<Pick<TodoNote, "title" | "date" | "tasks">>;

/** Row in the notes list: task counts instead of the tasks. */
export interface TodoSummary extends Omit<TodoNote, "tasks"> {
  done: number;
  total: number;
}
