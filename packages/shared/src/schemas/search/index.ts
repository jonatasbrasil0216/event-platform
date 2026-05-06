import { z } from "zod";
import { eventCategorySchema } from "../events";

/** Calendar day only (what models often emit). Expanded to UTC bounds for querying. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** ISO 8601 datetime from the model, or YYYY-MM-DD meaning start/end of that calendar day (UTC). */
const aiParsedDateRangeFrom = z.union([
  z.string().datetime(),
  z.string().regex(CALENDAR_DAY).transform((d) => `${d}T00:00:00.000Z`)
]);

const aiParsedDateRangeTo = z.union([
  z.string().datetime(),
  z.string().regex(CALENDAR_DAY).transform((d) => `${d}T23:59:59.999Z`)
]);

export const parsedSearchFiltersSchema = z.object({
  category: eventCategorySchema.nullable(),
  dateRange: z.object({
    from: aiParsedDateRangeFrom.nullable(),
    to: aiParsedDateRangeTo.nullable()
  }),
  maxCapacity: z.number().int().positive().nullable(),
  minCapacity: z.number().int().positive().nullable(),
  keywords: z.array(z.string().min(1))
});

export const parseSearchQuerySchema = z.object({
  query: z.string().min(1).max(300)
});
