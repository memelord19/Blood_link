import { Router } from "express";
import { db, donationsTable, bloodBagsTable, donorsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/donations", authMiddleware, async (req, res) => {
  try {
    const { centerId } = req.query;
    const conditions: SQL[] = [];

    if (
      req.user!.role === "transfusion_center" ||
      req.user!.role === "blood_bank"
    ) {
      conditions.push(eq(donationsTable.centerId, req.user!.id));
      conditions.push(eq(donationsTable.centerType, req.user!.role));
    } else if (req.user!.role === "donor") {
      const [donor] = await db
        .select()
        .from(donorsTable)
        .where(eq(donorsTable.userId as any, req.user!.id))
        .limit(1);

      if (!donor) {
        return res.json({ donations: [], total: 0 });
      }

      conditions.push(eq(donationsTable.donorId, donor.id));
    } else {
      if (centerId)
        conditions.push(
          eq(donationsTable.centerId, parseInt(centerId as string)),
        );
    }

    const donations =
      conditions.length > 0
        ? await db
            .select()
            .from(donationsTable)
            .where(and(...conditions))
        : await db.select().from(donationsTable);

    res.json({ donations, total: donations.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/donations", authMiddleware, async (req, res) => {
  try {
    const { donorCin, barcode, bloodType, collectionDate, expirationDate } =
      req.body;

    // Look up donor by CIN instead of ID
    const [donor] = await db
      .select()
      .from(donorsTable)
      .where(eq(donorsTable.cin, donorCin))
      .limit(1);

    if (!donor) {
      res.status(404).json({ error: "Donneur introuvable avec ce CIN." });
      return;
    }

    // Use the logged-in center's info instead of hardcoded values
    const centerId = req.user!.id;
    const centerName = req.user!.organizationName ?? req.user!.firstName;
    const centerType = req.user!.role; // "transfusion_center" or "blood_bank"

    // Create blood bag
    const [bag] = await db
      .insert(bloodBagsTable)
      .values({
        barcode,
        bloodType,
        donorId: donor.id,
        centerId,
        centerName,
        centerType,
        collectionDate,
        expirationDate,
        status: "available",
      })
      .returning();

    // Create donation record
    const [donation] = await db
      .insert(donationsTable)
      .values({
        donorId: donor.id,
        donorName: `${donor.firstName} ${donor.lastName}`,
        centerId,
        centerName,
        centerType,
        bloodBagId: bag.id,
        bloodBagBarcode: barcode,
        bloodType,
        donationDate: collectionDate,
        status: "collected",
      })
      .returning();

    // Update donor stats
    const nextEligibleDate = new Date(
      new Date(collectionDate).getTime() +
        (donor.gender === "female" ? 84 : 56) * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];

    await db
      .update(donorsTable)
      .set({
        totalDonations: donor.totalDonations + 1,
        annualDonationsCount: donor.annualDonationsCount + 1,
        lastDonationDate: collectionDate,
        nextEligibleDate,
        eligibilityStatus: "temporarily_excluded",
      })
      .where(eq(donorsTable.id, donor.id));

    res
      .status(201)
      .json({ ...donation, donorName: `${donor.firstName} ${donor.lastName}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
