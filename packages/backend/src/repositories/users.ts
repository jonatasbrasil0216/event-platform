import type { User, UserRole } from "@event-platform/shared";
import { type Collection, type Filter, ObjectId } from "mongodb";
import { getDb } from "../db/client";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const collection = async (): Promise<Collection<UserDoc>> => {
  const db = await getDb();
  return db.collection<UserDoc>("users");
};

export const toPublicUser = (doc: UserDoc): User => ({
  _id: doc._id.toString(),
  email: doc.email,
  name: doc.name,
  role: doc.role,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

export const findUserById = async (id: ObjectId): Promise<UserDoc | null> => {
  const col = await collection();
  return col.findOne({ _id: id });
};

export const findUserByEmail = async (email: string): Promise<UserDoc | null> => {
  const col = await collection();
  return col.findOne({ email });
};

export const findUsersByIds = async (ids: ObjectId[]): Promise<UserDoc[]> => {
  if (!ids.length) return [];
  const col = await collection();
  return col.find({ _id: { $in: ids } }).toArray();
};

export const findUsers = async (filter: Filter<UserDoc>): Promise<UserDoc[]> => {
  const col = await collection();
  return col.find(filter).toArray();
};

export const insertUser = async (doc: UserDoc): Promise<void> => {
  const col = await collection();
  await col.insertOne(doc);
};
