import { Router } from "express";
import {
  db,
  appointmentsTable,
  donorsTable,
  transfusionCentersTable,
  transfusionCenterSlotsTable,
} from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  authMiddleware,
  generateToken,
  hashPassword,
  verifyPassword,
} from "../lib/auth.js";

const router = Router();

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (const min of [0, 30]) {
      if (hour === 17 && min === 30) break;
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

function generateDates(days = 30): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ─── TRANSFUSION CENTERS ────────────────────────────────────────────────────

router.post("/transfusion-centers", async (req, res) => {
  try {
    const {
      nom,
      email,
      motDePasse,
      adresse,
      region,
      numTel,
      capaciteStockage,
    } = req.body;

    if (!nom || !email || !motDePasse || !adresse || !region || !numTel) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    const [existing] = await db
      .select()
      .from(transfusionCentersTable)
      .where(eq(transfusionCentersTable.email, email))
      .limit(1);

    if (existing) {
      return res
        .status(409)
        .json({ error: "Un centre avec cet email existe déjà." });
    }

    const hashedPassword = hashPassword(motDePasse);

    const [center] = await db
      .insert(transfusionCentersTable)
      .values({
        nom,
        email,
        motDePasse: hashedPassword,
        adresse,
        region,
        numTel,
        capaciteStockage: capaciteStockage ?? 0,
      })
      .returning();

    // Generate slots before sending response
    const dates = generateDates(30);
    const times = generateTimeSlots();

    const slotsToInsert = dates.flatMap((date) =>
      times.map((time) => ({
        centerId: center.id,
        date,
        time,
        isAvailable: 1 as const,
      })),
    );

    await db.insert(transfusionCenterSlotsTable).values(slotsToInsert);

    const { motDePasse: _, ...centerWithoutPassword } = center;
    res.status(201).json(centerWithoutPassword);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transfusion-centers", authMiddleware, async (req, res) => {
  try {
    const centers = await db
      .select({
        id: transfusionCentersTable.id,
        nom: transfusionCentersTable.nom,
        email: transfusionCentersTable.email,
        adresse: transfusionCentersTable.adresse,
        region: transfusionCentersTable.region,
        numTel: transfusionCentersTable.numTel,
        capaciteStockage: transfusionCentersTable.capaciteStockage,
        createdAt: transfusionCentersTable.createdAt,
      })
      .from(transfusionCentersTable);

    res.json({ centers, total: centers.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
