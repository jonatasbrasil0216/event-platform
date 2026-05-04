import type { Event as AppEvent, PaginatedResponse, Registration, RegistrationBucket } from "@event-platform/shared";
import { type Filter, ObjectId } from "mongodb";
import { conflictError, forbiddenError, notFoundError, validationError } from "../lib/errors";
import { dateCursorFilter, decodeCursor, pageInfoFromDocs } from "../lib/pagination";
import {
  decrementRegisteredCount,
  findEventById,
  findEvents,
  toEvent,
  tryIncrementRegisteredCount
} from "../repositories/events";
import {
  cancelRegistrationById,
  countRegistrations,
  findRegistration,
  findRegistrations,
  insertRegistration,
  toRegistration,
  type RegistrationDoc
} from "../repositories/registrations";
import { findUsers, findUsersByIds } from "../repositories/users";

export interface RegistrationCounts {
  upcoming: number;
  past: number;
}

export const registerForEvent = async (eventId: string, userId: string): Promise<{ ok: true }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const parsedEventId = new ObjectId(eventId);
  const parsedUserId = new ObjectId(userId);

  const event = await findEventById(parsedEventId);
  if (!event || event.status !== "published") throw notFoundError("Event not found");
  if (event.organizerId.toString() === userId) throw forbiddenError("Organizers cannot register for their own event");

  const existing = await findRegistration({ eventId: parsedEventId, userId: parsedUserId, status: "active" });
  if (existing) throw conflictError("Already registered");

  const incremented = await tryIncrementRegisteredCount(parsedEventId);
  if (!incremented) throw conflictError("Event is full or unavailable");

  try {
    await insertRegistration({
      _id: new ObjectId(),
      eventId: parsedEventId,
      userId: parsedUserId,
      status: "active",
      registeredAt: new Date(),
      cancelledAt: null
    });
  } catch (error) {
    await decrementRegisteredCount(parsedEventId);
    throw error;
  }

  return { ok: true };
};

export const cancelRegistration = async (eventId: string, userId: string): Promise<{ ok: true }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const parsedEventId = new ObjectId(eventId);
  const parsedUserId = new ObjectId(userId);

  const reg = await findRegistration({ eventId: parsedEventId, userId: parsedUserId, status: "active" });
  if (!reg) throw notFoundError("Active registration not found");

  await cancelRegistrationById(reg._id);
  await decrementRegisteredCount(parsedEventId);
  return { ok: true };
};

export const listMyRegistrations = async (
  userId: string,
  input: { bucket: RegistrationBucket; cursor?: string; limit: number }
): Promise<PaginatedResponse<{ registration: Registration; event: AppEvent; organizerName: string }> & { counts: RegistrationCounts }> => {
  const parsedUserId = new ObjectId(userId);
  const now = new Date();
  const cursor = decodeCursor(input.cursor);

  const activeRegistrations = await findRegistrations({ userId: parsedUserId, status: "active" });
  const activeEventIds = activeRegistrations.map((r) => r.eventId);

  const eventTimeFilter = input.bucket === "upcoming" ? { $gte: now } : { $lt: now };
  const matchingEvents = activeEventIds.length
    ? await findEvents({ _id: { $in: activeEventIds }, date: eventTimeFilter })
    : [];

  const matchingEventIdSet = new Set(matchingEvents.map((e) => e._id.toString()));
  const matchingRegistrationIds = activeRegistrations
    .filter((r) => matchingEventIdSet.has(r.eventId.toString()))
    .map((r) => r._id);

  const cursorFilter = dateCursorFilter("registeredAt", cursor, -1);
  const regFilter: Filter<RegistrationDoc> =
    Object.keys(cursorFilter).length > 0
      ? { $and: [{ _id: { $in: matchingRegistrationIds } }, cursorFilter] }
      : { _id: { $in: matchingRegistrationIds } };

  const regDocs = await findRegistrations(regFilter, { sort: { registeredAt: -1 }, limit: input.limit + 1 });

  const eventDocs = await findEvents({ _id: { $in: regDocs.map((r) => r.eventId) } });
  const eventMap = new Map(eventDocs.map((e) => [e._id.toString(), e]));

  const organizerIds = [...new Set(eventDocs.map((e) => e.organizerId.toString()))].map((id) => new ObjectId(id));
  const organizerDocs = await findUsersByIds(organizerIds);
  const organizerMap = new Map(organizerDocs.map((o) => [o._id.toString(), o.name]));

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
    .filter((item): item is { registration: Registration; event: AppEvent; organizerName: string } => Boolean(item));

  const allActiveEvents = activeEventIds.length ? await findEvents({ _id: { $in: activeEventIds } }) : [];
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
  input: { q?: string; sort: "recent" | "oldest"; cursor?: string; page?: number; limit: number }
): Promise<PaginatedResponse<{ _id: string; name: string; email: string; registeredAt: string }> & { total: number }> => {
  if (!ObjectId.isValid(eventId)) throw validationError("Invalid event id");

  const parsedEventId = new ObjectId(eventId);
  const event = await findEventById(parsedEventId);
  if (!event) throw notFoundError("Event not found");
  if (event.organizerId.toString() !== organizerId) throw forbiddenError("You can only view attendees for your own events");

  const direction = input.sort === "oldest" ? 1 : -1;
  let attendeeUserFilter: Record<string, unknown> = {};

  if (input.q) {
    const escaped = input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const matchingUsers = await findUsers({ $or: [{ name: regex }, { email: regex }] });
    attendeeUserFilter = { userId: { $in: matchingUsers.map((u) => u._id) } };
  }

  const baseRegFilter: Filter<RegistrationDoc> = { eventId: parsedEventId, status: "active", ...attendeeUserFilter };

  const useOffsetPage = input.page != null && input.page >= 1;
  let regDocs: RegistrationDoc[];

  if (useOffsetPage) {
    const skip = (input.page! - 1) * input.limit;
    regDocs = await findRegistrations(baseRegFilter, {
      sort: { registeredAt: direction, _id: direction },
      skip,
      limit: input.limit + 1
    });
  } else {
    const cursor = decodeCursor(input.cursor);
    const cursorFilter = dateCursorFilter("registeredAt", cursor, direction);
    const regFilter: Filter<RegistrationDoc> =
      Object.keys(cursorFilter).length > 0 ? { $and: [baseRegFilter, cursorFilter] } : baseRegFilter;
    regDocs = await findRegistrations(regFilter, { sort: { registeredAt: direction, _id: direction }, limit: input.limit + 1 });
  }

  const userIds = [...new Set(regDocs.map((r) => r.userId.toString()))].map((id) => new ObjectId(id));
  const userDocs = await findUsersByIds(userIds);
  const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

  const page = pageInfoFromDocs(regDocs, input.limit, (doc) => doc.registeredAt);
  const data = page.data
    .map((reg) => {
      const user = userMap.get(reg.userId.toString());
      if (!user) return null;
      return { _id: user._id.toString(), name: user.name, email: user.email, registeredAt: reg.registeredAt.toISOString() };
    })
    .filter((item): item is { _id: string; name: string; email: string; registeredAt: string } => Boolean(item));

  const total = await countRegistrations(baseRegFilter);
  return { data, pageInfo: page.pageInfo, total };
};
