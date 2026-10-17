import { z } from "zod";

import { dateSchema } from "../journal/journal.schema.js";

export const settingsSchema = z.object({
  examName: z.string().trim().min(1, "Name your exam.").max(120),
  examDate: dateSchema,
});

export const addItemsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Subject is empty.").max(300),
        date: dateSchema,
        target: z.number().int().min(1).max(10_000),
        notes: z.string().max(20_000, "Notes are too long.").default(""),
      })
    )
    .min(1, "Add at least one subject.")
    .max(500, "Add at most 500 subjects at a time."),
});

// One kind of change per request: complete, reopen, reschedule, count or notes.
export const updateItemSchema = z.union([
  z.object({ status: z.literal("done"), today: dateSchema }),
  z.object({ status: z.literal("pending") }),
  z.object({ date: dateSchema }),
  z.object({ solved: z.number().int().min(0).max(10_000), today: dateSchema }),
  z.object({ notes: z.string().max(20_000, "Notes are too long.") }),
]);
