# StudyNest

A personal study hub: organise courses as topic trees, attach notes and files to every topic, share courses publicly, follow a day-by-day exam plan, and keep a daily **"Studied Today"** journal you can type into or simply talk to.

## Features

- **Courses**
  - Build a course as a tree of topics, either by creating it in the app or by pasting course JSON.
  - Browse it as an outline or as a graph, and add or remove topics inline.
  - **Notes and attachments per topic**, with files stored in Google Cloud Storage.
  - **Public/private sharing**: a public course gets an unguessable read-only link (`/c/:publicId`).
- **Studied Today journal**
  - One markdown entry per day, in a rich editor (headings, lists, checklists) that autosaves.
  - **Voice notes**: record yourself talking about what you studied. The audio is transcribed (Groq Whisper), formatted into clean markdown (Gemini) and added after the entry's existing text. Audio is never stored.
  - **AI fix**: one click to fix spelling, grammar and markdown formatting without changing the content.
  - Jump to any day, browse past days, and download any entry as a `.md` file.
- **Exam Plan**
  - Set your exam and its date, then add subjects by pasting `Subject -> YYYY-MM-DD` lines or your whole syllabus as JSON (paste or upload). A **Copy AI prompt** button turns any syllabus into that JSON via ChatGPT or Claude.
  - Countdown to the exam, subjects done against what was planned by today, and total questions solved.
  - **Overdue / Today / Next 7 days** lists. Unfinished subjects stay in Overdue until you finish them or move them to today.
  - Each subject has a question target (100 by default), a solved counter and notes for concepts and related topics. Reaching the target marks it done.
  - Finishing a subject schedules revisions 1, 3, 7 and 21 days later (never after the exam), each showing the notes you took.
- **Sign in with Google**, light/dark theme, and a mobile-first layout with a bottom navigation bar on phones.

## Tech stack

| Layer        | Tools                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, React Router 7, Zustand, Tailwind CSS 4, shadcn/ui (Radix), lucide-react            |
| Editor       | Tiptap 3 (StarterKit, task lists, `@tiptap/markdown`)                                                           |
| Backend      | Node.js (ESM), Express 4, Zod, Multer, Morgan                                                                   |
| Auth         | Better Auth (Google OAuth) with its MongoDB adapter                                                             |
| Database     | MongoDB (native driver; Atlas works well)                                                                       |
| File storage | Google Cloud Storage                                                                                            |
| AI           | Groq Whisper `whisper-large-v3-turbo` (speech-to-text), Google Gemini via `@google/genai` (formatting / AI fix) |
| Tooling      | Prettier (+ Tailwind plugin), ESLint, Husky + lint-staged                                                       |
| Hosting      | Backend on Google Cloud Run (Docker), frontend on Vercel                                                        |

## Project structure

```text
.
├── client/                  # React app (Vite)
│   └── src/
│       ├── pages/           # Route entry points (Dashboard, SignIn, PublicCourse, …)
│       ├── features/        # Domain modules: Auth, Courses, Journal, Plan
│       ├── components/      # Shared UI (layout, sidebar, shadcn primitives in ui/)
│       ├── routes/          # Route table
│       └── App.css          # Theme tokens (light/dark)
├── server/                  # Express API
│   ├── index.js             # App setup, auth guard, uploads, route registration
│   ├── auth.js              # Better Auth + shared MongoDB connection
│   ├── storage.js           # Google Cloud Storage uploads
│   └── apps/
│       ├── courses/         # routes → controller → service (+ zod schema)
│       ├── journal/         # same pattern, plus groq.js / gemini.js
│       └── plan/            # same pattern, plus plan.schedule.js (revisions)
└── .github/workflows/       # Backend auto-deploy to Cloud Run
```

## Run it yourself

### Prerequisites

- **Node.js 20+**
- A **MongoDB** database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local `mongod`.
- A **Google Cloud project** with:
  - an **OAuth client** (APIs & Services → Credentials → OAuth client ID → _Web application_). Add the redirect URI `http://localhost:3000/api/auth/callback/google`.
  - a **Cloud Storage bucket** for uploads, which must be publicly readable because uploads are served by public URL.
- API keys for the journal's AI features (both have free tiers):
  - **Groq** for transcription: https://console.groq.com/keys
  - **Gemini** for formatting: https://aistudio.google.com/apikey

  The rest of the app works without these keys. Only Record and AI fix show a "not configured" message.

### 1. Install

```bash
git clone <your-fork-url> studynest && cd studynest
npm install                 # root: prettier + git hooks
npm install --prefix server
npm install --prefix client
```

### 2. Configure the server: `server/.env`

