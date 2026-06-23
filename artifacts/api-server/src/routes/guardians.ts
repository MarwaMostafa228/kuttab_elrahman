import { Router, type IRouter } from "express";
import { db, guardians, students } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/guardians", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;

  let query = db
    .select({
      id: guardians.id,
      studentId: guardians.studentId,
      studentName: students.name,
      name: guardians.name,
      relationship: guardians.relationship,
      phone: guardians.phone,
      email: guardians.email,
      notes: guardians.notes,
      createdAt: guardians.createdAt,
    })
    .from(guardians)
    .leftJoin(students, eq(guardians.studentId, students.id));

  if (studentId) {
    const rows = await query.where(eq(guardians.studentId, studentId));
    res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
    return;
  }

  const rows = await query.orderBy(guardians.createdAt);
  res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
});

router.post("/guardians", async (req, res): Promise<void> => {
  const { studentId, name, relationship, phone, email, notes } = req.body;
  if (!studentId || !name || !relationship) {
    res.status(400).json({ error: "الطالب والاسم وصلة القرابة مطلوبة" });
    return;
  }

  const [guardian] = await db.insert(guardians).values({ studentId, name, relationship, phone, email, notes }).returning();
  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({ ...guardian, studentName: student?.name ?? "", createdAt: guardian.createdAt.toISOString() });
});

router.patch("/guardians/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, relationship, phone, email, notes } = req.body;

  const [guardian] = await db.update(guardians).set({ name, relationship, phone, email, notes }).where(eq(guardians.id, id)).returning();
  if (!guardian) {
    res.status(404).json({ error: "ولي الأمر غير موجود" });
    return;
  }

  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, guardian.studentId));
  res.json({ ...guardian, studentName: student?.name ?? "", createdAt: guardian.createdAt.toISOString() });
});

export default router;
