import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { usersRepo, type User } from "@workspace/db";

const JWT_SECRET = process.env.SESSION_SECRET ?? "fallback-secret-change-me";

export function signToken(payload: { id: number; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const user = await usersRepo.findUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req as Request & { user: User }).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as Request & { user: User }).user;
    if (user.role !== "admin" && user.role !== "staff") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export type AuthRequest = Request & { user: User };
