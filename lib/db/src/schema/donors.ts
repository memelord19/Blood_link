import { pgTable, serial, text, integer, boolean, timestamp, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donorsTable = pgTable("donors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  cin: text("cin").notNull().unique(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(), // male, female
  weight: real("weight").notNull(),
  phone: text("phone"),
  email: text("email"),
  region: text("region").notNull(),
  bloodType: text("blood_type").notNull(), // A+, A-, B+, B-, AB+, AB-, O+, O-
  eligibilityStatus: text("eligibility_status").notNull().default("eligible"), // eligible, temporarily_excluded, permanently_ineligible
  totalDonations: integer("total_donations").notNull().default(0),
  lastDonationDate: text("last_donation_date"),
  nextEligibleDate: text("next_eligible_date"),
  annualQuota: integer("annual_quota").notNull().default(5),
  annualDonationsCount: integer("annual_donations_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDonorSchema = createInsertSchema(donorsTable).omit({ id: true, createdAt: true });
export type InsertDonor = z.infer<typeof insertDonorSchema>;
export type Donor = typeof donorsTable.$inferSelect;
