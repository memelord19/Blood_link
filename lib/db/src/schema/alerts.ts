import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  centerName: text("center_name").notNull(),
  bloodType: text("blood_type").notNull(),
  region: text("region").notNull(),
  urgency: text("urgency").notNull().default("normal"), // normal, urgent, critical
  message: text("message").notNull(),
  status: text("status").notNull().default("active"), // active, resolved
  resolvedAt: text("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
