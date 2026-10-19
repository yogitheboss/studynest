import multer from "multer";

import { journalController } from "./journal.controller.js";

// Voice notes are held in memory, sent to Gemini inline and never stored.
// 20 MB is Gemini's inline request cap (~10+ min of opus audio).
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    // Browsers may tag audio-only recordings as video/webm or video/mp4.
    if (/^(audio\/|video\/(webm|mp4))/.test(file.mimetype)) {
      return cb(null, true);
    }
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = `Only audio files are allowed (got "${file.mimetype}").`;
    cb(err);
  },
});

function uploadAudio(req, res, next) {
  audioUpload.single("audio")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Recording is too long. Maximum size is 20 MB."
          : err.message;
      return res.status(400).json({ error: message });
    }
    return next(err);
  });
}

/** Daily study journal: one markdown entry per user per date, plus AI helpers. */
export function registerJournalRoutes(app, requireAuth) {
  app.post(
    "/api/journal/transcribe",
    requireAuth,
    uploadAudio,
    journalController.transcribe
  );
  app.post("/api/journal/fix", requireAuth, journalController.fix);

  app.get("/api/journal", requireAuth, journalController.list);
  app.get("/api/journal/:date", requireAuth, journalController.get);
  app.put("/api/journal/:date", requireAuth, journalController.save);

  app.get("/api/todos", requireAuth, journalController.getTodos);
  app.put("/api/todos", requireAuth, journalController.saveTodos);
}
