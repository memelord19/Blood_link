import { Router } from "express";
import { db, donorsTable } from "@workspace/db";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/donors", authMiddleware, async (req, res) => {
  try {
    const { cin, bloodType, region } = req.query;
    const conditions: SQL[] = [];
    if (cin) conditions.push(ilike(donorsTable.cin, `%${cin}%`));
    if (bloodType) conditions.push(eq(donorsTable.bloodType, bloodType as string));
    if (region) conditions.push(eq(donorsTable.region, region as string));
    const donors = conditions.length > 0
      ? await db.select().from(donorsTable).where(and(...conditions))
      : await db.select().from(donorsTable);
    res.json({ donors, total: donors.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/donors/by-cin/:cin", authMiddleware, async (req, res) => {
  try {
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.cin, req.params.cin)).limit(1);
    if (!donor) { res.status(404).json({ error: "Donor not found" }); return; }
    res.json(donor);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/donors/register", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, cin, dateOfBirth, gender, weight, phone, email, region, bloodType } = req.body;
    const existingByCin = await db.select().from(donorsTable).where(eq(donorsTable.cin, cin)).limit(1);
    if (existingByCin.length > 0) {
      res.status(409).json({ error: "Donor with this CIN already exists" });
      return;
    }
    const [donor] = await db.insert(donorsTable).values({ firstName, lastName, cin, dateOfBirth, gender, weight: parseFloat(weight), phone, email, region, bloodType }).returning();
    res.status(201).json(donor);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/donors/:id", authMiddleware, async (req, res) => {
  try {
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.id, parseInt(req.params.id))).limit(1);
    if (!donor) { res.status(404).json({ error: "Not found" }); return; }
    res.json(donor);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/donors/:id/eligibility", authMiddleware, async (req, res) => {
  try {
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.id, parseInt(req.params.id))).limit(1);
    if (!donor) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ eligible: donor.eligibilityStatus === "eligible", status: donor.eligibilityStatus, nextEligibleDate: donor.nextEligibleDate, reason: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/donors/:id/medical-form", authMiddleware, async (req, res) => {
  try {
    const { recentSurgeries, recentTravelEndemicZones, recentDentalCare, currentMedications } = req.body;
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.id, parseInt(req.params.id))).limit(1);
    if (!donor) { res.status(404).json({ error: "Not found" }); return; }
    
    let status: string = "eligible";
    let reason: string | null = null;
    if (recentSurgeries) { status = "temporarily_excluded"; reason = "Chirurgie récente"; }
    if (recentTravelEndemicZones) { status = "temporarily_excluded"; reason = "Voyage en zone endémique récent"; }
    if (recentDentalCare) { status = "temporarily_excluded"; reason = "Soins dentaires récents"; }
    if (currentMedications && currentMedications.trim().length > 3) { status = "temporarily_excluded"; reason = "Médicaments en cours"; }
    
    await db.update(donorsTable).set({ eligibilityStatus: status }).where(eq(donorsTable.id, parseInt(req.params.id)));
    const nextDate = status === "eligible" ? null : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    res.json({ eligible: status === "eligible", status, reason, nextEligibleDate: nextDate });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
