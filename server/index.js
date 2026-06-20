import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

import { auth } from "./auth.js";

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

// Routes
app.get("/", (req, res) => {
  res.json({ message: "info_hub server is running" });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
