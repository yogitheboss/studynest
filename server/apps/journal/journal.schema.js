import { z } from "zod";

// Entries are keyed by the client's local calendar date.
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.");

export const markdownBodySchema = z.object({
  markdown: z.string().max(100_000, "Entry is too long."),
});

const todoTaskSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().max(500, "Task is too long."),
  done: z.boolean(),
});

// Every field optional: a PATCH sends only what changed.
export const todoPatchSchema = z
  .object({
    title: z.string().max(200, "Title is too long."),
    date: dateSchema.nullable(),
    tasks: z.array(todoTaskSchema).max(500, "Too many tasks."),
  })
  .partial();

export const todoCreateSchema = todoPatchSchema.omit({ tasks: true });
