import { Router } from "express";
import { db, alertsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/alerts", authMiddleware, async (req, res) => {
  try {
    const { bloodType, region, status } = req.query;
    const conditions: SQL[] = [];
    if (bloodType) conditions.push(eq(alertsTable.bloodType, bloodType as string));
    if (region) conditions.push(eq(alertsTable.region, region as string));
    if (status) conditions.push(eq(alertsTable.status, status as string));
    const alerts = conditions.length > 0
      ? await db.select().from(alertsTable).where(and(...conditions))
      : await db.select().from(alertsTable);
    res.json({ alerts, total: alerts.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts", authMiddleware, async (req, res) => {
  try {
    const { bloodType, region, urgency, message } = req.body;
    const user = req.user!;
    const [alert] = await db.insert(alertsTable).values({
      centerId: user.id,
      centerName: user.organizationName || `${user.firstName} ${user.lastName}`,
      bloodType,
      region,
      urgency,
      message,
      status: "active",
    }).returning();
    res.status(201).json(alert);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/alerts/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const updates: any = { status };
    if (status === "resolved") updates.resolvedAt = new Date().toISOString().split("T")[0];
    const [alert] = await db.update(alertsTable).set(updates).where(eq(alertsTable.id, parseInt(req.params.id))).returning();
    res.json(alert);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
