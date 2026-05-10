import { Router } from "express";
import { db, bloodBanksTable, bloodBankSlotsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, hashPassword } from "../lib/auth.js";

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

// ─── BLOOD BANKS ──────────────────────────────────────────────────────────────

router.post("/blood-banks", async (req, res) => {
  try {
    const {
      nom,
      email,
      motDePasse,
      adresse,
      region,
      numTel,
      seuilCritique,
      hopitalId,
      centreTransfusionId,
    } = req.body;

    if (!nom || !email || !motDePasse || !adresse || !region || !numTel) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    const [existing] = await db
      .select()
      .from(bloodBanksTable)
      .where(eq(bloodBanksTable.email, email))
      .limit(1);

    if (existing) {
      return res
        .status(409)
        .json({ error: "Une banque de sang avec cet email existe déjà." });
    }

    const hashedPassword = hashPassword(motDePasse);

    const [bloodBank] = await db
      .insert(bloodBanksTable)
      .values({
        nom,
        email,
        motDePasse: hashedPassword,
        adresse,
        region,
        numTel,
        seuilCritique: seuilCritique ?? 10,
        ...(hopitalId ? { hopitalId: parseInt(hopitalId) } : {}),
        ...(centreTransfusionId
          ? { centreTransfusionId: parseInt(centreTransfusionId) }
          : {}),
      })
      .returning();

    // Generate slots automatically
    const dates = generateDates(30);
    const times = generateTimeSlots();

    const slotsToInsert = dates.flatMap((date) =>
      times.map((time) => ({
        bankId: bloodBank.id,
        date,
        time,
        isAvailable: 1 as const,
      })),
    );
    console.log(dates.length);
    console.log("Total slots to insert:", slotsToInsert.length);
    await db.insert(bloodBankSlotsTable).values(slotsToInsert);
    console.log("Slots inserted successfully");
    const { motDePasse: _, ...bloodBankWithoutPassword } = bloodBank;
    res.status(201).json(bloodBankWithoutPassword);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blood-banks", authMiddleware, async (req, res) => {
  try {
    const bloodBanks = await db
      .select({
        id: bloodBanksTable.id,
        nom: bloodBanksTable.nom,
        email: bloodBanksTable.email,
        adresse: bloodBanksTable.adresse,
        region: bloodBanksTable.region,
        numTel: bloodBanksTable.numTel,
        seuilCritique: bloodBanksTable.seuilCritique,
        hopitalId: bloodBanksTable.hopitalId,
        createdAt: bloodBanksTable.createdAt,
      })
      .from(bloodBanksTable);

    res.json({ bloodBanks, total: bloodBanks.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
