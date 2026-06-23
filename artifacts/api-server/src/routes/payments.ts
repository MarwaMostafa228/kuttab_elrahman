import { Router, type IRouter } from "express";
import { db, payments, students } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
  const month = req.query.month as string | undefined;

  const conditions = [];
  if (studentId) conditions.push(eq(payments.studentId, studentId));
  if (month) conditions.push(eq(payments.month, month));

  const rows = await db
    .select({
      id: payments.id,
      studentId: payments.studentId,
      studentName: students.name,
      amount: payments.amount,
      month: payments.month,
      notes: payments.notes,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(students, eq(payments.studentId, students.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(payments.paidAt);

  res.json(rows.map(r => ({
    ...r,
    amount: parseFloat(r.amount as string),
    studentName: r.studentName ?? "",
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/payments", async (req, res): Promise<void> => {
  const { studentId, amount, month, notes, paidAt } = req.body;
  if (!studentId || !amount || !month) {
    res.status(400).json({ error: "الطالب والمبلغ والشهر مطلوبة" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [payment] = await db
    .insert(payments)
    .values({ studentId, amount: String(amount), month, notes, paidAt: paidAt ?? today })
    .returning();

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));
  res.status(201).json({
    ...payment,
    amount: parseFloat(payment.amount as string),
    studentName: student?.name ?? "",
    createdAt: payment.createdAt.toISOString(),
  });
});

router.delete("/payments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(payments).where(eq(payments.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الدفعة غير موجودة" });
    return;
  }
  res.sendStatus(204);
});

export default router;