```env
PORT=3000
CLIENT_URL=http://localhost:5173

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=            # openssl rand -base64 32

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.example.mongodb.net/studynest

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Cloud Storage
GCS_PROJECT_ID=
GCS_BUCKET=

# Journal AI
GROQ_API_KEY=
GEMINI_API_KEY=
# Optional overrides
# GEMINI_MODEL=gemini-3.1-flash-lite,gemini-3.5-flash   # tried in order
# GROQ_WHISPER_MODEL=whisper-large-v3-turbo
```

For Cloud Storage credentials locally, either run `gcloud auth application-default login`, or set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`. Key files are gitignored, so never commit one.

### 3. Configure the client: `client/.env`

```env
VITE_AUTH_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Start both

```bash
npm run dev --prefix server   # API on http://localhost:3000 (auto-restarts on change)
npm run dev --prefix client   # App on http://localhost:5173
```

Open http://localhost:5173 and sign in with Google.

> The microphone needs a secure context. That means `localhost` or HTTPS: to test voice notes on a phone, use the deployed site or an HTTPS tunnel, not your LAN IP.

### Useful scripts

| Where  | Command                           | What it does                      |
| ------ | --------------------------------- | --------------------------------- |
| client | `npm run build`                   | Type-check and production build   |
| client | `npm run lint`                    | ESLint                            |
| server | `npm start`                       | Run the API without watch mode    |
| server | `npm test`                        | Unit tests (`node --test`)        |
| root   | `npm run format` / `format:check` | Prettier across client and server |

## Deploying

The setup used in production is the backend on **Cloud Run** and the frontend on **Vercel**.

**Backend (Cloud Run)**

- `server/Dockerfile` builds a `node:20-alpine` image listening on `8080`.
- `.github/workflows/deploy-backend.yml` redeploys on every push to `master` that touches `server/`. It authenticates with Workload Identity Federation, so there are no stored keys.
- Configure env vars and secrets on the Cloud Run service itself, ideally via Secret Manager. The workflow only swaps the image and keeps existing configuration. **Remember to add `GROQ_API_KEY` and `GEMINI_API_KEY` there.**
- For GCS on Cloud Run, grant the service account _Storage Object Admin_ on the bucket instead of shipping a key file.

**Frontend (Vercel)**

- Deploy `client/` as a Vite project.
- `client/vercel.json` rewrites `/api/*` to the Cloud Run URL. The browser then sees a single origin, so the Better Auth session cookie stays first-party. Separate `*.vercel.app` and `*.run.app` domains would make it a blocked third-party cookie.
- Because of that rewrite:
  - set `BETTER_AUTH_URL` (server) and `VITE_AUTH_BASE_URL` / `VITE_API_BASE_URL` (client) to the **Vercel origin**.
  - set the Google OAuth redirect URI to `https://<your-app>.vercel.app/api/auth/callback/google`.
- `VITE_*` variables are baked in at build time, so redeploy after changing them.

## API overview

All routes except the public course route require a session cookie.

| Method     | Route                                  | Purpose                                          |
| ---------- | -------------------------------------- | ------------------------------------------------ |
| GET/POST   | `/api/courses`                         | List / create courses                            |
| PUT/DELETE | `/api/courses/:id`                     | Update tree / delete                             |
| PATCH      | `/api/courses/:id/visibility`          | Make public or private                           |
| GET/PUT    | `/api/courses/:id/notes/:nodeId`       | Topic notes                                      |
| GET/PUT    | `/api/courses/:id/attachments/:nodeId` | Topic attachments                                |
| GET        | `/api/public/courses/:publicId`        | Public read-only course (no auth)                |
| POST       | `/api/upload`                          | Upload a file to GCS (multipart `file`, ≤ 10 MB) |
| GET        | `/api/journal`                         | Days that have entries                           |
| GET/PUT    | `/api/journal/:date`                   | Read / save a day's markdown (`YYYY-MM-DD`)      |
| POST       | `/api/journal/transcribe`              | Multipart `audio` (≤ 20 MB) → formatted markdown |
| POST       | `/api/journal/fix`                     | `{ markdown }` → corrected markdown              |
| GET/PUT    | `/api/plan`                            | Read the plan (null before setup) / save exam    |
| POST       | `/api/plan/items`                      | Add subjects                                     |
| PATCH      | `/api/plan/items/:itemId`              | Done / undo / reschedule / solved count / notes  |
| DELETE     | `/api/plan/items/:itemId`              | Delete a subject and its revisions               |

## Roadmap

Planned features that aren't built yet are listed in [ROADMAP.md](ROADMAP.md).
