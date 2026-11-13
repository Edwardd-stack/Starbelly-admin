import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Testlar uchun alohida xotiradagi MongoDB (replica set — tranzaksiyalar uchun shart).
 * Haqiqiy Atlas bazasiga tegilmaydi.
 */
export default async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  (globalThis as unknown as { __MONGO__: MongoMemoryReplSet }).__MONGO__ = replSet;

  process.env.MONGO_URL = replSet.getUri("starbelly-test");
  process.env.SECRET_TOKEN = "test-secret";
  process.env.SESSION_SECRET = "test-session";
  process.env.CLIENT_URL = "http://localhost:5000";
}
