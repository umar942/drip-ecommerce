import { MongoClient, type Db } from "mongodb";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "MONGODB_URI must be set. Add your MongoDB Atlas connection string to .env",
    );
  }
  return uri;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(getMongoUri());
  await client.connect();
  db = client.db();
  await ensureIndexes(db);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectDb() first.");
  }
  return db;
}

export async function disconnectDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

async function ensureIndexes(database: Db): Promise<void> {
  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("users").createIndex({ id: 1 }, { unique: true }),
    database.collection("categories").createIndex({ slug: 1 }, { unique: true }),
    database.collection("categories").createIndex({ id: 1 }, { unique: true }),
    database.collection("products").createIndex({ id: 1 }, { unique: true }),
    database.collection("products").createIndex({ category: 1 }),
    database.collection("products").createIndex({ featured: 1 }),
    database.collection("addresses").createIndex({ id: 1 }, { unique: true }),
    database.collection("addresses").createIndex({ userId: 1 }),
    database.collection("cartItems").createIndex({ id: 1 }, { unique: true }),
    database.collection("cartItems").createIndex({ userId: 1, productId: 1 }),
    database.collection("wishlistItems").createIndex({ id: 1 }, { unique: true }),
    database.collection("wishlistItems").createIndex({ userId: 1, productId: 1 }, { unique: true }),
    database.collection("orders").createIndex({ id: 1 }, { unique: true }),
    database.collection("orders").createIndex({ userId: 1 }),
    database.collection("orderItems").createIndex({ id: 1 }, { unique: true }),
    database.collection("orderItems").createIndex({ orderId: 1 }),
    database.collection("otps").createIndex({ email: 1, purpose: 1 }),
    database.collection("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
