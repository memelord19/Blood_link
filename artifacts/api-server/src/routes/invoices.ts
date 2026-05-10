import { Router } from "express";
import { db, invoicesTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/invoices", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const conditions: SQL[] = [];

    // Always filter by the logged-in clinic
    if (req.user!.role === "clinic") {
      conditions.push(eq(invoicesTable.establishmentId, req.user!.id));
    }

    if (status) conditions.push(eq(invoicesTable.status, status as string));

    const invoices =
      conditions.length > 0
        ? await db
            .select()
            .from(invoicesTable)
            .where(and(...conditions))
        : await db.select().from(invoicesTable);

    res.json({ invoices, total: invoices.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/invoices/:id/pay", authMiddleware, async (req, res) => {
  try {
    const { cardNumber } = req.body;
    if (!cardNumber || cardNumber.length < 16) {
      res.status(400).json({ error: "Invalid card details" });
      return;
    }
    const [invoice] = await db
      .update(invoicesTable)
      .set({ status: "paid", paidAt: new Date().toISOString().split("T")[0] })
      .where(eq(invoicesTable.id, parseInt(req.params.id)))
      .returning();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(invoice);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
