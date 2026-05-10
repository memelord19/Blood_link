import { Router } from "express";
import { db, bloodBagsTable } from "@workspace/db";
import { eq, and, SQL, lte } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/blood-bags/scan/:barcode", authMiddleware, async (req, res) => {
  try {
    const [bag] = await db
      .select()
      .from(bloodBagsTable)
      .where(eq(bloodBagsTable.barcode, req.params.barcode))
      .limit(1);
    if (!bag) {
      res.status(404).json({ error: "Blood bag not found" });
      return;
    }
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

    // Auto-filter by center for transfusion centers and blood banks
    if (
      req.user!.role === "transfusion_center" ||
      req.user!.role === "blood_bank"
    ) {
      conditions.push(eq(bloodBagsTable.centerId, req.user!.id));
      conditions.push(eq(bloodBagsTable.centerType, req.user!.role));
    } else {
      // Other roles respect query params
      if (centerId)
        conditions.push(
          eq(bloodBagsTable.centerId, parseInt(centerId as string)),
        );
    }

    if (bloodType)
      conditions.push(eq(bloodBagsTable.bloodType, bloodType as string));
    if (status) conditions.push(eq(bloodBagsTable.status, status as string));
    if (expiringBefore)
      conditions.push(
        lte(bloodBagsTable.expirationDate, expiringBefore as string),
      );

    const bags =
      conditions.length > 0
        ? await db
            .select()
            .from(bloodBagsTable)
            .where(and(...conditions))
        : await db.select().from(bloodBagsTable);

    res.json({ bloodBags: bags, total: bags.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blood-bags/:id", authMiddleware, async (req, res) => {
  try {
    const [bag] = await db
      .select()
      .from(bloodBagsTable)
      .where(eq(bloodBagsTable.id, parseInt(req.params.id)))
      .limit(1);
    if (!bag) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(bag);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/blood-bags/scan", authMiddleware, async (req, res) => {
  try {
    const { barcode } = req.body;
    const user = req.user!;

    if (!barcode) {
      return res.status(400).json({ error: "Le code-barres est requis." });
    }

    // Only hospitals and clinics can scan
    if (user.role !== "hospital" && user.role !== "clinic") {
      return res.status(403).json({ error: "Accès non autorisé." });
    }

    // Find the blood bag
    const [bloodBag] = await db
      .select()
      .from(bloodBagsTable)
      .where(eq(bloodBagsTable.barcode, barcode))
      .limit(1);

    if (!bloodBag) {
      return res.status(404).json({
        error: "Aucune poche de sang trouvée avec ce code-barres.",
      });
    }

    // Check if already delivered or transfused
    if (bloodBag.status === "transfused") {
      return res.status(409).json({
        error: "Cette poche a déjà été transfusée.",
        bloodBag,
      });
    }

    if (bloodBag.status === "expired") {
      return res.status(409).json({
        error: "Cette poche est périmée et ne peut pas être utilisée.",
        bloodBag,
      });
    }

    if (bloodBag.status === "rejected") {
      return res.status(409).json({
        error: "Cette poche a été rejetée et ne peut pas être utilisée.",
        bloodBag,
      });
    }

    // Update status to transfused
    const [updatedBag] = await db
      .update(bloodBagsTable)
      .set({ status: "transfused" })
      .where(eq(bloodBagsTable.barcode, barcode))
      .returning();

    res.json({
      message: "Poche de sang trouvée et marquée comme transfusée.",
      bloodBag: updatedBag,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/blood-bags/:id/receive", authMiddleware, async (req, res) => {
  try {
    const { temperatureOk, integrityOk, accepted, rejectionReason } = req.body;
    const status =
      accepted && temperatureOk && integrityOk ? "available" : "rejected";
    const [bag] = await db
      .update(bloodBagsTable)
      .set({
        status,
        rejectionReason:
          status === "rejected"
            ? rejectionReason || "Inspection échouée"
            : null,
        receivedAt: new Date().toISOString().split("T")[0],
      })
      .where(eq(bloodBagsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(bag);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
