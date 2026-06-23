import { Router, type IRouter } from "express";
import { db, memorizationRecords, students } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/memorization", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
  const date = req.query.date as string | undefined;

  const conditions = [];
  if (studentId) conditions.push(eq(memorizationRecords.studentId, studentId));
  if (date) conditions.push(eq(memorizationRecords.date, date));

  const rows = await db
    .select({
      id: memorizationRecords.id,
      studentId: memorizationRecords.studentId,
      studentName: students.name,
      surahName: memorizationRecords.surahName,
      fromVerse: memorizationRecords.fromVerse,
      toVerse: memorizationRecords.toVerse,
      rating: memorizationRecords.rating,
      notes: memorizationRecords.notes,
      date: memorizationRecords.date,
      createdAt: memorizationRecords.createdAt,
    })
    .from(memorizationRecords)
    .leftJoin(students, eq(memorizationRecords.studentId, students.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(memorizationRecords.date);

  res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
});

router.post("/memorization", async (req, res): Promise<void> => {
  const { studentId, surahName, fromVerse, toVerse, rating, notes, date } = req.body;
  if (!studentId || !surahName || !fromVerse || !toVerse || !rating || !date) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  const [record] = await db
    .insert(memorizationRecords)
    .values({ studentId, surahName, fromVerse, toVerse, rating, notes, date })
    .returning();

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({ ...record, studentName: student?.name ?? "", createdAt: record.createdAt.toISOString() });
});

router.patch("/memorization/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { surahName, fromVerse, toVerse, rating, notes } = req.body;

  const [record] = await db
    .update(memorizationRecords)
    .set({ surahName, fromVerse, toVerse, rating, notes })
    .where(eq(memorizationRecords.id, id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "السجل غير موجود" });
    return;
  }

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, record.studentId));
  res.json({ ...record, studentName: student?.name ?? "", createdAt: record.createdAt.toISOString() });
});

router.delete("/memorization/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(memorizationRecords).where(eq(memorizationRecords.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "السجل غير موجود" });
    return;
  }
  res.sendStatus(204);
});

export default router;
