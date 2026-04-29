import type { Request } from "express";
import { ObjectId } from "mongodb";
import { unauthorizedError } from "./errors";
import { verifyAuthToken } from "./jwt";

export interface AuthContext {
  userId: ObjectId;
  role: "organizer" | "attendee";
}

export const requireAuth = (req: Request): AuthContext => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw unauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyAuthToken(token);

  return {
    userId: new ObjectId(payload.sub),
    role: payload.role
  };
};
