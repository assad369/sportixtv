import "server-only";
import { MongoClient, type Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    // Cached on globalThis: survives lambda warm reuse and dev HMR without
    // leaking connections.
    globalThis._mongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
    }).connect();
  }
  return globalThis._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "sportixtv");
}
