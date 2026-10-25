import { API_BASE_URL, request } from "@/lib/api";
import type {
  JournalSummary,
  MarkdownDoc,
  TodoNote,
  TodoPatch,
  TodoSummary,
} from "../types";

export const listEntries = (): Promise<JournalSummary[]> =>
  request("/api/journal");

/** Path of one day's entry. */
export const entryPath = (date: string): string => `/api/journal/${date}`;
/** Path of a todo note's "Remember" markdown, loaded like a journal entry. */
export const todoNotesPath = (id: string): string => `/api/todos/${id}/notes`;

export const getEntry = (path: string): Promise<MarkdownDoc> => request(path);

export const saveEntry = (
  path: string,
  markdown: string
): Promise<MarkdownDoc> =>
  request(path, {
    method: "PUT",
    body: JSON.stringify({ markdown }),
  });

export const listTodos = (): Promise<TodoSummary[]> => request("/api/todos");

export const createTodo = (
  fields: Pick<TodoPatch, "title" | "date">
): Promise<TodoNote> =>
  request("/api/todos", { method: "POST", body: JSON.stringify(fields) });

export const getTodo = (id: string): Promise<TodoNote> =>
  request(`/api/todos/${id}`);

export const updateTodo = (id: string, patch: TodoPatch): Promise<TodoNote> =>
  request(`/api/todos/${id}`, { method: "PATCH", body: JSON.stringify(patch) });

export const deleteTodo = (id: string): Promise<void> =>
  request(`/api/todos/${id}`, { method: "DELETE" });

/** Gemini: corrected markdown for the given markdown. */
export const fixEntry = (markdown: string): Promise<{ markdown: string }> =>
  request("/api/journal/fix", {
    method: "POST",
    body: JSON.stringify({ markdown }),
  });

/**
 * Gemini: markdown transcription of a voice note, as journal notes or (kind
 * "todo") a checklist. The audio isn't stored.
 */
export const transcribeAudio = async (
  audio: Blob,
  kind: "journal" | "todo" = "journal"
): Promise<string> => {
  const form = new FormData();
  const ext = audio.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", audio, `note.${ext}`);
  // Raw fetch: request() would force a JSON Content-Type over the multipart one.
  const response = await fetch(
    `${API_BASE_URL}/api/journal/transcribe?kind=${kind}`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    markdown?: string;
    error?: string;
  };
  if (!response.ok || !data.markdown) {
    throw new Error(data.error ?? `Transcription failed (${response.status}).`);
  }
  return data.markdown;
};
