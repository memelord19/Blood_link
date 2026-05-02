import { Router } from "express";
import { db, usersTable, donorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken, hashPassword, verifyPassword, authMiddleware } from "../lib/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id);
    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        region: user.region,
        organizationName: user.organizationName,
      },
      token,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, cin, dateOfBirth, gender, weight, phone, email, password, region, bloodType, acceptedCharter } = req.body;
    if (!acceptedCharter) {
      res.status(400).json({ error: "Must accept the donor charter" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({ firstName, lastName, email, passwordHash, role: "donor", phone, region }).returning();
    await db.insert(donorsTable).values({ userId: user.id, firstName, lastName, cin, dateOfBirth, gender, weight: parseFloat(weight), phone, email, region, bloodType });
    const token = generateToken(user.id);
    res.status(201).json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, region: user.region }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/me", authMiddleware, async (req, res) => {
  const user = req.user!;
  res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role });
});

export default router;
