import { pgTable, serial, text, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bloodRequestsTable = pgTable("blood_requests", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  establishmentName: text("establishment_name").notNull(),
  centerId: integer("center_id"),
  centerName: text("center_name"),
  bloodType: text("blood_type").notNull(),
  volume: real("volume").notNull(), // mL
  urgency: text("urgency").notNull().default("normal"), // normal, urgent, critical
  status: text("status").notNull().default("submitted"), // submitted, processing, accepted, shipped, delivered, rejected
  rejectionReason: text("rejection_reason"),
  estimatedDelivery: text("estimated_delivery"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBloodRequestSchema = createInsertSchema(bloodRequestsTable).omit({ id: true, submittedAt: true, updatedAt: true });
export type InsertBloodRequest = z.infer<typeof insertBloodRequestSchema>;
export type BloodRequest = typeof bloodRequestsTable.$inferSelect;
