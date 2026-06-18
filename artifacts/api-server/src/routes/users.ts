import { Router } from "express";
import { db, usersTable, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth, type AuthRequest } from "../lib/auth";
import { UpdateUserBody, AddUserAddressBody } from "@workspace/api-zod";

const router = Router();

function fmtUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

function fmtAddress(a: typeof addressesTable.$inferSelect) {
  return { id: a.id, userId: a.userId, label: a.label ?? null, line1: a.line1, line2: a.line2 ?? null, city: a.city, state: a.state, country: a.country, zip: a.zip, isDefault: a.isDefault };
}

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(fmtUser));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  // only admin can change roles; users can only update their own profile
  if (authReq.user.role === "user" && authReq.user.id !== id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.email) updates.email = parsed.data.email;
  if (parsed.data.role && (authReq.user.role === "admin")) updates.role = parsed.data.role;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtUser(user));
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

router.get("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, id));
  res.json(addresses.map(fmtAddress));
});

router.post("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = AddUserAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [address] = await db.insert(addressesTable).values({ ...parsed.data, userId: id }).returning();
  res.status(201).json(fmtAddress(address));
});

export default router;
