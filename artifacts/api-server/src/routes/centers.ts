import { Router } from "express";
import {
  db,
  usersTable,
  donorsTable,
  transfusionCentersTable,
  bloodBanksTable,
  establishmentsTable,
} from "@workspace/db";
import { eq, and, SQL, ne, sql } from "drizzle-orm";
import {
  generateToken,
  hashPassword,
  verifyPassword,
  authMiddleware,
} from "../lib/auth.js";

const router = Router();

router.get("/centers", authMiddleware, async (req, res) => {
  try {
    const transfusionCenters = await db
      .select({
        id: sql<string>`'tc_' || ${transfusionCentersTable.id}`,
        nom: transfusionCentersTable.nom,
        email: transfusionCentersTable.email,
        adresse: transfusionCentersTable.adresse,
        region: transfusionCentersTable.region,
        numTel: transfusionCentersTable.numTel,
        type: sql<string>`'transfusion_center'`,
      })
      .from(transfusionCentersTable);

    const bloodBanks = await db
      .select({
        id: sql<string>`'bb_' || ${bloodBanksTable.id}`,
        nom: bloodBanksTable.nom,
        email: bloodBanksTable.email,
        adresse: bloodBanksTable.adresse,
        region: bloodBanksTable.region,
        numTel: bloodBanksTable.numTel,
        type: sql<string>`'blood_bank'`,
      })
      .from(bloodBanksTable);

    const centers = [...transfusionCenters, ...bloodBanks];

    res.json({ centers, total: centers.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
