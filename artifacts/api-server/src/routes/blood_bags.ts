import { Router } from "express";
import { db, bloodBagsTable } from "@workspace/db";
import { eq, and, SQL, lte } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/blood-bags/scan/:barcode", authMiddleware, async (req, res) => {
  try {
    const [bag] = await db.select().from(bloodBagsTable).where(eq(bloodBagsTable.barcode, req.params.barcode)).limit(1);
    if (!bag) { res.status(404).json({ error: "Blood bag not found" }); return; }
    res.json(bag);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blood-bags", authMiddleware, async (req, res) => {
  try {
    const { bloodType, centerId, status, expiringBefore } = req.query;
    const conditions: SQL[] = [];
    if (bloodType) conditions.push(eq(bloodBagsTable.bloodType, bloodType as string));
    if (centerId) conditions.push(eq(bloodBagsTable.centerId, parseInt(centerId as string)));
    if (status) conditions.push(eq(bloodBagsTable.status, status as string));
    if (expiringBefore) conditions.push(lte(bloodBagsTable.expirationDate, expiringBefore as string));
    const bags = conditions.length > 0
      ? await db.select().from(bloodBagsTable).where(and(...conditions))
      : await db.select().from(bloodBagsTable);
    res.json({ bloodBags: bags, total: bags.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blood-bags/:id", authMiddleware, async (req, res) => {
  try {
    const [bag] = await db.select().from(bloodBagsTable).where(eq(bloodBagsTable.id, parseInt(req.params.id))).limit(1);
    if (!bag) { res.status(404).json({ error: "Not found" }); return; }
    res.json(bag);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/blood-bags/:id/receive", authMiddleware, async (req, res) => {
  try {
    const { temperatureOk, integrityOk, accepted, rejectionReason } = req.body;
    const status = accepted && temperatureOk && integrityOk ? "available" : "rejected";
    const [bag] = await db.update(bloodBagsTable).set({
      status,
      rejectionReason: status === "rejected" ? (rejectionReason || "Inspection échouée") : null,
      receivedAt: new Date().toISOString().split("T")[0],
    }).where(eq(bloodBagsTable.id, parseInt(req.params.id))).returning();
    res.json(bag);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
