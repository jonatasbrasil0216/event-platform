import type { Request } from "express";
import { ObjectId } from "mongodb";
import { forbiddenError, unauthorizedError } from "./errors";
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

export const requireRole = (auth: AuthContext, role: "organizer" | "attendee"): void => {
  if (auth.role !== role) {
    const label = role.charAt(0).toUpperCase() + role.slice(1);
    throw forbiddenError(`${label} access required`);
  }
};
