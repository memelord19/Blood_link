import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const { type, read } = req.query;
    const conditions: SQL[] = [eq(notificationsTable.userId, req.user!.id)];
    if (type) conditions.push(eq(notificationsTable.type, type as string));
    if (read !== undefined) conditions.push(eq(notificationsTable.read, read === "true"));
    const notifications = await db.select().from(notificationsTable).where(and(...conditions));
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount, total: notifications.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const [notif] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, parseInt(req.params.id))).returning();
    res.json(notif);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
