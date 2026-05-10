import { Router } from "express";
import { db, establishmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, hashPassword } from "../lib/auth.js";

const router = Router();

// ─── ESTABLISHMENTS (HOSPITALS & CLINICS) ─────────────────────────────────────

router.post("/establishments", async (req, res) => {
  try {
    const {
      nom,
      email,
      motDePasse,
      adresse,
      region,
      numTel,
      type,
      numFiscal,
      bloodBankId,
    } = req.body;

    if (
      !nom ||
      !email ||
      !motDePasse ||
      !adresse ||
      !region ||
      !numTel ||
      !type
    ) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    if (type !== "hospital" && type !== "clinic") {
      return res
        .status(400)
        .json({ error: "Type invalide. Utilisez 'hospital' ou 'clinic'." });
    }

    if (type === "clinic" && !numFiscal) {
      return res
        .status(400)
        .json({
          error: "Le numéro fiscal est obligatoire pour les cliniques.",
        });
    }

    if (type === "clinic" && bloodBankId) {
      return res
        .status(400)
        .json({ error: "Une clinique ne peut pas avoir une banque de sang." });
    }

    const [existing] = await db
      .select()
      .from(establishmentsTable)
      .where(eq(establishmentsTable.email, email))
      .limit(1);

    if (existing) {
      return res
        .status(409)
        .json({ error: "Un établissement avec cet email existe déjà." });
    }

    const hashedPassword = hashPassword(motDePasse);

    const [establishment] = await db
      .insert(establishmentsTable)
      .values({
        nom,
        email,
        motDePasse: hashedPassword,
        adresse,
        region,
        numTel,
        type,
        ...(numFiscal ? { numFiscal } : {}),
        ...(bloodBankId ? { bloodBankId: parseInt(bloodBankId) } : {}),
      })
      .returning();

    const { motDePasse: _, ...establishmentWithoutPassword } = establishment;
    res.status(201).json(establishmentWithoutPassword);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/establishments", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;

    const establishments = await db
      .select({
        id: establishmentsTable.id,
        nom: establishmentsTable.nom,
        email: establishmentsTable.email,
        adresse: establishmentsTable.adresse,
        region: establishmentsTable.region,
        numTel: establishmentsTable.numTel,
        type: establishmentsTable.type,
        bloodBankId: establishmentsTable.bloodBankId,
        createdAt: establishmentsTable.createdAt,
      })
      .from(establishmentsTable)
      .where(type ? eq(establishmentsTable.type, type as string) : undefined);

    res.json({ establishments, total: establishments.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
