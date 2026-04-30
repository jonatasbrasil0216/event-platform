import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { getDb } from "../db/client";
import { requireAuth } from "../lib/auth";
import { forbiddenError } from "../lib/errors";
import { sendError } from "../lib/http";
import { getMe, login, signup } from "../services/auth";
import {
  cancelEvent,
  createEvent,
  deleteEvent,
  getEventById,
  listMyEvents,
  listPublishedEvents,
  makeEventDraft,
  republishEvent,
  updateEvent
} from "../services/events";
import {
  cancelRegistration,
  listEventAttendees,
  listMyRegistrations,
  registerForEvent
} from "../services/registrations";
import { parseAndSearch } from "../services/search";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true
  })
);
app.use(express.json());

app.get("/health", async (_req, res, next) => {
  try {
    await getDb();
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/events", async (_req, res, next) => {
  try {
    const result = await listPublishedEvents();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/events/mine", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await listMyEvents(auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/events/:id", async (req, res, next) => {
  try {
    const result = await getEventById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/events", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await createEvent(auth.userId.toString(), req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.patch("/events/:id", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await updateEvent(req.params.id, auth.userId.toString(), req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.delete("/events/:id", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    await deleteEvent(req.params.id, auth.userId.toString());
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.patch("/events/:id/cancel", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await cancelEvent(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.patch("/events/:id/republish", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await republishEvent(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.patch("/events/:id/draft", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await makeEventDraft(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/events/:id/register", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "attendee") {
      throw forbiddenError("Attendee access required");
    }
    const result = await registerForEvent(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.delete("/events/:id/register", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "attendee") {
      throw forbiddenError("Attendee access required");
    }
    const result = await cancelRegistration(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/registrations/mine", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "attendee") {
      throw forbiddenError("Attendee access required");
    }
    const result = await listMyRegistrations(auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/events/:id/attendees", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    if (auth.role !== "organizer") {
      throw forbiddenError("Organizer access required");
    }
    const result = await listEventAttendees(req.params.id, auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/search/parse", async (req, res, next) => {
  try {
    const result = await parseAndSearch(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/auth/signup", async (req, res, next) => {
  try {
    const result = await signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/auth/me", async (req, res, next) => {
  try {
    const auth = requireAuth(req);
    const result = await getMe(auth.userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}`, {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    body: req.body
  });
  sendError(res, error);
});

const port = 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend local server running on http://localhost:${port}`);
});
