import { getDb } from "../connection";
import { nextId } from "../counter";
import type { User, InsertUser } from "../types";

const COL = "users";

export async function findUserById(id: number): Promise<User | null> {
  return getDb().collection<User>(COL).findOne({ id });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return getDb().collection<User>(COL).findOne({ email });
}

export async function listUsers(): Promise<User[]> {
  return getDb().collection<User>(COL).find().sort({ createdAt: 1 }).toArray();
}

export async function countUsers(): Promise<number> {
  return getDb().collection<User>(COL).countDocuments();
}

export async function createUser(data: InsertUser): Promise<User> {
  const now = new Date();
  const user: User = {
    id: await nextId(COL),
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role ?? "user",
    emailVerified: data.emailVerified ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection<User>(COL).insertOne(user);
  return user;
}

export async function updateUser(
  id: number,
  updates: Partial<Pick<User, "name" | "email" | "role">>,
): Promise<User | null> {
  const result = await getDb().collection<User>(COL).findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<User | null> {
  const result = await getDb().collection<User>(COL).findOneAndUpdate(
    { email },
    { $set: { passwordHash, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function deleteUser(id: number): Promise<void> {
  await getDb().collection<User>(COL).deleteOne({ id });
}
