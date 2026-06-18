import { Router } from "express";
import { usersRepo, addressesRepo, type User, type Address } from "@workspace/db";
import { requireAdmin, requireAuth, type AuthRequest } from "../lib/auth";
import { UpdateUserBody, AddUserAddressBody } from "@workspace/api-zod";

const router = Router();

function fmtUser(u: User) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

function fmtAddress(a: Address) {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    country: a.country,
    zip: a.zip,
    isDefault: a.isDefault,
  };
}

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await usersRepo.listUsers();
  res.json(users.map(fmtUser));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const user = await usersRepo.findUserById(id);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (authReq.user.role === "user" && authReq.user.id !== id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Partial<Pick<User, "name" | "email" | "role">> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.email) updates.email = parsed.data.email;
  if (parsed.data.role && authReq.user.role === "admin") updates.role = parsed.data.role;

  const user = await usersRepo.updateUser(id, updates);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtUser(user));
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await usersRepo.deleteUser(id);
  res.sendStatus(204);
});

router.get("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const addresses = await addressesRepo.listAddressesByUser(id);
  res.json(addresses.map(fmtAddress));
});

router.post("/users/:id/addresses", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = AddUserAddressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const address = await addressesRepo.createAddress({
    userId: id,
    line1: parsed.data.line1,
    city: parsed.data.city,
    state: parsed.data.state,
    country: parsed.data.country,
    zip: parsed.data.zip,
    label: parsed.data.label ?? null,
    line2: parsed.data.line2 ?? null,
    isDefault: parsed.data.isDefault ?? false,
  });
  res.status(201).json(fmtAddress(address));
});

export default router;
