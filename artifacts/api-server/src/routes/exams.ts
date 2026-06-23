import { Router, type IRouter } from "express";
import { db, exams, examResults, students } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/exams", async (_req, res): Promise<void> => {
  const rows = await db.select().from(exams).orderBy(exams.date);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/exams", async (req, res): Promise<void> => {
  const { title, type, date, description } = req.body;
  if (!title || !type || !date) {
    res.status(400).json({ error: "العنوان والنوع والتاريخ مطلوبة" });
    return;
  }

  const [exam] = await db.insert(exams).values({ title, type, date, description }).returning();
  res.status(201).json({ ...exam, createdAt: exam.createdAt.toISOString() });
});

router.delete("/exams/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(exams).where(eq(exams.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الاختبار غير موجود" });
    return;
  }
  res.sendStatus(204);
});

router.get("/exam-results", async (req, res): Promise<void> => {
  const examId = req.query.examId ? parseInt(req.query.examId as string, 10) : undefined;
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;

  const conditions = [];
  if (examId) conditions.push(eq(examResults.examId, examId));
  if (studentId) conditions.push(eq(examResults.studentId, studentId));

  const rows = await db
    .select({
      id: examResults.id,
      examId: examResults.examId,
      examTitle: exams.title,
      studentId: examResults.studentId,
      studentName: students.name,
      score: examResults.score,
      grade: examResults.grade,
      notes: examResults.notes,
      createdAt: examResults.createdAt,
    })
    .from(examResults)
    .leftJoin(exams, eq(examResults.examId, exams.id))
    .leftJoin(students, eq(examResults.studentId, students.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(examResults.createdAt);

  res.json(rows.map(r => ({
    ...r,
    score: parseFloat(r.score as string),
    examTitle: r.examTitle ?? "",
    studentName: r.studentName ?? "",
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/exam-results", async (req, res): Promise<void> => {
  const { examId, studentId, score, grade, notes } = req.body;
  if (!examId || !studentId || score == null) {
    res.status(400).json({ error: "الاختبار والطالب والدرجة مطلوبة" });
    return;
  }

  const [result] = await db.insert(examResults).values({ examId, studentId, score: String(score), grade, notes }).returning();
  const [exam] = await db.select({ title: exams.title }).from(exams).where(eq(exams.id, examId));
  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({
    ...result,
    score: parseFloat(result.score as string),
    examTitle: exam?.title ?? "",
    studentName: student?.name ?? "",
    createdAt: result.createdAt.toISOString(),
  });
});

export default router;
