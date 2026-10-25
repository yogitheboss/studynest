import { journalService } from "./journal.service.js";
import { fixMarkdown, formatTranscript } from "./gemini.js";
import { transcribeAudio } from "./groq.js";
import {
  dateSchema,
  markdownBodySchema,
  todoCreateSchema,
  todoPatchSchema,
} from "./journal.schema.js";

const notFound = (res) => res.status(404).json({ error: "Note not found." });

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

  // GET /api/todos — the user's todo notes, without tasks/markdown.
  async listTodos(req, res) {
    res.json(await journalService.listTodos(req.session.user.id));
  },

  // POST /api/todos — { title?, date? }
  async createTodo(req, res) {
    const body = todoCreateSchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    res
      .status(201)
      .json(await journalService.createTodo(req.session.user.id, body.data));
  },

  // GET /api/todos/:id
  async getTodo(req, res) {
    const note = await journalService.getTodo(
      req.session.user.id,
      req.params.id
    );
    if (!note) return notFound(res);
    res.json(note);
  },

  // PATCH /api/todos/:id — { title?, date?, tasks? }
  async updateTodo(req, res) {
    const body = todoPatchSchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    const note = await journalService.updateTodo(
      req.session.user.id,
      req.params.id,
      body.data
    );
    if (!note) return notFound(res);
    res.json(note);
  },

  // DELETE /api/todos/:id
  async deleteTodo(req, res) {
    const deleted = await journalService.deleteTodo(
      req.session.user.id,
      req.params.id
    );
    if (!deleted) return notFound(res);
    res.status(204).end();
  },

  // GET /api/todos/:id/notes — the note's "Remember" markdown.
  async getTodoNotes(req, res) {
    const doc = await journalService.getTodoNotes(
      req.session.user.id,
      req.params.id
    );
    if (!doc) return notFound(res);
    res.json(doc);
  },

  // PUT /api/todos/:id/notes
  async saveTodoNotes(req, res) {
    const body = markdownBodySchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    const doc = await journalService.saveTodoNotes(
      req.session.user.id,
      req.params.id,
      body.data.markdown
    );
    if (!doc) return notFound(res);
    res.json(doc);
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
