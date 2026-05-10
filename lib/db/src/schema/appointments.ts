import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull(),
  centerId: integer("center_id").notNull(),
  centerName: text("center_name").notNull(),
  region: text("region").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  centerType: text("center_type").notNull().default("transfusion_center"), // "transfusion_center" or "blood_bank"
  status: text("status").notNull().default("pending"), // pending, confirmed, rejected, cancelled, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(
  appointmentsTable,
).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
