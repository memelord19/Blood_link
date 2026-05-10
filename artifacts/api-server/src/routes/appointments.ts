import { Router } from "express";
import {
  db,
  appointmentsTable,
  donorsTable,
  transfusionCentersTable,
  transfusionCenterSlotsTable,
  bloodBanksTable,
  bloodBankSlotsTable,
} from "@workspace/db";
import { eq, and, SQL, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get(
  "/appointments/available-slots",
  authMiddleware,
  async (req, res) => {
    try {
      const { region, centerId } = req.query;

      const slots = [];

      // Handle specific centerId with prefix (tc_ or bb_)
      if (centerId) {
        const isBloodBank = String(centerId).startsWith("bb_");
        const rawId = parseInt(String(centerId).replace(/^(tc_|bb_)/, ""));

        if (isNaN(rawId)) {
          return res
            .status(400)
            .json({ error: "Identifiant du centre invalide." });
        }

        if (isBloodBank) {
          const [bank] = await db
            .select()
            .from(bloodBanksTable)
            .where(eq(bloodBanksTable.id, rawId))
            .limit(1);

          if (bank) {
            const bankSlots = await db
              .select()
              .from(bloodBankSlotsTable)
              .where(
                and(
                  eq(bloodBankSlotsTable.bankId, bank.id),
                  eq(bloodBankSlotsTable.isAvailable, 1),
                ),
              );

            for (const slot of bankSlots) {
              slots.push({
                date: slot.date,
                time: slot.time,
                centerId: `bb_${bank.id}`,
                centerName: bank.nom,
                centerType: "blood_bank",
                available: true,
              });
            }
          }
        } else {
          const [center] = await db
            .select()
            .from(transfusionCentersTable)
            .where(eq(transfusionCentersTable.id, rawId))
            .limit(1);

          if (center) {
            const centerSlots = await db
              .select()
              .from(transfusionCenterSlotsTable)
              .where(
                and(
                  eq(transfusionCenterSlotsTable.centerId, center.id),
                  eq(transfusionCenterSlotsTable.isAvailable, 1),
                ),
              );

            for (const slot of centerSlots) {
              slots.push({
                date: slot.date,
                time: slot.time,
                centerId: `tc_${center.id}`,
                centerName: center.nom,
                centerType: "transfusion_center",
                available: true,
              });
            }
          }
        }
      } else {
        // No centerId — fetch from both tables, optionally filtered by region
        const transfusionCenters = await db
          .select()
          .from(transfusionCentersTable)
          .where(
            region
              ? eq(transfusionCentersTable.region, region as string)
              : undefined,
          );

        for (const center of transfusionCenters) {
          const centerSlots = await db
            .select()
            .from(transfusionCenterSlotsTable)
            .where(
              and(
                eq(transfusionCenterSlotsTable.centerId, center.id),
                eq(transfusionCenterSlotsTable.isAvailable, 1),
              ),
            );

          for (const slot of centerSlots) {
            slots.push({
              date: slot.date,
              time: slot.time,
              centerId: `tc_${center.id}`,
              centerName: center.nom,
              centerType: "transfusion_center",
              available: true,
            });
          }
        }

        const bloodBanks = await db
          .select()
          .from(bloodBanksTable)
          .where(
            region ? eq(bloodBanksTable.region, region as string) : undefined,
          );

        for (const bank of bloodBanks) {
          const bankSlots = await db
            .select()
            .from(bloodBankSlotsTable)
            .where(
              and(
                eq(bloodBankSlotsTable.bankId, bank.id),
                eq(bloodBankSlotsTable.isAvailable, 1),
              ),
            );

          for (const slot of bankSlots) {
            slots.push({
              date: slot.date,
              time: slot.time,
              centerId: `bb_${bank.id}`,
              centerName: bank.nom,
              centerType: "blood_bank",
              available: true,
            });
          }
        }
      }

      res.json({ slots });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    const { centerId, status } = req.query;
    const user = req.user!;

    // Center or blood bank — return appointments sent to them
    if (user.role === "transfusion_center" || user.role === "blood_bank") {
      const conditions: SQL[] = [
        eq(appointmentsTable.centerId, user.id),
        eq(appointmentsTable.centerType, user.role),
      ];

      if (status)
        conditions.push(eq(appointmentsTable.status, status as string));

      const appointments = await db
        .select()
        .from(appointmentsTable)
        .where(and(...conditions));

      const result = await Promise.all(
        appointments.map(async (a) => {
          const [donor] = await db
            .select({
              firstName: donorsTable.firstName,
              lastName: donorsTable.lastName,
            })
            .from(donorsTable)
            .where(eq(donorsTable.id, a.donorId))
            .limit(1);
          return {
            ...a,
            donorName: donor
              ? `${donor.firstName} ${donor.lastName}`
              : "Inconnu",
          };
        }),
      );

      return res.json({ appointments: result, total: result.length });
    }

    // Donor — return only their own appointments
    const [donor] = await db
      .select()
      .from(donorsTable)
      .where(eq(donorsTable.userId as any, user.id))
      .limit(1);

    if (!donor) {
      return res.json({ appointments: [], total: 0 });
    }

    const conditions: SQL[] = [
      eq(appointmentsTable.donorId, donor.id),
      sql`${appointmentsTable.status} != 'cancelled'`,
    ];

    if (centerId)
      conditions.push(
        eq(appointmentsTable.centerId, parseInt(centerId as string)),
      );
    if (status) conditions.push(eq(appointmentsTable.status, status as string));

    const appointments = await db
      .select()
      .from(appointmentsTable)
      .where(and(...conditions));

    const result = appointments.map((a) => ({
      ...a,
      donorName: `${donor.firstName} ${donor.lastName}`,
    }));

    res.json({ appointments: result, total: result.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/appointments", authMiddleware, async (req, res) => {
  try {
    const { centerId, date, time, notes } = req.body;

    const [donor] = await db
      .select()
      .from(donorsTable)
      .where(eq(donorsTable.userId as any, req.user!.id))
      .limit(1);

    const isBloodBank = String(centerId).startsWith("bb_");
    const rawId = parseInt(String(centerId).replace(/^(tc_|bb_)/, ""));

    if (isNaN(rawId)) {
      return res.status(400).json({ error: "Identifiant du centre invalide." });
    }

    let centerName: string;
    let centerRegion: string;
    let resolvedCenterId: number;
    let slotId: number;

    if (isBloodBank) {
      const [bank] = await db
        .select()
        .from(bloodBanksTable)
        .where(eq(bloodBanksTable.id, rawId))
        .limit(1);

      if (!bank) {
        return res.status(400).json({ error: "Banque de sang introuvable." });
      }

      const [slot] = await db
        .select()
        .from(bloodBankSlotsTable)
        .where(
          and(
            eq(bloodBankSlotsTable.bankId, bank.id),
            eq(bloodBankSlotsTable.date, date),
            eq(bloodBankSlotsTable.time, time),
            eq(bloodBankSlotsTable.isAvailable, 1),
          ),
        )
        .limit(1);

      if (!slot) {
        return res
          .status(409)
          .json({ error: "Ce créneau n'est plus disponible." });
      }

      await db
        .update(bloodBankSlotsTable)
        .set({ isAvailable: 0 })
        .where(eq(bloodBankSlotsTable.id, slot.id));

      centerName = bank.nom;
      centerRegion = bank.region;
      resolvedCenterId = bank.id;
      slotId = slot.id;
    } else {
      const [center] = await db
        .select()
        .from(transfusionCentersTable)
        .where(eq(transfusionCentersTable.id, rawId))
        .limit(1);

      if (!center) {
        return res.status(400).json({ error: "Centre introuvable." });
      }

      const [slot] = await db
        .select()
        .from(transfusionCenterSlotsTable)
        .where(
          and(
            eq(transfusionCenterSlotsTable.centerId, center.id),
            eq(transfusionCenterSlotsTable.date, date),
            eq(transfusionCenterSlotsTable.time, time),
            eq(transfusionCenterSlotsTable.isAvailable, 1),
          ),
        )
        .limit(1);

      if (!slot) {
        return res
          .status(409)
          .json({ error: "Ce créneau n'est plus disponible." });
      }

      await db
        .update(transfusionCenterSlotsTable)
        .set({ isAvailable: 0 })
        .where(eq(transfusionCenterSlotsTable.id, slot.id));

      centerName = center.nom;
      centerRegion = center.region;
      resolvedCenterId = center.id;
      slotId = slot.id;
    }

    const [appt] = await db
      .insert(appointmentsTable)
      .values({
        donorId: donor?.id || 1,
        centerId: resolvedCenterId,
        centerName,
        centerType: isBloodBank ? "blood_bank" : "transfusion_center",
        region: centerRegion,
        date,
        time,
        status: "pending",
        notes,
      })
      .returning();

    res.status(201).json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/appointments/:id", authMiddleware, async (req, res) => {
  try {
    const [appt] = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, parseInt(req.params.id)))
      .limit(1);

    if (!appt) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/appointments/:id", authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (status === "cancelled") {
      const [appt] = await db
        .select()
        .from(appointmentsTable)
        .where(eq(appointmentsTable.id, parseInt(req.params.id)))
        .limit(1);

      if (appt) {
        if (appt.centerType === "blood_bank") {
          await db
            .update(bloodBankSlotsTable)
            .set({ isAvailable: 1 })
            .where(
              and(
                eq(bloodBankSlotsTable.bankId, appt.centerId),
                eq(bloodBankSlotsTable.date, appt.date),
                eq(bloodBankSlotsTable.time, appt.time),
              ),
            );
        } else {
          await db
            .update(transfusionCenterSlotsTable)
            .set({ isAvailable: 1 })
            .where(
              and(
                eq(transfusionCenterSlotsTable.centerId, appt.centerId),
                eq(transfusionCenterSlotsTable.date, appt.date),
                eq(transfusionCenterSlotsTable.time, appt.time),
              ),
            );
        }
      }
    }

    const [appt] = await db
      .update(appointmentsTable)
      .set({ status, notes })
      .where(eq(appointmentsTable.id, parseInt(req.params.id)))
      .returning();

    res.json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
