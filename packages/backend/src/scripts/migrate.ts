import "dotenv/config";
import { MongoClient } from "mongodb";
import { getEnv } from "../lib/env";

const run = async () => {
  const env = getEnv();
  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000
  });

  await client.connect();
  const db = client.db();

  // Ensure collections exist before indexing.
  await db.createCollection("users").catch(() => undefined);
  await db.createCollection("events").catch(() => undefined);
  await db.createCollection("registrations").catch(() => undefined);

  await db.collection("users").createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });

  await db.collection("events").createIndexes([
    { key: { date: 1 }, name: "events_date" },
    { key: { organizerId: 1, createdAt: -1 }, name: "events_organizer_createdAt" },
    { key: { category: 1, date: 1 }, name: "events_category_date" },
    { key: { name: "text", description: "text" }, name: "events_text_name_description" }
  ]);

  await db.collection("registrations").createIndexes([
    {
      key: { eventId: 1, userId: 1 },
      name: "registrations_active_event_user_unique",
      unique: true,
      partialFilterExpression: { status: "active" }
    },
    { key: { userId: 1, registeredAt: -1 }, name: "registrations_user_registeredAt" },
    { key: { eventId: 1, status: 1 }, name: "registrations_event_status" }
  ]);

  await client.close();
  console.log("Database migration complete.");
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
