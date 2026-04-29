import { createEventSchema, type Event, type EventCategory, updateEventSchema } from "@event-platform/shared";
import { type Collection, ObjectId } from "mongodb";
import { getDb } from "../db/client";
import { forbiddenError, notFoundError, validationError } from "../lib/errors";

interface EventDoc {
  _id: ObjectId;
  organizerId: ObjectId;
  name: string;
  description: string;
  category: EventCategory;
  date: Date;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "published" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const eventsCollection = async (): Promise<Collection<EventDoc>> => {
  const db = await getDb();
  return db.collection<EventDoc>("events");
};

const toEvent = (doc: EventDoc): Event => ({
  _id: doc._id.toString(),
  organizerId: doc.organizerId.toString(),
  name: doc.name,
  description: doc.description,
  category: doc.category,
  date: doc.date.toISOString(),
  location: doc.location,
  capacity: doc.capacity,
  registeredCount: doc.registeredCount,
  status: doc.status,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

export const createEvent = async (organizerId: string, input: unknown): Promise<{ event: Event }> => {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError("Invalid event payload", parsed.error.flatten());
  }

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

  const events = await eventsCollection();
  await events.insertOne(doc);
  return { event: toEvent(doc) };
};

export const listPublishedEvents = async (): Promise<{ data: Event[]; nextCursor: null }> => {
  const events = await eventsCollection();
  const docs = await events.find({ status: "published" }).sort({ date: 1 }).limit(50).toArray();
  return { data: docs.map(toEvent), nextCursor: null };
};

export const getEventById = async (eventId: string): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const events = await eventsCollection();
  const doc = await events.findOne({ _id: new ObjectId(eventId) });
  if (!doc) {
    throw notFoundError("Event not found");
  }

  return { event: toEvent(doc) };
};

export const listMyEvents = async (organizerId: string): Promise<{ data: Event[] }> => {
  const events = await eventsCollection();
  const docs = await events
    .find({ organizerId: new ObjectId(organizerId) })
    .sort({ createdAt: -1 })
    .toArray();
  return { data: docs.map(toEvent) };
};

export const updateEvent = async (
  eventId: string,
  organizerId: string,
  input: unknown
): Promise<{ event: Event }> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError("Invalid event payload", parsed.error.flatten());
  }

  const events = await eventsCollection();
  const existing = await events.findOne({ _id: new ObjectId(eventId) });
  if (!existing) {
    throw notFoundError("Event not found");
  }

  if (existing.organizerId.toString() !== organizerId) {
    throw forbiddenError("You can only edit your own events");
  }

  const update: Partial<EventDoc> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.category !== undefined) update.category = parsed.data.category;
  if (parsed.data.date !== undefined) update.date = new Date(parsed.data.date);
  if (parsed.data.location !== undefined) update.location = parsed.data.location;
  if (parsed.data.capacity !== undefined) update.capacity = parsed.data.capacity;

  await events.updateOne({ _id: existing._id }, { $set: update });
  const updated = await events.findOne({ _id: existing._id });
  if (!updated) {
    throw notFoundError("Event not found after update");
  }

  return { event: toEvent(updated) };
};

export const deleteEvent = async (eventId: string, organizerId: string): Promise<void> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const events = await eventsCollection();
  const existing = await events.findOne({ _id: new ObjectId(eventId) });
  if (!existing) {
    throw notFoundError("Event not found");
  }
  if (existing.organizerId.toString() !== organizerId) {
    throw forbiddenError("You can only delete your own events");
  }

  await events.updateOne(
    { _id: existing._id },
    { $set: { status: "cancelled", updatedAt: new Date() } }
  );
};
