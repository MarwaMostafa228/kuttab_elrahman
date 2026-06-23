import { Router, type IRouter } from "express";
import { db, vacations, students } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/vacations", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;

  let query = db
    .select({
      id: vacations.id,
      studentId: vacations.studentId,
      studentName: students.name,
      startDate: vacations.startDate,
      endDate: vacations.endDate,
      reason: vacations.reason,
      notes: vacations.notes,
      createdAt: vacations.createdAt,
    })
    .from(vacations)
    .leftJoin(students, eq(vacations.studentId, students.id));

  if (studentId) {
    const rows = await query.where(eq(vacations.studentId, studentId)).orderBy(vacations.startDate);
    res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
    return;
  }

  const rows = await query.orderBy(vacations.startDate);
  res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
});

router.post("/vacations", async (req, res): Promise<void> => {
  const { studentId, startDate, endDate, reason, notes } = req.body;
  if (!studentId || !startDate || !endDate || !reason) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  const [vacation] = await db.insert(vacations).values({ studentId, startDate, endDate, reason, notes }).returning();
  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({ ...vacation, studentName: student?.name ?? "", createdAt: vacation.createdAt.toISOString() });
});

router.delete("/vacations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(vacations).where(eq(vacations.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الإجازة غير موجودة" });
    return;
  }
  res.sendStatus(204);
});

export default router;
