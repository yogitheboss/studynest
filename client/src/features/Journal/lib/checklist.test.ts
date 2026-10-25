/// <reference types="node" />
// Run: node --test src/features/Journal/lib/checklist.test.ts
import assert from "node:assert/strict";
import test from "node:test";

import { splitChecklist } from "./checklist.ts";

test("checklist lines become tasks, the rest stays as notes", () => {
  const { tasks, rest } = splitChecklist(
    "- [ ] Buy notebook\n* [x] Revise graphs  \n\n- Exam is on Friday\n- [ ] \n"
  );
  assert.deepEqual(tasks, ["Buy notebook", "Revise graphs"]);
  assert.equal(rest, "- Exam is on Friday\n- [ ]");
});

test("no checklist at all", () => {
  assert.deepEqual(splitChecklist("just a thought"), {
    tasks: [],
    rest: "just a thought",
  });
});
