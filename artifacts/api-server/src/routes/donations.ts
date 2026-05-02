import { Router } from "express";
import { db, donationsTable, bloodBagsTable, donorsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/donations", authMiddleware, async (req, res) => {
  try {
    const { donorId, centerId } = req.query;
    const conditions: SQL[] = [];
    if (donorId) conditions.push(eq(donationsTable.donorId, parseInt(donorId as string)));
    if (centerId) conditions.push(eq(donationsTable.centerId, parseInt(centerId as string)));
    const donations = conditions.length > 0
      ? await db.select().from(donationsTable).where(and(...conditions))
      : await db.select().from(donationsTable);
    res.json({ donations, total: donations.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/donations", authMiddleware, async (req, res) => {
  try {
    const { donorId, barcode, bloodType, collectionDate, expirationDate } = req.body;
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.id, parseInt(donorId))).limit(1);
    if (!donor) { res.status(404).json({ error: "Donor not found" }); return; }
    
    // Create blood bag
    const [bag] = await db.insert(bloodBagsTable).values({
      barcode,
      bloodType,
      donorId: parseInt(donorId),
      centerId: 1,
      centerName: "Centre National de Transfusion Sanguine",
      collectionDate,
      expirationDate,
      status: "available",
    }).returning();
    
    // Create donation record
    const [donation] = await db.insert(donationsTable).values({
      donorId: parseInt(donorId),
      donorName: `${donor.firstName} ${donor.lastName}`,
      centerId: 1,
      centerName: "Centre National de Transfusion Sanguine",
      bloodBagId: bag.id,
      bloodBagBarcode: barcode,
      bloodType,
      donationDate: collectionDate,
      status: "collected",
    }).returning();
    
    // Update donor stats
    await db.update(donorsTable).set({
      totalDonations: donor.totalDonations + 1,
      annualDonationsCount: donor.annualDonationsCount + 1,
      lastDonationDate: collectionDate,
      nextEligibleDate: new Date(new Date(collectionDate).getTime() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }).where(eq(donorsTable.id, parseInt(donorId)));
    
    res.status(201).json(donation);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
