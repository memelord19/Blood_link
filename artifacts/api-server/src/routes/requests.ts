import { Router } from "express";
import { db, bloodRequestsTable, usersTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const { establishmentId, centerId, status, urgency } = req.query;
    const conditions: SQL[] = [];
    if (establishmentId) conditions.push(eq(bloodRequestsTable.establishmentId, parseInt(establishmentId as string)));
    if (centerId) conditions.push(eq(bloodRequestsTable.centerId as any, parseInt(centerId as string)));
    if (status) conditions.push(eq(bloodRequestsTable.status, status as string));
    if (urgency) conditions.push(eq(bloodRequestsTable.urgency, urgency as string));
    const requests = conditions.length > 0
      ? await db.select().from(bloodRequestsTable).where(and(...conditions))
      : await db.select().from(bloodRequestsTable);
    res.json({ requests, total: requests.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/requests", authMiddleware, async (req, res) => {
  try {
    const { bloodType, volume, urgency } = req.body;
    const user = req.user!;
    const [request] = await db.insert(bloodRequestsTable).values({
      establishmentId: user.id,
      establishmentName: user.organizationName || `${user.firstName} ${user.lastName}`,
      centerId: 1,
      centerName: "Centre National de Transfusion Sanguine",
      bloodType,
      volume: parseFloat(volume),
      urgency,
      status: "submitted",
    }).returning();
    res.status(201).json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/requests/:id", authMiddleware, async (req, res) => {
  try {
    const [request] = await db.select().from(bloodRequestsTable).where(eq(bloodRequestsTable.id, parseInt(req.params.id))).limit(1);
    if (!request) { res.status(404).json({ error: "Not found" }); return; }
    res.json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/requests/:id", authMiddleware, async (req, res) => {
  try {
    const { status, estimatedDelivery, rejectionReason } = req.body;
    const [request] = await db.update(bloodRequestsTable).set({ status, estimatedDelivery, rejectionReason, updatedAt: new Date() }).where(eq(bloodRequestsTable.id, parseInt(req.params.id))).returning();
    res.json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
