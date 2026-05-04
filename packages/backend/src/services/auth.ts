import { loginSchema, signupSchema } from "@event-platform/shared";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { conflictError, notFoundError, unauthorizedError, validationError } from "../lib/errors";
import { signAuthToken } from "../lib/jwt";
import { findUserByEmail, findUserById, insertUser, toPublicUser, type UserDoc } from "../repositories/users";

export const signup = async (input: unknown) => {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) throw validationError("Invalid signup payload", parsed.error.flatten());

  const email = parsed.data.email.toLowerCase();
  if (await findUserByEmail(email)) throw conflictError("Email already in use");

  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    email,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    name: parsed.data.name,
    role: parsed.data.role,
    createdAt: now,
    updatedAt: now
  };

  await insertUser(doc);
  const user = toPublicUser(doc);
  return { token: signAuthToken({ sub: user._id, role: user.role }), user };
};

export const login = async (input: unknown) => {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw validationError("Invalid login payload", parsed.error.flatten());

  const email = parsed.data.email.toLowerCase();
  const userDoc = await findUserByEmail(email);
  if (!userDoc) throw unauthorizedError("Invalid credentials");
  if (!(await bcrypt.compare(parsed.data.password, userDoc.passwordHash))) throw unauthorizedError("Invalid credentials");

  const user = toPublicUser(userDoc);
  return { token: signAuthToken({ sub: user._id, role: user.role }), user };
};

export const getMe = async (userId: string) => {
  if (!ObjectId.isValid(userId)) throw validationError("Invalid user id");
  const userDoc = await findUserById(new ObjectId(userId));
  if (!userDoc) throw notFoundError("User not found");
  return { user: toPublicUser(userDoc) };
};
