import { Router } from "express";
import {
  db,
  bloodRequestsTable,
  usersTable,
  transfusionCentersTable,
  bloodBanksTable,
} from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const { establishmentId, centerId, status, urgency } = req.query;
    const conditions: SQL[] = [];

    if (
      req.user!.role === "transfusion_center" ||
      req.user!.role === "blood_bank"
    ) {
      conditions.push(eq(bloodRequestsTable.centerId, req.user!.id));
      conditions.push(eq(bloodRequestsTable.centerType, req.user!.role));
    } else if (req.user!.role === "hospital" || req.user!.role === "clinic") {
      conditions.push(eq(bloodRequestsTable.establishmentId, req.user!.id));
    } else {
      if (establishmentId)
        conditions.push(
          eq(
            bloodRequestsTable.establishmentId,
            parseInt(establishmentId as string),
          ),
        );
      if (centerId)
        conditions.push(
          eq(bloodRequestsTable.centerId as any, parseInt(centerId as string)),
        );
    }

    if (status)
      conditions.push(eq(bloodRequestsTable.status, status as string));
    if (urgency)
      conditions.push(eq(bloodRequestsTable.urgency, urgency as string));

    const requests =
      conditions.length > 0
        ? await db
            .select()
            .from(bloodRequestsTable)
            .where(and(...conditions))
        : await db.select().from(bloodRequestsTable);

    res.json({ requests, total: requests.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/requests", authMiddleware, async (req, res) => {
  try {
    const { bloodType, volume, urgency, centerId } = req.body;
    const user = req.user!;
    console.log("req.user:", JSON.stringify(req.user));
    console.log("centerId from body:", req.body.centerId);

    if (!centerId) {
      return res
        .status(400)
        .json({ error: "Veuillez sélectionner un centre de transfusion." });
    }

    // Strip prefix and determine which table to query
    const isBloodBank =
      typeof centerId === "string" && centerId.startsWith("bb_");
    const rawId = parseInt(String(centerId).replace(/^(tc_|bb_)/, ""));

    if (isNaN(rawId)) {
      return res.status(400).json({ error: "Identifiant du centre invalide." });
    }

    // Query the correct table based on the prefix
    let centerName: string;
    let centerRegion: string;
    let resolvedCenterId: number;

    if (isBloodBank) {
      const [center] = await db
        .select()
        .from(bloodBanksTable)
        .where(eq(bloodBanksTable.id, rawId))
        .limit(1);

      if (!center)
        return res.status(404).json({ error: "Banque de sang introuvable." });

      centerName = center.nom;
      centerRegion = center.region;
      resolvedCenterId = center.id;
    } else {
      const [center] = await db
        .select()
        .from(transfusionCentersTable)
        .where(eq(transfusionCentersTable.id, rawId))
        .limit(1);

      if (!center)
        return res.status(404).json({ error: "Centre introuvable." });

      centerName = center.nom;
      centerRegion = center.region;
      resolvedCenterId = center.id;
    }

    const [request] = await db
      .insert(bloodRequestsTable)
      .values({
        establishmentId: user.id,
        establishmentName:
          user.organizationName ?? `${user.firstName} ${user.lastName}`,
        centerId: resolvedCenterId,
        centerName,
        centerType: isBloodBank ? "blood_bank" : "transfusion_center",
        bloodType,
        volume: parseFloat(volume),
        urgency,
        status: "submitted",
      })
      .returning();

    res.status(201).json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/requests/:id", authMiddleware, async (req, res) => {
  try {
    const [request] = await db
      .select()
      .from(bloodRequestsTable)
      .where(eq(bloodRequestsTable.id, parseInt(req.params.id)))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/requests/:id", authMiddleware, async (req, res) => {
  try {
    const { status, estimatedDelivery, rejectionReason } = req.body;
    const [request] = await db
      .update(bloodRequestsTable)
      .set({
        status,
        estimatedDelivery,
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(bloodRequestsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
