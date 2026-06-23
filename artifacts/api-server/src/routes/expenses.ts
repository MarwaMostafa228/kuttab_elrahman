import { Router, type IRouter } from "express";
import { db, expenses } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/expenses", async (_req, res): Promise<void> => {
  const rows = await db.select().from(expenses).orderBy(expenses.date);
  res.json(rows.map(r => ({
    ...r,
    amount: parseFloat(r.amount as string),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const { title, amount, category, date, notes } = req.body;
  if (!title || !amount || !category || !date) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  const [expense] = await db.insert(expenses).values({ title, amount: String(amount), category, date, notes }).returning();
  res.status(201).json({ ...expense, amount: parseFloat(expense.amount as string), createdAt: expense.createdAt.toISOString() });
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "المصروف غير موجود" });
    return;
  }
  res.sendStatus(204);
});

export default router;
