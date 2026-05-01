import { z } from "zod";
import { eventCategorySchema } from "../events";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const paginatedQuerySchema = z.object({
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(12))
});

export const publishedEventsQuerySchema = paginatedQuerySchema.extend({
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(300).optional()),
  category: z.preprocess(emptyToUndefined, eventCategorySchema.optional()),
  date: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())
});

export const myEventsQuerySchema = paginatedQuerySchema.extend({
  bucket: z.enum(["published", "draft", "past", "cancelled"]).default("published")
});

export const attendeesQuerySchema = paginatedQuerySchema.extend({
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(120).optional()),
  sort: z.enum(["recent", "oldest"]).default("recent"),
  /** Offset-style page (1-based). When set, `cursor` is ignored for attendee listing. */
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional())
});

export const myRegistrationsQuerySchema = paginatedQuerySchema.extend({
  bucket: z.enum(["upcoming", "past"]).default("upcoming")
});
