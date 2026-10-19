import { GoogleGenAI } from "@google/genai";

// Tried in order; the next one is used when a model is overloaded/unavailable.
// Override via .env (comma-separated) when Google retires or overloads one.
const MODELS = (
  process.env.GEMINI_MODEL || "gemini-3.1-flash-lite,gemini-3.5-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Overloaded, rate-limited, timed out or retired → worth trying the next model.
const isTransient = (err) =>
  [404, 429, 500, 503, 504].includes(err.status) || err.name === "AbortError";

const FORMAT_PROMPT = `Below is a raw speech-to-text transcript of a student describing what they studied and worked on today.
Turn it into a clean markdown journal snippet: short bullet points, grouped under small "###" headings by topic if there are several topics.
Fix transcription errors, filler words and false starts, but keep every fact they mentioned. Do not invent anything.
Return only the markdown, no preamble and no code fences.`;

const TODO_PROMPT = `Below is a raw speech-to-text transcript of a student listing things they need to do, plans and ideas.
Turn it into a markdown checklist: one "- [ ] " item per task, short and actionable.
If the items span several areas (e.g. study, projects, ideas), group them under small "###" headings; otherwise no headings.
Fix transcription errors, filler words and false starts, but keep every task they mentioned. Do not invent anything.
Return only the markdown, no preamble and no code fences.`;

const FIX_PROMPT = `You are editing a student's markdown notes (a study journal or a todo checklist).
Fix spelling, grammar and markdown formatting (consistent headings, lists, spacing).
Keep the meaning, the language, the voice and all of the content — do not add, summarize or remove information.
Return only the corrected markdown, no preamble and no code fences.`;

// Created on first use so the server still boots without a key configured.
let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("AI is not configured (GEMINI_API_KEY missing).");
    err.expose = true;
    throw err;
  }
  client ??= new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    // The SDK's default is 5 attempts with up-to-60s backoff, which can stall a
    // request for minutes. Fail fast and let generate() fall through to the next model.
    httpOptions: { timeout: 15_000, retryOptions: { attempts: 1 } },
  });
  return client;
};

// Models sometimes wrap output in ```markdown fences despite being told not to.
const stripFences = (text) =>
  (text ?? "")
    .trim()
    .replace(/^```(?:markdown|md)?\s*\n/i, "")
    .replace(/\n?```$/, "")
    .trim();

const generate = async (label, prompt, text) => {
  let lastErr;
  for (const model of MODELS) {
    const started = Date.now();
    try {
      const res = await getClient().models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: `${prompt}\n\n---\n\n${text}` }] },
        ],
      });
      console.log(
        `[journal] gemini ${label} ok with ${model} in ${Date.now() - started}ms`
      );
      return stripFences(res.text);
    } catch (err) {
      console.warn(
        `[journal] gemini ${label} failed with ${model} in ${Date.now() - started}ms (status ${err.status ?? err.name})`
      );
      lastErr = err;
      if (!isTransient(err)) break;
    }
  }
  throw lastErr;
};

/** Raw transcript → formatted markdown snippet (journal notes or a todo checklist). */
export const formatTranscript = (transcript, kind = "journal") =>
  kind === "todo"
    ? generate("todo", TODO_PROMPT, transcript)
    : generate("format", FORMAT_PROMPT, transcript);

/** Fix spelling/grammar/formatting of an existing entry. */
export const fixMarkdown = (markdown) => generate("fix", FIX_PROMPT, markdown);
