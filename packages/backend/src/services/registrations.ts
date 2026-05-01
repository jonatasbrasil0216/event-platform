import type { Event as AppEvent, PaginatedResponse, Registration, RegistrationBucket } from "@event-platform/shared";
import { type Collection, type Filter, ObjectId } from "mongodb";
import { getDb } from "../db/client";
import { type EventDoc, toEvent } from "../db/events";
import { conflictError, forbiddenError, notFoundError, validationError } from "../lib/errors";
import { dateCursorFilter, decodeCursor, pageInfoFromDocs } from "../lib/pagination";

interface RegistrationDoc {
  _id: ObjectId;
  eventId: ObjectId;
  userId: ObjectId;
  status: "active" | "cancelled";
  registeredAt: Date;
  cancelledAt: Date | null;
}

interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
}

interface ListMyRegistrationsInput {
  bucket: RegistrationBucket;
  cursor?: string;
  limit: number;
}

interface ListEventAttendeesInput {
  q?: string;
  sort: "recent" | "oldest";
  cursor?: string;
  limit: number;
}

export interface RegistrationCounts {
  upcoming: number;
  past: number;
}

const eventsCollection = async (): Promise<Collection<EventDoc>> => {
  const db = await getDb();
  return db.collection<EventDoc>("events");
};

const registrationsCollection = async (): Promise<Collection<RegistrationDoc>> => {
  const db = await getDb();
  return db.collection<RegistrationDoc>("registrations");
};

const usersCollection = async (): Promise<Collection<UserDoc>> => {
  const db = await getDb();
  return db.collection<UserDoc>("users");
};

const toRegistration = (doc: RegistrationDoc): Registration => ({
  _id: doc._id.toString(),
  eventId: doc.eventId.toString(),
  userId: doc.userId.toString(),
  status: doc.status,
  registeredAt: doc.registeredAt.toISOString(),
  cancelledAt: doc.cancelledAt ? doc.cancelledAt.toISOString() : null
});

export const registerForEvent = async (eventId: string, userId: string): Promise<{ ok: true }> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const parsedEventId = new ObjectId(eventId);
  const parsedUserId = new ObjectId(userId);
  const events = await eventsCollection();
  const registrations = await registrationsCollection();

  const event = await events.findOne({ _id: parsedEventId });
  if (!event || event.status !== "published") {
    throw notFoundError("Event not found");
  }
  if (event.organizerId.toString() === userId) {
    throw forbiddenError("Organizers cannot register for their own event");
  }

  const existing = await registrations.findOne({
    eventId: parsedEventId,
    userId: parsedUserId,
    status: "active"
  });
  if (existing) {
    throw conflictError("Already registered");
  }

  const capacityResult = await events.updateOne(
    {
      _id: parsedEventId,
      status: "published",
      $expr: { $lt: ["$registeredCount", "$capacity"] }
    },
    { $inc: { registeredCount: 1 } }
  );

  if (capacityResult.modifiedCount === 0) {
    throw conflictError("Event is full or unavailable");
  }

  try {
    await registrations.insertOne({
      _id: new ObjectId(),
      eventId: parsedEventId,
      userId: parsedUserId,
      status: "active",
      registeredAt: new Date(),
      cancelledAt: null
    });
  } catch (error) {
    await events.updateOne({ _id: parsedEventId }, { $inc: { registeredCount: -1 } });
    throw error;
  }

  return { ok: true };
};

