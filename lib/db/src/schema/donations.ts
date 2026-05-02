import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull(),
  donorName: text("donor_name").notNull(),
  centerId: integer("center_id").notNull(),
  centerName: text("center_name").notNull(),
  bloodBagId: integer("blood_bag_id"),
  bloodBagBarcode: text("blood_bag_barcode"),
  bloodType: text("blood_type").notNull(),
  donationDate: text("donation_date").notNull(),
  status: text("status").notNull().default("collected"), // collected, qualified, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonationSchema = createInsertSchema(donationsTable).omit({ id: true, createdAt: true });
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;
