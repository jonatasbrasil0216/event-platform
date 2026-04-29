import { MongoClient, type Db } from "mongodb";
import { getEnv } from "../lib/env";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export const getDb = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const env = getEnv();
  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000
  });

  await client.connect();
  cachedClient = client;
  cachedDb = client.db();
  return cachedDb;
};

export const closeDb = async (): Promise<void> => {
  if (!cachedClient) {
    return;
  }

  await cachedClient.close();
  cachedClient = null;
  cachedDb = null;
};
