import bcrypt from "bcrypt";
import { type Collection, ObjectId } from "mongodb";
import { loginSchema, signupSchema, type User, type UserRole } from "@event-platform/shared";
import { getDb } from "../db/client";
import { conflictError, notFoundError, unauthorizedError, validationError } from "../lib/errors";
import { signAuthToken } from "../lib/jwt";

interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const usersCollection = async (): Promise<Collection<UserDoc>> => {
  const db = await getDb();
  return db.collection<UserDoc>("users");
};

const toPublicUser = (doc: UserDoc): User => ({
  _id: doc._id.toString(),
  email: doc.email,
  name: doc.name,
  role: doc.role,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

export const signup = async (input: unknown) => {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError("Invalid signup payload", parsed.error.flatten());
  }

  const users = await usersCollection();
  const email = parsed.data.email.toLowerCase();
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw conflictError("Email already in use");
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const newUser: UserDoc = {
    _id: new ObjectId(),
    email,
    passwordHash,
    name: parsed.data.name,
    role: parsed.data.role,
    createdAt: now,
    updatedAt: now
  };

  await users.insertOne(newUser);

  const user = toPublicUser(newUser);
  const token = signAuthToken({ sub: user._id, role: user.role });
  return { token, user };
};

export const login = async (input: unknown) => {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError("Invalid login payload", parsed.error.flatten());
  }

  const users = await usersCollection();
  const email = parsed.data.email.toLowerCase();
  const userDoc = await users.findOne({ email });
  if (!userDoc) {
    throw unauthorizedError("Invalid credentials");
  }

  const ok = await bcrypt.compare(parsed.data.password, userDoc.passwordHash);
  if (!ok) {
    throw unauthorizedError("Invalid credentials");
  }

  const user = toPublicUser(userDoc);
  const token = signAuthToken({ sub: user._id, role: user.role });
  return { token, user };
};

export const getMe = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    throw validationError("Invalid user id");
  }

  const users = await usersCollection();
  const userDoc = await users.findOne({ _id: new ObjectId(userId) });
  if (!userDoc) {
    throw notFoundError("User not found");
  }

  return { user: toPublicUser(userDoc) };
};
