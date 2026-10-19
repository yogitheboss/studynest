import { SAMPLE_PLAN_JSON } from "./parsePlan";

/**
 * A ready-to-copy prompt the user pastes into any LLM, followed by their
 * syllabus and schedule, to get back JSON in exactly the shape parsePlan reads.
 */
export const buildPlanPrompt = (defaultQuestions: number): string =>
  `You are an exam-prep planner. Convert my syllabus and schedule (pasted below) into a study plan.

Return ONLY valid JSON (no markdown, no commentary): an array where each element is one subject/topic to study on one day:

- "subject" (string, required): the subject or topic name.
- "date" (string, required): the day to study it, formatted YYYY-MM-DD.
- "questions" (number, optional): how many practice questions to solve. Use ${defaultQuestions} unless my schedule says otherwise.
- "concepts" (array of strings, optional): the key concepts those questions will test.
- "related" (array of strings, optional): related topics worth looking up alongside.

Rules:
- Keep my dates exactly as given. If I give a date range for a subject, split it into one entry per day.
- If I give no year, assume the next upcoming occurrence of that date.
- Keep subject names short and consistent.

Example output:
${SAMPLE_PLAN_JSON}

My syllabus and schedule:
<PASTE YOUR SYLLABUS AND DATES HERE>`;
