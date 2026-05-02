import { pgTable, serial, text, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  establishmentName: text("establishment_name").notNull(),
  requestId: integer("request_id"),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, rejected
  isEmergency: boolean("is_emergency").notNull().default(false),
  dueDate: text("due_date"),
  paidAt: text("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
