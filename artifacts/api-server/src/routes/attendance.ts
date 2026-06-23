import { Router, type IRouter } from "express";
import { db, attendanceRecords, students, circles } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
  const date = req.query.date as string | undefined;
  const circleId = req.query.circleId ? parseInt(req.query.circleId as string, 10) : undefined;

  const conditions = [];
  if (studentId) conditions.push(eq(attendanceRecords.studentId, studentId));
  if (date) conditions.push(eq(attendanceRecords.date, date));
  if (circleId) conditions.push(eq(attendanceRecords.circleId, circleId));

  const rows = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      studentName: students.name,
      circleId: attendanceRecords.circleId,
      circleName: circles.name,
      date: attendanceRecords.date,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      createdAt: attendanceRecords.createdAt,
    })
    .from(attendanceRecords)
    .leftJoin(students, eq(attendanceRecords.studentId, students.id))
    .leftJoin(circles, eq(attendanceRecords.circleId, circles.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(attendanceRecords.date);

  res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const { studentId, circleId, date, status, notes } = req.body;
  if (!studentId || !date || !status) {
    res.status(400).json({ error: "الطالب والتاريخ والحالة مطلوبة" });
    return;
  }

  const [record] = await db
    .insert(attendanceRecords)
    .values({ studentId, circleId: circleId ?? null, date, status, notes })
    .returning();

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({ ...record, studentName: student?.name ?? "", circleName: null, createdAt: record.createdAt.toISOString() });
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, notes } = req.body;

  const [record] = await db
    .update(attendanceRecords)
    .set({ status, notes })
    .where(eq(attendanceRecords.id, id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "السجل غير موجود" });
    return;
  }

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, record.studentId));
  res.json({ ...record, studentName: student?.name ?? "", circleName: null, createdAt: record.createdAt.toISOString() });
});

export default router;
