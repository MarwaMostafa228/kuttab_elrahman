import { Router, type IRouter } from "express";
import { db, certificates, students } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/certificates", async (req, res): Promise<void> => {
  const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;

  let query = db
    .select({
      id: certificates.id,
      studentId: certificates.studentId,
      studentName: students.name,
      title: certificates.title,
      description: certificates.description,
      issuedAt: certificates.issuedAt,
      createdAt: certificates.createdAt,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id));

  if (studentId) {
    const rows = await query.where(eq(certificates.studentId, studentId));
    res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
    return;
  }

  const rows = await query.orderBy(certificates.issuedAt);
  res.json(rows.map(r => ({ ...r, studentName: r.studentName ?? "", createdAt: r.createdAt.toISOString() })));
});

router.post("/certificates", async (req, res): Promise<void> => {
  const { studentId, title, description, issuedAt } = req.body;
  if (!studentId || !title || !issuedAt) {
    res.status(400).json({ error: "الطالب والعنوان والتاريخ مطلوبة" });
    return;
  }

  const [cert] = await db.insert(certificates).values({ studentId, title, description, issuedAt }).returning();
  const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId));

  res.status(201).json({ ...cert, studentName: student?.name ?? "", createdAt: cert.createdAt.toISOString() });
});

router.delete("/certificates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(certificates).where(eq(certificates.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الشهادة غير موجودة" });
    return;
  }
  res.sendStatus(204);
});

export default router;
