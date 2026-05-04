import type { Event, EventCategory } from "@event-platform/shared";
import { type Collection, type Filter, ObjectId } from "mongodb";
import { getDb } from "../db/client";

export interface EventDoc {
  _id: ObjectId;
  organizerId: ObjectId;
  name: string;
  description: string;
  category: EventCategory;
  date: Date;
  location: string;
  capacity: number;
  registeredCount: number;
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface FindEventsOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
}

const collection = async (): Promise<Collection<EventDoc>> => {
  const db = await getDb();
  return db.collection<EventDoc>("events");
};

export const toEvent = (doc: EventDoc): Event => ({
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

export const findEventById = async (id: ObjectId): Promise<EventDoc | null> => {
  const col = await collection();
  return col.findOne({ _id: id });
};

export const findEvents = async (filter: Filter<EventDoc>, options: FindEventsOptions = {}): Promise<EventDoc[]> => {
  const col = await collection();
  let query = col.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.limit !== undefined) query = query.limit(options.limit);
  return query.toArray();
};

export const countEvents = async (filter: Filter<EventDoc>): Promise<number> => {
  const col = await collection();
  return col.countDocuments(filter);
};

export const insertEvent = async (doc: EventDoc): Promise<void> => {
  const col = await collection();
  await col.insertOne(doc);
};

export const patchEvent = async (id: ObjectId, fields: Partial<EventDoc>): Promise<EventDoc | null> => {
  const col = await collection();
  await col.updateOne({ _id: id }, { $set: { ...fields, updatedAt: new Date() } });
  return col.findOne({ _id: id });
};

export const deleteEventById = async (id: ObjectId): Promise<void> => {
  const col = await collection();
  await col.deleteOne({ _id: id });
};

export const tryIncrementRegisteredCount = async (id: ObjectId): Promise<boolean> => {
  const col = await collection();
  const result = await col.updateOne(
    { _id: id, status: "published", $expr: { $lt: ["$registeredCount", "$capacity"] } },
    { $inc: { registeredCount: 1 } }
  );
  return result.modifiedCount === 1;
};

export const decrementRegisteredCount = async (id: ObjectId): Promise<void> => {
  const col = await collection();
  await col.updateOne({ _id: id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
};
