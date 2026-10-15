import type { JournalEntry, JournalSummary } from "../types";

/** API origin. Mirrors the auth client's fallback for local development. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_AUTH_BASE_URL ??
  "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!response.ok) {
    const message = await response
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => null);
    throw new Error(message ?? `Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export const listEntries = (): Promise<JournalSummary[]> =>
  request("/api/journal");

export const getEntry = (date: string): Promise<JournalEntry> =>
  request(`/api/journal/${date}`);

export const saveEntry = (
  date: string,
  markdown: string
): Promise<JournalEntry> =>
  request(`/api/journal/${date}`, {
    method: "PUT",
    body: JSON.stringify({ markdown }),
  });

/** Gemini: corrected markdown for the given markdown. */
export const fixEntry = (markdown: string): Promise<{ markdown: string }> =>
  request("/api/journal/fix", {
    method: "POST",
    body: JSON.stringify({ markdown }),
  });

/** Gemini: markdown transcription of a voice note. The audio isn't stored. */
export const transcribeAudio = async (audio: Blob): Promise<string> => {
  const form = new FormData();
  const ext = audio.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", audio, `note.${ext}`);
  // Raw fetch: request() would force a JSON Content-Type over the multipart one.
  const response = await fetch(`${API_BASE_URL}/api/journal/transcribe`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = (await response.json().catch(() => ({}))) as {
    markdown?: string;
    error?: string;
  };
  if (!response.ok || !data.markdown) {
    throw new Error(data.error ?? `Transcription failed (${response.status}).`);
  }
  return data.markdown;
};
