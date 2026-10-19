import type { NewPlanItem } from "../types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// "Subject -> 2026-10-20" with an optional per-line target: "... -> 120".
const LINE = /^(.+?)\s*->\s*(\d{4}-\d{2}-\d{2})(?:\s*->\s*(\d+))?$/;

export const SAMPLE_PLAN_JSON = JSON.stringify(
  [
    {
      subject: "Thermodynamics",
      date: "2026-10-20",
      questions: 100,
      concepts: ["First law", "Entropy"],
      related: ["Heat engines"],
    },
    { subject: "Fluid Mechanics", date: "2026-10-21" },
  ],
  null,
  2
);

interface ParsedPlan {
  items: NewPlanItem[];
  errors: string[];
}

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

/** Concepts and related topics become the subject's starting notes. */
const buildNotes = (concepts: string[], related: string[]): string =>
  [
    concepts.length
      ? `Concepts:\n${concepts.map((c) => `- ${c}`).join("\n")}`
      : "",
    related.length
      ? `Related topics:\n${related.map((r) => `- ${r}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

const parseLines = (text: string, defaultTarget: number): ParsedPlan => {
  const items: NewPlanItem[] = [];
  const errors: string[] = [];
  text.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const match = LINE.exec(line);
    if (!match) {
      errors.push(`Line ${index + 1}: expected "Subject -> YYYY-MM-DD".`);
      return;
    }
    items.push({
      title: match[1],
      date: match[2],
      target: match[3] ? Number(match[3]) : defaultTarget,
      notes: "",
    });
  });
  return { items, errors };
};

const parseJson = (text: string, defaultTarget: number): ParsedPlan => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { items: [], errors: ["That isn't valid JSON."] };
  }
  // Accept a bare array or { "subjects": [...] }.
  const list: unknown =
    data && typeof data === "object" && "subjects" in data
      ? data.subjects
      : data;
  if (!Array.isArray(list)) {
    return { items: [], errors: ["Expected a list of subjects."] };
  }

  const items: NewPlanItem[] = [];
  const errors: string[] = [];
  list.forEach((entry: unknown, index) => {
    const result = toItem(entry, defaultTarget);
    if (typeof result === "string")
      errors.push(`Subject ${index + 1}: ${result}`);
    else items.push(result);
  });
  return { items, errors };
};

/** One JSON subject → a plan item, or the reason it's invalid. */
const toItem = (
  entry: unknown,
  defaultTarget: number
): NewPlanItem | string => {
  if (!entry || typeof entry !== "object") return "expected an object.";
  const {
    subject,
    date,
    questions = defaultTarget,
    concepts = [],
    related = [],
  } = entry as Record<string, unknown>;
  if (typeof subject !== "string" || !subject.trim()) {
    return `"subject" is missing.`;
  }
  if (typeof date !== "string" || !DATE.test(date)) {
    return `"date" must be YYYY-MM-DD.`;
  }
  if (
    typeof questions !== "number" ||
    !Number.isInteger(questions) ||
    questions < 1
  ) {
    return `"questions" must be a positive whole number.`;
  }
  if (!isStringList(concepts) || !isStringList(related)) {
    return `"concepts" and "related" must be lists of text.`;
  }
  return {
    title: subject.trim(),
    date,
    target: questions,
    notes: buildNotes(concepts, related),
  };
};

/** Parse a pasted plan: JSON when it looks like JSON, otherwise plain lines. */
export const parsePlan = (text: string, defaultTarget: number): ParsedPlan =>
  /^\s*[[{]/.test(text)
    ? parseJson(text, defaultTarget)
    : parseLines(text, defaultTarget);
