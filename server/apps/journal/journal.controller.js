import { journalService } from "./journal.service.js";
import { fixMarkdown, formatTranscript } from "./gemini.js";
import { transcribeAudio } from "./groq.js";
import { dateSchema, markdownBodySchema } from "./journal.schema.js";

const badRequest = (res, parsed) =>
  res
    .status(400)
    .json({ error: parsed.error.issues[0]?.message ?? "Invalid request." });

// AI failures become clean JSON errors instead of unhandled rejections. Only
// our own "not configured" errors (err.expose) are shown verbatim.
async function aiResponse(res, run) {
  try {
    const markdown = await run();
    if (!markdown) {
      return res.status(502).json({ error: "AI returned nothing. Try again." });
    }
    res.json({ markdown });
  } catch (err) {
    console.error("AI request failed:", err.message);
    if (err.expose) return res.status(503).json({ error: err.message });
    res.status(502).json({ error: "AI request failed. Try again." });
  }
}

export const journalController = {
  // GET /api/journal
  async list(req, res) {
    res.json(await journalService.list(req.session.user.id));
  },

  // GET /api/journal/:date — empty entry if nothing written that day yet.
  async get(req, res) {
    const date = dateSchema.safeParse(req.params.date);
    if (!date.success) return badRequest(res, date);
    res.json(await journalService.get(req.session.user.id, date.data));
  },

  // PUT /api/journal/:date
  async save(req, res) {
    const date = dateSchema.safeParse(req.params.date);
    if (!date.success) return badRequest(res, date);
    const body = markdownBodySchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    res.json(
      await journalService.upsert(
        req.session.user.id,
        date.data,
        body.data.markdown
      )
    );
  },

  // GET /api/todos — the user's single, undated todo list.
  async getTodos(req, res) {
    res.json(await journalService.getTodos(req.session.user.id));
  },

  // PUT /api/todos
  async saveTodos(req, res) {
    const body = markdownBodySchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    res.json(
      await journalService.saveTodos(req.session.user.id, body.data.markdown)
    );
  },

  // POST /api/journal/transcribe[?kind=todo] — multipart "audio"; Groq Whisper
  // → Gemini formatting. Returns markdown, saves nothing (client appends + saves).
  async transcribe(req, res) {
    if (!req.file) return res.status(400).json({ error: "No audio provided." });
    // Drop ";codecs=opus" and relabel video/webm-style recordings as audio.
    const mimeType = req.file.mimetype
      .split(";")[0]
      .replace(/^video\//, "audio/");
    const started = Date.now();
    console.log(
      `[journal] transcribe start: ${(req.file.size / 1024).toFixed(0)}KB ${req.file.mimetype}`
    );
    await aiResponse(res, async () => {
      const transcript = await transcribeAudio(req.file.buffer, mimeType);
      if (!transcript) return "";
      // Formatting is a nice-to-have: if Gemini is down, keep the raw words.
      const kind = req.query.kind === "todo" ? "todo" : "journal";
      return formatTranscript(transcript, kind).catch((err) => {
        console.error(
          "Gemini formatting failed, using raw transcript:",
          err.message
        );
        return transcript;
      });
    });
    console.log(`[journal] transcribe done in ${Date.now() - started}ms`);
  },

  // POST /api/journal/fix — { markdown } in, corrected { markdown } out.
  async fix(req, res) {
    const body = markdownBodySchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    if (!body.data.markdown.trim()) return res.json({ markdown: "" });
    await aiResponse(res, () => fixMarkdown(body.data.markdown));
  },
};
