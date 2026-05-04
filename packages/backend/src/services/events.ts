import {
  createEventSchema,
  type Event,
  type EventCategory,
  type OrganizerEventBucket,
  type PaginatedResponse,
  parsedSearchFiltersSchema,
  updateEventSchema
} from "@event-platform/shared";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { forbiddenError, notFoundError, validationError } from "../lib/errors";
import { dateCursorFilter, decodeCursor, pageInfoFromDocs } from "../lib/pagination";
import {
  countEvents,
  deleteEventById,
  findEventById,
  findEvents,
  insertEvent,
  patchEvent,
  toEvent,
  type EventDoc
} from "../repositories/events";
import { findUserById } from "../repositories/users";
import { buildSearchMongoFilter, parseSearchFilters } from "./search";

type ParsedFilters = z.infer<typeof parsedSearchFiltersSchema>;

interface ListPublishedEventsInput {
  q?: string;
  category?: EventCategory;
  date?: string;
  cursor?: string;
  limit: number;
}

interface ListMyEventsInput {
  bucket: OrganizerEventBucket;
  cursor?: string;
  limit: number;
}

export interface OrganizerEventCounts {
  published: number;
  draft: number;
  past: number;
  cancelled: number;
}

const keywordMongoFilter = (keywords: string[]) => {
  if (!keywords.length) return {};
  const escaped = keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return {
    $or: escaped.flatMap((keyword) => {
      const regex = new RegExp(keyword, "i");
      return [{ name: regex }, { description: regex }, { location: regex }];
    })
  };
};

const explicitDateFilter = (date: string) => {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);
  return { date: { $gte: from, $lte: to } };
};

const organizerBucketFilter = (bucket: OrganizerEventBucket, now: Date): Record<string, unknown> => {
  if (bucket === "draft") return { status: "draft" };
  if (bucket === "cancelled") return { status: "cancelled" };
  if (bucket === "past") {
    return {
      status: { $nin: ["draft", "cancelled"] },
      $or: [{ date: { $lt: now } }, { status: "completed" }]
    };
  }
  return { status: "published", date: { $gte: now } };
};

export const createEvent = async (organizerId: string, input: unknown): Promise<{ event: Event }> => {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) throw validationError("Invalid event payload", parsed.error.flatten());

  const now = new Date();
  const doc: EventDoc = {
    _id: new ObjectId(),
    organizerId: new ObjectId(organizerId),
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    date: new Date(parsed.data.date),
    location: parsed.data.location,
    capacity: parsed.data.capacity,
    registeredCount: 0,
    status: "published",
    createdAt: now,
    updatedAt: now
  };

  await insertEvent(doc);
  return { event: toEvent(doc) };
};

export const listPublishedEvents = async (
  input: ListPublishedEventsInput
): Promise<PaginatedResponse<Event> & { filters: ParsedFilters | null; warning?: string }> => {
  const cursor = decodeCursor(input.cursor);
  const andFilters: Record<string, unknown>[] = [{ status: "published" }, { date: { $gte: new Date() } }];
  let filters: ParsedFilters | null = null;
  let warning: string | undefined;

  if (input.q) {
    const parsed = await parseSearchFilters(input.q);
    filters = parsed.filters;
    warning = parsed.warning;
    andFilters.push(buildSearchMongoFilter(filters));
    andFilters.push(keywordMongoFilter(filters.keywords));
  }

  if (input.category) andFilters.push({ category: input.category });
  if (input.date) andFilters.push(explicitDateFilter(input.date));
  const cursorFilter = dateCursorFilter("date", cursor, 1);
  if (Object.keys(cursorFilter).length) andFilters.push(cursorFilter);

  const docs = await findEvents({ $and: andFilters }, { sort: { date: 1, _id: 1 }, limit: input.limit + 1 });
  const page = pageInfoFromDocs(docs, input.limit, (doc) => doc.date);
  return { data: page.data.map(toEvent), pageInfo: page.pageInfo, filters, warning };
};

export const getEventById = async (eventId: string): Promise<{ event: Event; organizerName: string }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const doc = await findEventById(new ObjectId(eventId));
  if (!doc) throw notFoundError("Event not found");

  const organizer = await findUserById(doc.organizerId);
  return { event: toEvent(doc), organizerName: organizer?.name ?? "Event organizer" };
};

