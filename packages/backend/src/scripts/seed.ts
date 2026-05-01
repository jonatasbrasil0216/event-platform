import "dotenv/config";
import bcrypt from "bcrypt";
import { MongoClient, ObjectId } from "mongodb";
import type { EventCategory, EventStatus, UserRole } from "@event-platform/shared";
import { getEnv } from "../lib/env";

interface SeedUser {
  _id: ObjectId;
  email: string;
  name: string;
  role: UserRole;
}

interface SeedEvent {
  name: string;
  description: string;
  category: EventCategory;
  daysFromNow: number;
  location: string;
  capacity: number;
  organizerIndex: number;
  status: EventStatus;
}

const password = "Password123!";

const organizers: Array<Omit<SeedUser, "_id">> = [
  { email: "organizer1@seed.eventplatform.local", name: "Avery Stone", role: "organizer" },
  { email: "organizer2@seed.eventplatform.local", name: "Morgan Lee", role: "organizer" }
];

const attendees: Array<Omit<SeedUser, "_id">> = Array.from({ length: 50 }, (_, index) => {
  const attendeeNumber = String(index + 1).padStart(3, "0");
  return {
    email: `attendee${attendeeNumber}@seed.eventplatform.local`,
    name: `Seed Attendee ${attendeeNumber}`,
    role: "attendee"
  };
});

const eventSeeds: SeedEvent[] = [
  {
    name: "TypeScript Serverless Workshop",
    description: "Hands-on workshop for building production-grade serverless APIs with TypeScript.",
    category: "tech",
    daysFromNow: 10,
    location: "Brooklyn, NY",
    capacity: 40,
    organizerIndex: 0,
    status: "published"
  },
  {
    name: "Founder Networking Breakfast",
    description: "A structured networking event for founders, operators, and early startup teams.",
    category: "networking",
    daysFromNow: 4,
    location: "Manhattan, NY",
    capacity: 60,
    organizerIndex: 1,
    status: "published"
  },
  {
    name: "Design Systems Deep Dive",
    description: "Learn how teams build reusable design systems that scale across product surfaces.",
    category: "workshop",
    daysFromNow: 18,
    location: "Remote",
    capacity: 35,
    organizerIndex: 0,
    status: "published"
  },
  {
    name: "Community Game Night",
    description: "A casual social evening with board games, snacks, and new friends.",
    category: "social",
    daysFromNow: 7,
    location: "Queens, NY",
    capacity: 30,
    organizerIndex: 1,
    status: "published"
  },
  {
    name: "AI Product Roundtable",
    description: "Discuss practical AI product strategy, evaluation, and customer adoption patterns.",
    category: "tech",
    daysFromNow: 24,
    location: "San Francisco, CA",
    capacity: 45,
    organizerIndex: 0,
    status: "published"
  },
  {
    name: "Career Switchers Meetup",
    description: "Meet peers moving into tech and hear practical transition stories.",
    category: "networking",
    daysFromNow: 14,
    location: "Austin, TX",
    capacity: 55,
    organizerIndex: 1,
    status: "published"
  },
  {
    name: "Past React Patterns Talk",
    description: "A completed session reviewing practical React architecture patterns.",
    category: "tech",
    daysFromNow: -12,
    location: "Chicago, IL",
    capacity: 50,
    organizerIndex: 0,
    status: "completed"
  },
  {
    name: "Draft Data Visualization Lab",
    description: "Draft event for exploring visual storytelling with dashboards and charts.",
    category: "workshop",
    daysFromNow: 30,
    location: "Seattle, WA",
    capacity: 25,
    organizerIndex: 1,
    status: "draft"
  },
  {
    name: "Cancelled Security Panel",
    description: "Cancelled panel about security practices for growing product teams.",
    category: "other",
    daysFromNow: 21,
    location: "Boston, MA",
    capacity: 80,
    organizerIndex: 0,
    status: "cancelled"
  },
  {
    name: "Product Analytics Jam",
    description: "Collaborative session for improving funnels, retention, and activation metrics.",
    category: "other",
    daysFromNow: 12,
    location: "Denver, CO",
    capacity: 42,
    organizerIndex: 1,
    status: "published"
  }
];

const eventDate = (daysFromNow: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const run = async () => {
  const env = getEnv();
  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000
  });
  await client.connect();
  const db = client.db();
  const users = db.collection("users");
  const events = db.collection("events");
  const registrations = db.collection("registrations");
  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);

  const seedUsers = [...organizers, ...attendees];
  await Promise.all(
    seedUsers.map((user) =>
      users.updateOne(
        { email: user.email },
        {
          $set: {
            name: user.name,
            role: user.role,
            updatedAt: now
          },
          $setOnInsert: {
            _id: new ObjectId(),
            email: user.email,
            passwordHash,
            createdAt: now
          }
        },
        { upsert: true }
      )
    )
  );

  const organizerDocs = (await users.find({ email: { $in: organizers.map((user) => user.email) } }).toArray()).sort(
    (a, b) => organizers.findIndex((user) => user.email === a.email) - organizers.findIndex((user) => user.email === b.email)
  );
  const attendeeDocs = await users.find({ email: { $in: attendees.map((user) => user.email) } }).sort({ email: 1 }).toArray();

  const upsertedEvents = [];
  for (const [index, seed] of eventSeeds.entries()) {
    const organizer = organizerDocs[seed.organizerIndex];
    const date = eventDate(seed.daysFromNow, 10 + (index % 8));
    await events.updateOne(
      { name: seed.name, organizerId: organizer._id },
      {
        $set: {
          description: seed.description,
          category: seed.category,
          date,
          location: seed.location,
          capacity: seed.capacity,
          status: seed.status,
          updatedAt: now
        },
        $setOnInsert: {
          _id: new ObjectId(),
          organizerId: organizer._id,
          registeredCount: 0,
          createdAt: now
        }
      },
      { upsert: true }
    );
    const event = await events.findOne({ name: seed.name, organizerId: organizer._id });
    if (event) upsertedEvents.push(event);
  }

  await registrations.deleteMany({ eventId: { $in: upsertedEvents.map((event) => event._id) } });
  const registrationDocs = upsertedEvents.flatMap((event, eventIndex) => {
    if (event.status !== "published" && event.status !== "completed") return [];
    const registrationCount = Math.min(event.capacity, event.status === "published" ? 18 + (eventIndex % 5) * 6 : 12);
    return Array.from({ length: registrationCount }, (_, attendeeIndex) => {
      const attendee = attendeeDocs[(eventIndex * 7 + attendeeIndex) % attendeeDocs.length];
      return {
      _id: new ObjectId(),
      eventId: event._id,
      userId: attendee._id,
      status: "active",
      registeredAt: new Date(now.getTime() - (eventIndex * 10 + attendeeIndex) * 60 * 60 * 1000),
      cancelledAt: null
      };
    });
  });
  if (registrationDocs.length) {
    await registrations.insertMany(registrationDocs);
  }

  await Promise.all(
    upsertedEvents.map((event) =>
      registrations
        .countDocuments({ eventId: event._id, status: "active" })
        .then((registeredCount) => events.updateOne({ _id: event._id }, { $set: { registeredCount } }))
    )
  );

  await client.close();
  // eslint-disable-next-line no-console
  console.log(`Seed complete. Password for all seed users: ${password}`);
  // eslint-disable-next-line no-console
  console.log(`Seeded ${organizers.length} organizers, ${attendees.length} attendees, ${eventSeeds.length} events.`);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error);
  process.exit(1);
});
