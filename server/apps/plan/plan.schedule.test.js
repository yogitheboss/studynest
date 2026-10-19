import assert from "node:assert/strict";
import test from "node:test";

import { addDays, revisionsFor } from "./plan.schedule.js";

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});

test("revisions land 1/3/7/21 days after completion, only before the exam", () => {
  const revs = revisionsFor(
    { id: "a", title: "Physics" },
    "2026-10-30",
    "2026-11-07"
  );
  assert.deepEqual(
    revs.map((r) => r.date),
    ["2026-10-31", "2026-11-02", "2026-11-06"]
  );
  assert.ok(revs.every((r) => r.sourceId === "a" && r.type === "revise"));
});
