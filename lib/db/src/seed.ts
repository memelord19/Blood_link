import { db, pool } from "./index";
import { transfusionCentersTable, transfusionCenterSlotsTable } from "./schema";

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (const min of [0, 30]) {
      if (hour === 17 && min === 30) break;
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

function generateDates(days = 30): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function seed() {
  const centers = await db.select().from(transfusionCentersTable);

  const dates = generateDates(30);
  const times = generateTimeSlots();

  for (const center of centers) {
    const slotsToInsert = dates.flatMap((date) =>
      times.map((time) => ({
        centerId: center.id,
        date,
        time,
        isAvailable: 1 as const,
      })),
    );

    await db.insert(transfusionCenterSlotsTable).values(slotsToInsert);
    console.log(
      `✓ Seeded ${slotsToInsert.length} slots for center: ${center.nom}`,
    );
  }

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
