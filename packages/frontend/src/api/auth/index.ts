import type { AuthResponse, User } from "@event-platform/shared";
import { apiRequest } from "../client";

interface SignupInput {
  email: string;
  password: string;
  name: string;
  role: "organizer" | "attendee";
}

interface LoginInput {
  email: string;
  password: string;
}

export const signupRequest = (input: SignupInput) =>
  apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const loginRequest = (input: LoginInput) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const meRequest = () =>
  apiRequest<{ user: User }>("/auth/me", {
    method: "GET",
    auth: true
  });
