import { Router } from "express";
import {
  db,
  bloodRequestsTable,
  usersTable,
  transfusionCentersTable,
  bloodBanksTable,
  invoicesTable,
  establishmentsTable,
  bloodBagsTable,
} from "@workspace/db";
import { eq, and, SQL, ne } from "drizzle-orm";
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
    const { bloodType, volume, urgency, centerIds } = req.body;
    const user = req.user!;
    const totalVolume = parseFloat(volume);

    const createRequest = async (centerId: string) => {
      const isBloodBank = String(centerId).startsWith("bb_");
      const rawId = parseInt(String(centerId).replace(/^(tc_|bb_)/, ""));

      if (isNaN(rawId)) throw new Error("Identifiant du centre invalide.");

      let centerName: string;
      let centerRegion: string;
      let resolvedCenterId: number;

      if (isBloodBank) {
        const [center] = await db
          .select()
          .from(bloodBanksTable)
          .where(eq(bloodBanksTable.id, rawId))
          .limit(1);
        if (!center) throw new Error("Banque de sang introuvable.");
        centerName = center.nom;
        centerRegion = center.region;
        resolvedCenterId = center.id;
      } else {
        const [center] = await db
          .select()
          .from(transfusionCentersTable)
          .where(eq(transfusionCentersTable.id, rawId))
          .limit(1);
        if (!center) throw new Error("Centre introuvable.");
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
          volume: totalVolume,
          urgency,
          status: "submitted",
        })
        .returning();

      return request;
    };

    const createInvoice = async (requestId: number) => {
      const isEmergency = urgency === "critical";
      const baseRate = 50;
      const volumeAmount = (totalVolume / 100) * baseRate;
      const urgencyMultiplier =
        urgency === "critical" ? 2 : urgency === "urgent" ? 1.5 : 1;
      const amount = Math.round(volumeAmount * urgencyMultiplier * 100) / 100;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await db.insert(invoicesTable).values({
        establishmentId: user.id,
        establishmentName:
          user.organizationName ?? `${user.firstName} ${user.lastName}`,
        requestId,
        amount,
        status: "pending",
        isEmergency,
        dueDate: dueDate.toISOString().split("T")[0],
      });
    };

    // Hospital with internal blood bank
    if (user.role === "hospital") {
      const [establishment] = await db
        .select()
        .from(establishmentsTable)
        .where(eq(establishmentsTable.id, user.id))
        .limit(1);

      if (establishment?.bloodBankId) {
        const [internalBank] = await db
          .select()
          .from(bloodBanksTable)
          .where(eq(bloodBanksTable.id, establishment.bloodBankId))
          .limit(1);

        const internalBags = await db
          .select()
          .from(bloodBagsTable)
          .where(
            and(
              eq(bloodBagsTable.centerId, establishment.bloodBankId),
              eq(bloodBagsTable.centerType, "blood_bank"),
              eq(bloodBagsTable.bloodType, bloodType),
              eq(bloodBagsTable.status, "available"),
            ),
          );

        const mlPerBag = 450;
        const volumeAvailable = internalBags.length * mlPerBag;
        const isFullyCovered = volumeAvailable >= totalVolume;

        const internalRequest = await createRequest(`bb_${internalBank.id}`);
        const requests = [internalRequest];

        if (isFullyCovered) {
          return res.status(201).json({ requests });
        }

        if (centerIds?.length > 0) {
          const externalIds = centerIds.slice(0, 3);
          for (const cid of externalIds) {
            const req = await createRequest(cid);
            requests.push(req);
          }
          return res.status(201).json({ requests });
        }

        const otherBanks = await db
          .select({
            id: bloodBanksTable.id,
            nom: bloodBanksTable.nom,
            adresse: bloodBanksTable.adresse,
            region: bloodBanksTable.region,
          })
          .from(bloodBanksTable)
          .where(ne(bloodBanksTable.id, establishment.bloodBankId));

        const otherCenters = await db
          .select({
            id: transfusionCentersTable.id,
            nom: transfusionCentersTable.nom,
            adresse: transfusionCentersTable.adresse,
            region: transfusionCentersTable.region,
          })
          .from(transfusionCentersTable);

        const externalCenters = [
          ...otherBanks.map((b) => ({
            ...b,
            prefixedId: `bb_${b.id}`,
            type: "blood_bank",
          })),
          ...otherCenters.map((c) => ({
            ...c,
            prefixedId: `tc_${c.id}`,
            type: "transfusion_center",
          })),
        ];

        return res.status(200).json({
          needsExternalSelection: true,
          internalRequest,
          internalStockInsufficient: true,
          externalCenters,
          volumeRequested: totalVolume,
          volumeAvailable,
        });
      }
    }

    // Hospital without blood bank or clinic — need centerIds
    if (!centerIds || centerIds.length === 0) {
      const banks = await db
        .select({
          id: bloodBanksTable.id,
          nom: bloodBanksTable.nom,
          adresse: bloodBanksTable.adresse,
          region: bloodBanksTable.region,
        })
        .from(bloodBanksTable);

      const centers = await db
        .select({
          id: transfusionCentersTable.id,
          nom: transfusionCentersTable.nom,
          adresse: transfusionCentersTable.adresse,
          region: transfusionCentersTable.region,
        })
        .from(transfusionCentersTable);

      const externalCenters = [
        ...banks.map((b) => ({
          ...b,
          prefixedId: `bb_${b.id}`,
          type: "blood_bank",
        })),
        ...centers.map((c) => ({
          ...c,
          prefixedId: `tc_${c.id}`,
          type: "transfusion_center",
        })),
      ];

      return res.status(200).json({
        needsExternalSelection: true,
        internalRequest: null,
        internalStockInsufficient: false,
        externalCenters,
        volumeRequested: totalVolume,
      });
    }

    // centerIds provided — create a request for each (max 3)
    const selectedIds = centerIds.slice(0, 3);
    const requests = [];
    for (const cid of selectedIds) {
      const req = await createRequest(cid);
      requests.push(req);
    }

    // Create only ONE invoice for the clinic linked to the first request
    if (user.role === "clinic" && requests.length > 0) {
      await createInvoice(requests[0].id);
    }

    res.status(201).json({ requests });
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
