import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Simple token-based auth: token = base64(userId:timestamp)
export function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString("base64");
}

export function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    const id = parseInt(userId, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = parseToken(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName };
  next();
}

export function hashPassword(password: string): string {
  // Simple hash for demo purposes
  return Buffer.from(password + "bloodlink_salt_2025").toString("base64");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
