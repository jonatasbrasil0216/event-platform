import { z } from "zod";
import { eventCategorySchema } from "../events";

export const parsedSearchFiltersSchema = z.object({
  category: eventCategorySchema.nullable(),
  dateRange: z.object({
    from: z.string().datetime().nullable(),
    to: z.string().datetime().nullable()
  }),
  maxCapacity: z.number().int().positive().nullable(),
  minCapacity: z.number().int().positive().nullable(),
  keywords: z.array(z.string().min(1))
});

export const parseSearchQuerySchema = z.object({
  query: z.string().min(1).max(300)
});
