import {
  pgTable,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const transfusionCentersTable = pgTable("transfusion_centers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  motDePasse: varchar("mot_de_passe", { length: 255 }).notNull(),
  adresse: text("adresse").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  numTel: varchar("num_tel", { length: 20 }).notNull(),
  capaciteStockage: integer("capacite_stockage").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transfusionCenterSlotsTable = pgTable("transfusion_center_slots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  centerId: integer("center_id")
    .notNull()
    .references(() => transfusionCentersTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  time: varchar("time", { length: 5 }).notNull(), // HH:MM
  isAvailable: integer("is_available").notNull().default(1), // 1 = available, 0 = booked
  createdAt: timestamp("created_at").defaultNow(),
});
