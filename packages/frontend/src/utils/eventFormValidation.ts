import { createEventSchema } from "@event-platform/shared";
import { z } from "zod";

/** Visible/runnable text length after stripping lightweight markdown noise. */
export function stripMarkdownForReadableLength(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid datetime")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid datetime");

export const eventFormSchema = createEventSchema.extend({
  name: z.string().trim().min(3, "Event name must be at least 3 characters").max(100, "Event name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .refine((value) => stripMarkdownForReadableLength(value).length >= 10, "Description must include at least 10 readable characters"),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(200, "Location must be at most 200 characters"),
  date: localDateTimeSchema
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const DATE_MUST_BE_IN_FUTURE_MESSAGE = "Date and time must be in the future";

export function isFutureEventDateTime(value: string, nowMs: number): boolean {
  const parsedMs = new Date(value).getTime();
  return Number.isFinite(parsedMs) && parsedMs > nowMs;
}

export function validateEventDateNotInPast(
  value: string,
  options: { allowPastDateForEdit: boolean; nowMs: number }
): true | typeof DATE_MUST_BE_IN_FUTURE_MESSAGE {
  const { allowPastDateForEdit, nowMs } = options;
  if (allowPastDateForEdit) {
    return true;
  }
  return isFutureEventDateTime(value, nowMs) ? true : DATE_MUST_BE_IN_FUTURE_MESSAGE;
}

export function validateCapacityAtLeastRegistrations(capacity: number, minRegistered: number): true | string {
  return capacity >= minRegistered || `Capacity cannot be lower than current registrations (${minRegistered})`;
}
