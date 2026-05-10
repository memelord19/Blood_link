import { Router } from "express";
import {
  db,
  usersTable,
  donorsTable,
  transfusionCentersTable,
  bloodBanksTable,
  establishmentsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  generateToken,
  hashPassword,
  verifyPassword,
  authMiddleware,
} from "../lib/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, accountType } = req.body;

    if (!email || !password || !accountType) {
      res
        .status(400)
        .json({ error: "Email, password and accountType required" });
      return;
    }

    if (accountType === "transfusion_center") {
      const [center] = await db
        .select()
        .from(transfusionCentersTable)
        .where(eq(transfusionCentersTable.email, email))
        .limit(1);

      if (!center || !verifyPassword(password, center.motDePasse)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = generateToken(center.id, "transfusion_center");
      res.json({
        user: {
          id: center.id,
          firstName: center.nom,
          lastName: "",
          email: center.email,
          role: "transfusion_center",
          region: center.region,
          organizationName: center.nom,
        },
        token,
      });
      return;
    }

    if (accountType === "hospital" || accountType === "clinic") {
      const [establishment] = await db
        .select()
        .from(establishmentsTable)
        .where(eq(establishmentsTable.email, email))
        .limit(1);

      if (
        !establishment ||
        !verifyPassword(password, establishment.motDePasse)
      ) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Make sure the account type matches
      if (establishment.type !== accountType) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = generateToken(establishment.id, accountType);
      res.json({
        user: {
          id: establishment.id,
          firstName: establishment.nom,
          lastName: "",
          email: establishment.email,
          role: establishment.type,
          region: establishment.region,
          organizationName: establishment.nom,
        },
        token,
      });
      return;
    }

    if (accountType === "blood_bank") {
      const [bloodBank] = await db
        .select()
        .from(bloodBanksTable)
        .where(eq(bloodBanksTable.email, email))
        .limit(1);

      if (!bloodBank || !verifyPassword(password, bloodBank.motDePasse)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = generateToken(bloodBank.id, "blood_bank");
      res.json({
        user: {
          id: bloodBank.id,
          firstName: bloodBank.nom,
          lastName: "",
          email: bloodBank.email,
          role: "blood_bank",
          region: bloodBank.region,
          organizationName: bloodBank.nom,
        },
        token,
      });
      return;
    }

    // Default: donor uses usersTable
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id, "donor");
    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: "donor",
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
    const {
      firstName,
      lastName,
      cin,
      dateOfBirth,
      gender,
      weight,
      phone,
      email,
      password,
      region,
      bloodType,
      acceptedCharter,
    } = req.body;
    if (!acceptedCharter) {
      res.status(400).json({ error: "Must accept the donor charter" });
      return;
    }
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({
        firstName,
        lastName,
        email,
        passwordHash,
        role: "donor",
        phone,
        region,
      })
      .returning();
    await db.insert(donorsTable).values({
      userId: user.id,
      firstName,
      lastName,
      cin,
      dateOfBirth,
      gender,
      weight: parseFloat(weight),
      phone,
      email,
      region,
      bloodType,
    });
    const token = generateToken(user.id, "donor");
    res.status(201).json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        region: user.region,
      },
      token,
    });
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
  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  });
});

export default router;
