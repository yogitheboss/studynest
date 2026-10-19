# Roadmap

Planned features that aren't scheduled yet, grouped by area and roughly in priority order within each group. Pick from here when there's time; move an item into the README's Features section once it ships.

## Exam Plan

The first version is done: exam countdown, pasted/JSON/AI-prompt import, Overdue / Today / Next 7 days, question counter, concept notes, and auto-scheduled revisions (+1, +3, +7, +21 days). Next up:

### Reminders

- **Push notifications.** A morning reminder ("Today: X, Y + 2 revisions") and an evening check-in ("Mark what you finished").
  - Web Push from the PWA (service worker + the `web-push` package on the server).
  - Cloud Run can't run timers, so **Cloud Scheduler** calls something like `POST /api/plan/tick` hourly to send whatever's due.
  - iPhone only gets pushes once the app is installed to the Home Screen.
- **Mock tests and milestones.** Fixed-date checkpoints ("Mock 1", "Syllabus done by X") with reminders 2 weeks and 3 days before.

### Staying on schedule

- **Edit a subject.** Rename it, change its date, or change its question target (today you can only move an overdue item to today, or delete it).
- **Move all overdue to today** in one tap.
- **Rebalancing.** When you're behind, spread the backlog over the remaining days and warn when the daily load gets unrealistic (e.g. "you now need 300 questions/day").
- **Final-stretch mode.** In the last 2–3 weeks, flag new subjects still on the calendar and put revisions and mocks first.

### Reviewing

- **Weekly review.** Planned vs. done, weakest subjects (low solved/target), and how the backlog changed.
- **Full plan view.** A month or calendar view of every scheduled subject, not just the next 7 days.

### Connections

- **Journal link.** Logging questions appends a line ("Solved 40 Thermodynamics questions") to that day's Studied Today entry.
- **Course link.** Attach a subject to a topic in a course tree so its notes and files are one tap away.

### Known shortcuts

- A tab left open past midnight keeps showing yesterday until it re-renders.
- Plan edits are queued per tab; editing in two tabs at once can still lose a change.
- Imports accept `YYYY-MM-DD` dates only.
