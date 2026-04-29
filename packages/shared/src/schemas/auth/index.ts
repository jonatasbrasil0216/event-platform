import { z } from "zod";

export const userRoleSchema = z.enum(["organizer", "attendee"]);

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(100),
  role: userRoleSchema
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});
