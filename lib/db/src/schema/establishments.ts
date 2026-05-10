import {
  pgTable,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { bloodBanksTable } from "./blood_banks";

export const establishmentsTable = pgTable("establishments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  motDePasse: varchar("mot_de_passe", { length: 255 }).notNull(),
  adresse: text("adresse").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  numTel: varchar("num_tel", { length: 20 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "hospital" or "clinic"
  numFiscal: varchar("num_fiscal", { length: 50 }), // only for clinics, null for hospitals
  bloodBankId: integer("blood_bank_id").references(() => bloodBanksTable.id, {
    onDelete: "set null",
  }), // only for hospitals, null for clinics
  createdAt: timestamp("created_at").defaultNow(),
});
