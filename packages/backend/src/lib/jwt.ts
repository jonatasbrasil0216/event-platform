import jwt from "jsonwebtoken";
import { getEnv } from "./env";
import { unauthorizedError } from "./errors";

interface JwtPayload {
  sub: string;
  role: "organizer" | "attendee";
}

export const signAuthToken = (payload: JwtPayload): string => {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
};

export const verifyAuthToken = (token: string): JwtPayload => {
  const env = getEnv();
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw unauthorizedError("Invalid or expired token");
  }
};
