import type { Event, Registration } from "@event-platform/shared";
import { type Collection, ObjectId } from "mongodb";
import { getDb } from "../db/client";
import { conflictError, forbiddenError, notFoundError, validationError } from "../lib/errors";

interface EventDoc {
  _id: ObjectId;
  organizerId: ObjectId;
  name: string;
  description: string;
  category: "tech" | "networking" | "workshop" | "social" | "other";
  date: Date;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

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
  userId: string
): Promise<{ data: Array<{ registration: Registration; event: Event; organizerName: string }> }> => {
  const parsedUserId = new ObjectId(userId);
  const registrations = await registrationsCollection();
  const events = await eventsCollection();
  const users = await usersCollection();

  const regDocs = await registrations
    .find({ userId: parsedUserId, status: "active" })
    .sort({ registeredAt: -1 })
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

  const data = regDocs
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
      (item): item is { registration: Registration; event: Event; organizerName: string } => Boolean(item)
    );

  return { data };
};

export const listEventAttendees = async (
  eventId: string,
  organizerId: string
): Promise<{ data: Array<{ _id: string; name: string; email: string; registeredAt: string }>; total: number }> => {
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

  const regDocs = await registrations
    .find({ eventId: parsedEventId, status: "active" })
    .sort({ registeredAt: -1 })
    .toArray();

  const userIds = [...new Set(regDocs.map((registration) => registration.userId.toString()))].map(
    (id) => new ObjectId(id)
  );
  const userDocs = userIds.length ? await users.find({ _id: { $in: userIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((user) => [user._id.toString(), user]));

  const data = regDocs
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

  return { data, total: data.length };
};