export const cancelRegistration = async (eventId: string, userId: string): Promise<{ ok: true }> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const parsedEventId = new ObjectId(eventId);
  const parsedUserId = new ObjectId(userId);
  const registrations = await registrationsCollection();
  const events = await eventsCollection();

  const reg = await registrations.findOne({
    eventId: parsedEventId,
    userId: parsedUserId,
    status: "active"
  });
  if (!reg) {
    throw notFoundError("Active registration not found");
  }

  await registrations.updateOne(
    { _id: reg._id, status: "active" },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );
  await events.updateOne({ _id: parsedEventId, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
  return { ok: true };
};

export const listMyRegistrations = async (
  userId: string,
  input: ListMyRegistrationsInput
): Promise<PaginatedResponse<{ registration: Registration; event: AppEvent; organizerName: string }> & { counts: RegistrationCounts }> => {
  const parsedUserId = new ObjectId(userId);
  const registrations = await registrationsCollection();
  const events = await eventsCollection();
  const users = await usersCollection();
  const now = new Date();
  const cursor = decodeCursor(input.cursor);
  const activeRegistrations = await registrations.find({ userId: parsedUserId, status: "active" }).toArray();
  const activeEventIds = activeRegistrations.map((registration) => registration.eventId);
  const eventTimeFilter = input.bucket === "upcoming" ? { $gte: now } : { $lt: now };
  const matchingEvents = activeEventIds.length
    ? await events
        .find({
          _id: { $in: activeEventIds },
          date: eventTimeFilter
        })
        .toArray()
    : [];
  const matchingEventIdSet = new Set(matchingEvents.map((event) => event._id.toString()));
  const matchingRegistrationIds = activeRegistrations
    .filter((registration) => matchingEventIdSet.has(registration.eventId.toString()))
    .map((registration) => registration._id);
  const cursorFilter = dateCursorFilter("registeredAt", cursor, -1);
  const regFilter =
    Object.keys(cursorFilter).length > 0
      ? { $and: [{ _id: { $in: matchingRegistrationIds } }, cursorFilter] }
      : { _id: { $in: matchingRegistrationIds } };

  const regDocs = await registrations
    .find(regFilter)
    .sort({ registeredAt: -1 })
    .limit(input.limit + 1)
    .toArray();

  const eventIds = regDocs.map((r) => r.eventId);
  const eventDocs = await events.find({ _id: { $in: eventIds } }).toArray();
  const eventMap = new Map(eventDocs.map((e) => [e._id.toString(), e]));
  const organizerIds = [...new Set(eventDocs.map((event) => event.organizerId.toString()))].map(
    (id) => new ObjectId(id)
  );
  const organizerDocs = organizerIds.length
    ? await users.find({ _id: { $in: organizerIds } }).toArray()
    : [];
  const organizerMap = new Map(organizerDocs.map((organizer) => [organizer._id.toString(), organizer.name]));

  const page = pageInfoFromDocs(regDocs, input.limit, (doc) => doc.registeredAt);
  const data = page.data
    .map((reg) => {
      const event = eventMap.get(reg.eventId.toString());
      if (!event) return null;
      return {
        registration: toRegistration(reg),
        event: toEvent(event),
        organizerName: organizerMap.get(event.organizerId.toString()) ?? "Event organizer"
      };
    })
    .filter(
      (item): item is { registration: Registration; event: AppEvent; organizerName: string } => Boolean(item)
    );

  const allActiveEvents = activeEventIds.length ? await events.find({ _id: { $in: activeEventIds } }).toArray() : [];
  const counts = allActiveEvents.reduce<RegistrationCounts>(
    (acc, event) => {
      if (event.date.getTime() >= now.getTime()) acc.upcoming += 1;
      else acc.past += 1;
      return acc;
    },
    { upcoming: 0, past: 0 }
  );

  return { data, pageInfo: page.pageInfo, counts };
};

export const listEventAttendees = async (
  eventId: string,
  organizerId: string,
  input: ListEventAttendeesInput
): Promise<PaginatedResponse<{ _id: string; name: string; email: string; registeredAt: string }> & { total: number }> => {
  if (!ObjectId.isValid(eventId)) {
    throw validationError("Invalid event id");
  }

  const parsedEventId = new ObjectId(eventId);
  const events = await eventsCollection();
  const registrations = await registrationsCollection();
  const users = await usersCollection();

  const event = await events.findOne({ _id: parsedEventId });
  if (!event) {
    throw notFoundError("Event not found");
  }
  if (event.organizerId.toString() !== organizerId) {
    throw forbiddenError("You can only view attendees for your own events");
  }

  const direction = input.sort === "oldest" ? 1 : -1;
  const cursor = decodeCursor(input.cursor);
  const cursorFilter = dateCursorFilter("registeredAt", cursor, direction);
  let attendeeUserFilter: Record<string, unknown> = {};
  if (input.q) {
    const escaped = input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const matchingUsers = await users.find({ $or: [{ name: regex }, { email: regex }] }).toArray();
    attendeeUserFilter = { userId: { $in: matchingUsers.map((user) => user._id) } };
  }
  const baseRegFilter: Filter<RegistrationDoc> = { eventId: parsedEventId, status: "active", ...attendeeUserFilter };
  const regFilter =
    Object.keys(cursorFilter).length > 0
      ? { $and: [baseRegFilter, cursorFilter] }
      : baseRegFilter;

  const regDocs = await registrations
    .find(regFilter)
    .sort({ registeredAt: direction, _id: direction })
    .limit(input.limit + 1)
    .toArray();

  const userIds = [...new Set(regDocs.map((registration) => registration.userId.toString()))].map(
    (id) => new ObjectId(id)
  );
  const userDocs = userIds.length ? await users.find({ _id: { $in: userIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((user) => [user._id.toString(), user]));

  const page = pageInfoFromDocs(regDocs, input.limit, (doc) => doc.registeredAt);
  const data = page.data
    .map((registration) => {
      const user = userMap.get(registration.userId.toString());
      if (!user) return null;
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        registeredAt: registration.registeredAt.toISOString()
      };
    })
    .filter((item): item is { _id: string; name: string; email: string; registeredAt: string } => Boolean(item));
  const total = await registrations.countDocuments(baseRegFilter);

  return { data, pageInfo: page.pageInfo, total };
};