export const listMyEvents = async (
  organizerId: string,
  input: ListMyEventsInput
): Promise<PaginatedResponse<Event> & { counts: OrganizerEventCounts }> => {
  const now = new Date();
  const organizerFilter = { organizerId: new ObjectId(organizerId) };
  const cursor = decodeCursor(input.cursor);
  const baseFilter = { ...organizerFilter, ...organizerBucketFilter(input.bucket, now) };
  const cursorFilter = dateCursorFilter("createdAt", cursor, -1);
  const findFilter = Object.keys(cursorFilter).length ? { $and: [baseFilter, cursorFilter] } : baseFilter;

  const docs = await findEvents(findFilter, { sort: { createdAt: -1, _id: -1 }, limit: input.limit + 1 });

  const [published, draft, past, cancelled] = await Promise.all([
    countEvents({ ...organizerFilter, ...organizerBucketFilter("published", now) }),
    countEvents({ ...organizerFilter, ...organizerBucketFilter("draft", now) }),
    countEvents({ ...organizerFilter, ...organizerBucketFilter("past", now) }),
    countEvents({ ...organizerFilter, ...organizerBucketFilter("cancelled", now) })
  ]);

  const page = pageInfoFromDocs(docs, input.limit, (doc) => doc.createdAt);
  return { data: page.data.map(toEvent), pageInfo: page.pageInfo, counts: { published, draft, past, cancelled } };
};

export const updateEvent = async (eventId: string, organizerId: string, input: unknown): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) throw validationError("Invalid event payload", parsed.error.flatten());

  const existing = await findEventById(new ObjectId(eventId));
  if (!existing) throw notFoundError("Event not found");
  if (existing.organizerId.toString() !== organizerId) throw forbiddenError("You can only edit your own events");

  const fields: Partial<EventDoc> = {};
  if (parsed.data.name !== undefined) fields.name = parsed.data.name;
  if (parsed.data.description !== undefined) fields.description = parsed.data.description;
  if (parsed.data.category !== undefined) fields.category = parsed.data.category;
  if (parsed.data.date !== undefined) fields.date = new Date(parsed.data.date);
  if (parsed.data.location !== undefined) fields.location = parsed.data.location;
  if (parsed.data.capacity !== undefined) fields.capacity = parsed.data.capacity;

  const updated = await patchEvent(existing._id, fields);
  if (!updated) throw notFoundError("Event not found after update");
  return { event: toEvent(updated) };
};

export const deleteEvent = async (eventId: string, organizerId: string): Promise<void> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const existing = await findEventById(new ObjectId(eventId));
  if (!existing) throw notFoundError("Event not found");
  if (existing.organizerId.toString() !== organizerId) throw forbiddenError("You can only delete your own events");

  await deleteEventById(existing._id);
};

export const cancelEvent = async (eventId: string, organizerId: string): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const existing = await findEventById(new ObjectId(eventId));
  if (!existing) throw notFoundError("Event not found");
  if (existing.organizerId.toString() !== organizerId) throw forbiddenError("You can only cancel your own events");

  const updated = await patchEvent(existing._id, { status: "cancelled" });
  if (!updated) throw notFoundError("Event not found after cancel");
  return { event: toEvent(updated) };
};

export const republishEvent = async (eventId: string, organizerId: string): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const existing = await findEventById(new ObjectId(eventId));
  if (!existing) throw notFoundError("Event not found");
  if (existing.organizerId.toString() !== organizerId) throw forbiddenError("You can only republish your own events");

  const updated = await patchEvent(existing._id, { status: "published" });
  if (!updated) throw notFoundError("Event not found after republish");
  return { event: toEvent(updated) };
};

export const makeEventDraft = async (eventId: string, organizerId: string): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const existing = await findEventById(new ObjectId(eventId));
  if (!existing) throw notFoundError("Event not found");
  if (existing.organizerId.toString() !== organizerId) throw forbiddenError("You can only update your own events");

  const updated = await patchEvent(existing._id, { status: "draft" });
  if (!updated) throw notFoundError("Event not found after draft update");
  return { event: toEvent(updated) };
};
