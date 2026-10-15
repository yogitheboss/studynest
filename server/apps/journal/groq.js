// Speech-to-text via Groq's hosted Whisper (OpenAI-compatible endpoint).
const URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

const EXT = {
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export async function transcribeAudio(buffer, mimeType) {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error(
      "Transcription is not configured (GROQ_API_KEY missing)."
    );
    err.expose = true;
    throw err;
  }
  const form = new FormData();
  // Groq infers the format from the filename extension.
  form.append(
    "file",
    new Blob([buffer], { type: mimeType }),
    `note.${EXT[mimeType] ?? "webm"}`
  );
  form.append("model", MODEL);
  form.append("response_format", "json");

  const started = Date.now();
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.text ?? "").trim();
  console.log(
    `[journal] groq transcribed ${(buffer.length / 1024).toFixed(0)}KB ${mimeType} in ${Date.now() - started}ms → ${text.length} chars: ${JSON.stringify(text.slice(0, 80))}`
  );
  return text;
}
