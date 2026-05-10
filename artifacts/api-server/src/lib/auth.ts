import { Request, Response, NextFunction } from "express";
import {
  db,
  usersTable,
  transfusionCentersTable,
  bloodBanksTable,
  establishmentsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(userId: number, accountType: string): string {
  return Buffer.from(`${userId}:${accountType}:${Date.now()}`).toString(
    "base64",
  );
}

export function parseToken(
  token: string,
): { id: number; accountType: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, accountType] = decoded.split(":");
    const id = parseInt(userId, 10);
    return isNaN(id) ? null : { id, accountType };
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const parsed = parseToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { id, accountType } = parsed;

  if (accountType === "transfusion_center") {
    const [center] = await db
      .select()
      .from(transfusionCentersTable)
      .where(eq(transfusionCentersTable.id, id))
      .limit(1);
    if (center) {
      req.user = {
        id: center.id,
        email: center.email,
        role: "transfusion_center",
        firstName: center.nom,
        lastName: "",
        organizationName: center.nom,
      };
      return next();
    }
  } else if (accountType === "hospital" || accountType === "clinic") {
    const [establishment] = await db
      .select()
      .from(establishmentsTable)
      .where(eq(establishmentsTable.id, id))
      .limit(1);
    if (establishment) {
      req.user = {
        id: establishment.id,
        email: establishment.email,
        role: establishment.type,
        firstName: establishment.nom,
        lastName: "",
        organizationName: establishment.nom,
      };
      return next();
    }
  } else if (accountType === "blood_bank") {
    const [bloodBank] = await db
      .select()
      .from(bloodBanksTable)
      .where(eq(bloodBanksTable.id, id))
      .limit(1);
    if (bloodBank) {
      req.user = {
        id: bloodBank.id,
        email: bloodBank.email,
        role: "blood_bank",
        firstName: bloodBank.nom,
        lastName: "",
        organizationName: bloodBank.nom,
      };
      return next();
    }
  } else {
    // donor
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationName: user.organizationName ?? undefined,
      };
      return next();
    }
  }

  res.status(401).json({ error: "User not found" });
}

export function hashPassword(password: string): string {
  // Simple hash for demo purposes
  return Buffer.from(password + "bloodlink_salt_2025").toString("base64");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
