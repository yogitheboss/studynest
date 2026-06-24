import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

import { auth } from "./auth.js";
import { uploadPublicFile } from "./storage.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// HTTP request logging. Use concise "dev" output locally and "combined"
// (Apache-style) logs in production.
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Allow the frontend to call the API with credentials (cookies).
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Mount the Better Auth handler BEFORE express.json(). Better Auth parses the
// raw request body itself, so express.json() must not consume it first.
// (Express 4 supports the "*" wildcard; on Express 5 use "/api/auth/*splat".)
app.all("/api/auth/*", toNodeHandler(auth));

// JSON body parsing for our own routes, registered after the auth handler.
app.use(express.json());

// Course content we accept: images and common document formats. Kept in sync
// with the client's accept list. Anything else is rejected by the fileFilter.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  // images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

// In-memory multipart parsing for uploads. Files are held in a Buffer and
// streamed straight to GCS, so nothing touches local disk. The fileFilter
// blocks disallowed types before the buffer is read; limits cap the size.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) return cb(null, true);
    // Surface a typed reason so the route can return a helpful 400.
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = `Unsupported file type: ${file.mimetype}. Only images and documents are allowed.`;
    cb(err);
  },
});

// Run multer for a single "file" field and translate its errors into clean
// 400s instead of letting them bubble to the default error handler.
function uploadSingle(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File is too large. Maximum size is 10 MB."
          : err.message;
      return res.status(400).json({ error: message });
    }
    return next(err);
  });
}

// Require a valid Better Auth session; attaches it to req.session.
async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.session = session;
  next();
}

// Routes
app.get("/", (req, res) => {
  res.json({ message: "StudyNest server is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Returns the current session (or null) for the authenticated request.
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

// Upload a single course-content asset (image or document, <= 10 MB) and
// return its public GCS URL. Send as multipart/form-data with the file under
// the field name "file".
app.post("/api/upload", requireAuth, uploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  // Unique object name keeps uploads from colliding and lets us cache forever.
  const ext = extname(req.file.originalname);
  const objectName = `courses/${req.session.user.id}/${randomUUID()}${ext}`;

  try {
    const url = await uploadPublicFile(
      req.file.buffer,
      objectName,
      req.file.mimetype
    );
    res.json({ url, name: objectName });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
