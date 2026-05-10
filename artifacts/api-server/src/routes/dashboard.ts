import { Router } from "express";
import {
  db,
  donorsTable,
  appointmentsTable,
  bloodBagsTable,
  bloodRequestsTable,
  alertsTable,
  invoicesTable,
  donationsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const THRESHOLDS: Record<string, number> = {
  "O+": 20,
  "A+": 20,
  "B+": 10,
  "AB+": 5,
  "O-": 15,
  "A-": 10,
  "B-": 5,
  "AB-": 3,
};

router.get("/dashboard/donor", authMiddleware, async (req, res) => {
  try {
    const [donor] = await db
      .select()
      .from(donorsTable)
      .where(eq(donorsTable.userId as any, req.user!.id))
      .limit(1);
    if (!donor) {
      res.json({
        eligibilityStatus: "eligible",
        totalDonations: 0,
        annualDonations: 0,
        annualQuota: 5,
        unreadAlerts: 0,
      });
      return;
    }
    const alerts = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, req.user!.id),
          eq(notificationsTable.read, false),
        ),
      );
    res.json({
      eligibilityStatus: donor.eligibilityStatus,
      nextDonationDate: donor.nextEligibleDate,
      totalDonations: donor.totalDonations,
      annualDonations: donor.annualDonationsCount,
      annualQuota: donor.annualQuota,
      unreadAlerts: alerts.length,
      lastDonationDate: donor.lastDonationDate,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/center", authMiddleware, async (req, res) => {
  try {
    const centerId = req.user!.id;
    const centerRole = req.user!.role; // "transfusion_center" or "blood_bank"
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    // Only bags belonging to this center
    const bags = await db
      .select()
      .from(bloodBagsTable)
      .where(
        and(
          eq(bloodBagsTable.status, "available"),
          eq(bloodBagsTable.centerId, centerId),
        ),
      );

    const stockLevels = BLOOD_TYPES.map((bt) => {
      const available = bags.filter((b) => b.bloodType === bt).length;
      const expiringSoon = bags.filter(
        (b) => b.bloodType === bt && b.expirationDate <= sevenDays,
      ).length;
      const threshold = THRESHOLDS[bt] || 10;
      let status = "ok";
      if (available <= threshold * 0.5) status = "critical";
      else if (available <= threshold) status = "warning";
      return {
        bloodType: bt,
        available,
        reserved: 0,
        expiringSoon,
        threshold,
        status,
      };
    });

    const criticalTypes = stockLevels
      .filter((s) => s.status === "critical")
      .map((s) => s.bloodType);

    // Only appointments for this center
    const pendingAppts = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.status, "pending"),
          eq(appointmentsTable.centerId, centerId),
          eq(appointmentsTable.centerType, centerRole),
        ),
      );

    // Only requests sent to this center
    const pendingRequests = await db
      .select()
      .from(bloodRequestsTable)
      .where(
        and(
          eq(bloodRequestsTable.status, "submitted"),
          eq(bloodRequestsTable.centerId, centerId),
          eq(bloodRequestsTable.centerType, centerRole),
        ),
      );

    // Only alerts for this center
    const activeAlerts = await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.status, "active"),
          eq(alertsTable.centerId, centerId),
        ),
      );

    // Only donations recorded at this center today
    const todayDonations = await db
      .select()
      .from(donationsTable)
      .where(
        and(
          eq(donationsTable.donationDate, today),
          eq(donationsTable.centerId, centerId),
        ),
      );

    res.json({
      stockLevels,
      pendingAppointments: pendingAppts.length,
      pendingRequests: pendingRequests.length,
      totalDonationsToday: todayDonations.length,
      activeAlerts: activeAlerts.length,
      criticalStockTypes: criticalTypes,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/establishment", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const allRequests = await db
      .select()
      .from(bloodRequestsTable)
      .where(eq(bloodRequestsTable.establishmentId, userId));
    const pendingInvoices = await db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.establishmentId, userId),
          eq(invoicesTable.status, "pending"),
        ),
      );
    const totalInvoiceAmount = pendingInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    res.json({
      activeRequests: allRequests.filter((r) =>
        ["processing", "accepted", "shipped"].includes(r.status),
      ).length,
      pendingRequests: allRequests.filter((r) => r.status === "submitted")
        .length,
      deliveredRequests: allRequests.filter((r) => r.status === "delivered")
        .length,
      urgentRequests: allRequests.filter(
        (r) =>
          ["urgent", "critical"].includes(r.urgency) &&
          r.status !== "delivered",
      ).length,
      pendingInvoices: pendingInvoices.length,
      totalInvoiceAmount,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/blood-stats", async (req, res) => {
  try {
    const donors = await db
      .select({ bloodType: donorsTable.bloodType })
      .from(donorsTable);
    const totalDonors = donors.length || 1;
    const stats = BLOOD_TYPES.map((bt) => {
      const count = donors.filter((d) => d.bloodType === bt).length;
      return {
        bloodType: bt,
        donorCount: count,
        percentage: Math.round((count / totalDonors) * 100),
      };
    });
    const donations = await db.select().from(donationsTable);
    res.json({
      stats,
      totalDonors,
      totalDonations: donations.length,
      totalCenters: 4,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
