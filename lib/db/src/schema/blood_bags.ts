import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bloodBagsTable = pgTable("blood_bags", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull().unique(),
  bloodType: text("blood_type").notNull(),
  donorId: integer("donor_id"),
  centerId: integer("center_id").notNull(),
  centerName: text("center_name").notNull(),
  collectionDate: text("collection_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  status: text("status").notNull().default("available"), // available, reserved, transfused, expired, rejected
  rejectionReason: text("rejection_reason"),
  receivedAt: text("received_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBloodBagSchema = createInsertSchema(bloodBagsTable).omit({ id: true, createdAt: true });
export type InsertBloodBag = z.infer<typeof insertBloodBagSchema>;
export type BloodBag = typeof bloodBagsTable.$inferSelect;
