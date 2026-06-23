import { Router, type IRouter } from "express";
import { db, students, circles } from "@workspace/db";
import { eq } from "drizzle-orm";

function generateStudentCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `KR-${digits}`;
}

async function getUniqueCode(): Promise<string> {
  let code = generateStudentCode();
  let attempts = 0;
  while (attempts < 10) {
    const [existing] = await db.select({ id: students.id }).from(students).where(eq(students.studentCode, code));
    if (!existing) return code;
    code = generateStudentCode();
    attempts++;
  }
  return code;
}

const router: IRouter = Router();

router.get("/students", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      studentCode: students.studentCode,
      phone: students.phone,
      dateOfBirth: students.dateOfBirth,
      enrollmentDate: students.enrollmentDate,
      circleId: students.circleId,
      circleName: circles.name,
      notes: students.notes,
      createdAt: students.createdAt,
    })
    .from(students)
    .leftJoin(circles, eq(students.circleId, circles.id))
    .orderBy(students.createdAt);

  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/students", async (req, res): Promise<void> => {
  const { name, phone, dateOfBirth, enrollmentDate, circleId, notes } = req.body;
  if (!name) {
    res.status(400).json({ error: "اسم الطالب مطلوب" });
    return;
  }

  const studentCode = await getUniqueCode();
  const [student] = await db
    .insert(students)
    .values({ name, phone, dateOfBirth, enrollmentDate, circleId: circleId ?? null, notes, studentCode })
    .returning();

  res.status(201).json({
    ...student,
    circleName: null,
    createdAt: student.createdAt.toISOString(),
  });
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [row] = await db
    .select({
      id: students.id,
      name: students.name,
      studentCode: students.studentCode,
      phone: students.phone,
      dateOfBirth: students.dateOfBirth,
      enrollmentDate: students.enrollmentDate,
      circleId: students.circleId,
      circleName: circles.name,
      notes: students.notes,
      createdAt: students.createdAt,
    })
    .from(students)
    .leftJoin(circles, eq(students.circleId, circles.id))
    .where(eq(students.id, id));

  if (!row) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }

  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, phone, dateOfBirth, enrollmentDate, circleId, notes } = req.body;

  const [student] = await db
    .update(students)
    .set({ name, phone, dateOfBirth, enrollmentDate, circleId: circleId ?? null, notes })
    .where(eq(students.id, id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }

  res.json({ ...student, circleName: null, createdAt: student.createdAt.toISOString() });
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(students).where(eq(students.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }
  res.sendStatus(204);
});

export default router;
