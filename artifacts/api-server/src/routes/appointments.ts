import { Router } from "express";
import { db, appointmentsTable, donorsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

const CENTERS = [
  { id: 1, name: "Centre National de Transfusion Sanguine", region: "Tunis" },
  { id: 2, name: "Centre Régional de Transfusion - Sfax", region: "Sfax" },
  { id: 3, name: "Banque de Sang - Sousse", region: "Sousse" },
  { id: 4, name: "Centre de Transfusion - Nabeul", region: "Nabeul" },
];

router.get("/appointments/available-slots", authMiddleware, async (req, res) => {
  const { region, centerId } = req.query;
  const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];
  const slots = [];
  const today = new Date();
  for (let d = 1; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split("T")[0];
    const centers = centerId ? CENTERS.filter(c => c.id === parseInt(centerId as string)) : (region ? CENTERS.filter(c => c.region === region) : CENTERS);
    for (const center of centers.slice(0, 2)) {
      for (const time of times.slice(0, 5)) {
        slots.push({ date: dateStr, time, centerId: center.id, centerName: center.name, available: true });
      }
    }
  }
  res.json({ slots });
});

router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    const { donorId, centerId, status } = req.query;
    const conditions: SQL[] = [];
    if (donorId) conditions.push(eq(appointmentsTable.donorId, parseInt(donorId as string)));
    if (centerId) conditions.push(eq(appointmentsTable.centerId, parseInt(centerId as string)));
    if (status) conditions.push(eq(appointmentsTable.status, status as string));
    const appointments = conditions.length > 0
      ? await db.select().from(appointmentsTable).where(and(...conditions))
      : await db.select().from(appointmentsTable);
    // Enrich with donor names
    const result = await Promise.all(appointments.map(async (a) => {
      const [donor] = await db.select({ firstName: donorsTable.firstName, lastName: donorsTable.lastName }).from(donorsTable).where(eq(donorsTable.id, a.donorId)).limit(1);
      const center = CENTERS.find(c => c.id === a.centerId);
      return { ...a, donorName: donor ? `${donor.firstName} ${donor.lastName}` : "Inconnu", centerName: a.centerName || center?.name || "Centre inconnu" };
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
    // Find donor linked to user
    const [donor] = await db.select().from(donorsTable).where(eq(donorsTable.userId as any, req.user!.id)).limit(1);
    const center = CENTERS.find(c => c.id === parseInt(centerId));
    const donorId = donor?.id || 1;
    const [appt] = await db.insert(appointmentsTable).values({
      donorId,
      centerId: parseInt(centerId),
      centerName: center?.name || "Centre",
      region: center?.region || "Tunis",
      date,
      time,
      status: "pending",
      notes,
    }).returning();
    res.status(201).json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/appointments/:id", authMiddleware, async (req, res) => {
  try {
    const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, parseInt(req.params.id))).limit(1);
    if (!appt) { res.status(404).json({ error: "Not found" }); return; }
    res.json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/appointments/:id", authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [appt] = await db.update(appointmentsTable).set({ status, notes }).where(eq(appointmentsTable.id, parseInt(req.params.id))).returning();
    res.json(appt);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
