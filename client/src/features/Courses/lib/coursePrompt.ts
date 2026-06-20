/**
 * A ready-to-copy prompt the user can paste into any LLM to generate a course
 * in exactly the JSON shape our parser expects, plus a small sample they can
 * try immediately.
 */

export const SAMPLE_COURSE_JSON = `{
  "title": "Introduction to Machine Learning",
  "description": "A practical, beginner-friendly path into ML.",
  "modules": [
    {
      "title": "Foundations",
      "description": "The math and intuition you need first.",
      "topics": [
        { "title": "Linear Algebra Basics" },
        { "title": "Probability & Statistics" },
        {
          "title": "Calculus for ML",
          "topics": [
            { "title": "Derivatives & Gradients" },
            { "title": "The Chain Rule" }
          ]
        }
      ]
    },
    {
      "title": "Core Algorithms",
      "topics": [
        { "title": "Linear & Logistic Regression" },
        { "title": "Decision Trees" },
        { "title": "Neural Networks" }
      ]
    },
    {
      "title": "Putting It Together",
      "topics": [
        { "title": "Model Evaluation" },
        { "title": "Overfitting & Regularization" }
      ]
    }
  ]
}`;

/**
 * Build the generation prompt. Pass a subject to pre-fill it; otherwise a
 * placeholder is left for the user to replace.
 */
export const buildCoursePrompt = (subject?: string): string => {
  const topic = subject?.trim() ? subject.trim() : "<YOUR COURSE SUBJECT>";
  return `You are a curriculum designer. Create a structured course outline for:

  "${topic}"

Return ONLY valid JSON (no markdown, no commentary) matching this schema:

- The top level is the course: an object with a "title" (string, required) and
  an optional "description".
- It contains an array of modules under the key "modules".
- Each module has a "title", optional "description", and an array of topics
  under the key "topics".
- Topics may themselves nest deeper using "topics" again for subtopics.
- Keep every "title" short and specific. Aim for 3-6 modules, each with
  3-6 topics. Nest a subtopic level only where it genuinely helps.

Example of the exact shape expected:

${SAMPLE_COURSE_JSON}

Now produce the JSON for "${topic}".`;
};
