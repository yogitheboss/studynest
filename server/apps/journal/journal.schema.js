import { z } from "zod";

// Entries are keyed by the client's local calendar date.
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.");

export const markdownBodySchema = z.object({
  markdown: z.string().max(100_000, "Entry is too long."),
});
