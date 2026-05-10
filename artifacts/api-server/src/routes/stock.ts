import { Router } from "express";
import { db, bloodBagsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
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

router.get("/stock", authMiddleware, async (req, res) => {
  try {
    const centerId = req.user!.id;
    const centerType = req.user!.role;

    const bags = await db
      .select()
      .from(bloodBagsTable)
      .where(
        and(
          eq(bloodBagsTable.status, "available"),
          eq(bloodBagsTable.centerId, centerId),
          eq(bloodBagsTable.centerType, centerType),
        ),
      );

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const levels = BLOOD_TYPES.map((bt) => {
      const available = bags.filter((b) => b.bloodType === bt).length;
      const expiringSoon = bags.filter(
        (b) => b.bloodType === bt && b.expirationDate <= sevenDaysFromNow,
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

    res.json({
      centerId,
      centerName: req.user!.organizationName ?? req.user!.firstName,
      centerType,
      levels,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
