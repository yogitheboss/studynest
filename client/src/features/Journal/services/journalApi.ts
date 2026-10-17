import { API_BASE_URL, request } from "@/lib/api";
import type { JournalEntry, JournalSummary } from "../types";

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
