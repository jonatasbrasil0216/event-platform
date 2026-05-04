import type { Registration } from "@event-platform/shared";
import { type Collection, type Filter, ObjectId } from "mongodb";
import { getDb } from "../db/client";

export interface RegistrationDoc {
  _id: ObjectId;
  eventId: ObjectId;
  userId: ObjectId;
  status: "active" | "cancelled";
  registeredAt: Date;
  cancelledAt: Date | null;
}

export interface FindRegistrationsOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

const collection = async (): Promise<Collection<RegistrationDoc>> => {
  const db = await getDb();
  return db.collection<RegistrationDoc>("registrations");
};

export const toRegistration = (doc: RegistrationDoc): Registration => ({
  _id: doc._id.toString(),
  eventId: doc.eventId.toString(),
  userId: doc.userId.toString(),
  status: doc.status,
  registeredAt: doc.registeredAt.toISOString(),
  cancelledAt: doc.cancelledAt ? doc.cancelledAt.toISOString() : null
});

export const findRegistration = async (filter: Filter<RegistrationDoc>): Promise<RegistrationDoc | null> => {
  const col = await collection();
  return col.findOne(filter);
};

export const findRegistrations = async (
  filter: Filter<RegistrationDoc>,
  options: FindRegistrationsOptions = {}
): Promise<RegistrationDoc[]> => {
  const col = await collection();
  let query = col.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.skip !== undefined) query = query.skip(options.skip);
  if (options.limit !== undefined) query = query.limit(options.limit);
  return query.toArray();
};

export const countRegistrations = async (filter: Filter<RegistrationDoc>): Promise<number> => {
  const col = await collection();
  return col.countDocuments(filter);
};

export const insertRegistration = async (doc: RegistrationDoc): Promise<void> => {
  const col = await collection();
  await col.insertOne(doc);
};

export const cancelRegistrationById = async (id: ObjectId): Promise<void> => {
  const col = await collection();
  await col.updateOne({ _id: id, status: "active" }, { $set: { status: "cancelled", cancelledAt: new Date() } });
};
