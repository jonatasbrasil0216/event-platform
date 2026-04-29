import { z } from "zod";

export const eventCategorySchema = z.enum(["tech", "networking", "workshop", "social", "other"]);
export const eventStatusSchema = z.enum(["published", "cancelled"]);

export const createEventSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: eventCategorySchema,
  date: z.string().datetime(),
  location: z.string().min(2).max(200),
  capacity: z.number().int().min(1).max(10000)
});

export const updateEventSchema = createEventSchema.partial();
