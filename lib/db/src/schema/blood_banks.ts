import {
  pgTable,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { transfusionCentersTable } from "./transfusion_centers";
import { z } from "zod/v4";

export const bloodBanksTable = pgTable("blood_banks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  motDePasse: varchar("mot_de_passe", { length: 255 }).notNull(),
  adresse: text("adresse").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  numTel: varchar("num_tel", { length: 20 }).notNull(),
  seuilCritique: integer("seuil_critique").notNull().default(10),
  // nullable — only hospitals can have an internal blood bank (0..1 relation from UML)
  hopitalId: integer("hopital_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const bloodBankSlotsTable = pgTable("blood_bank_slots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bankId: integer("bank_id")
    .notNull()
    .references(() => bloodBanksTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  isAvailable: integer("is_available").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});
