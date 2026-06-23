import { Router, type IRouter } from "express";
import { db, circles, students } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/circles", async (_req, res): Promise<void> => {
  const rows = await db.select().from(circles).orderBy(circles.createdAt);

  const withCounts = await Promise.all(
    rows.map(async (circle) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(students)
        .where(eq(students.circleId, circle.id));
      return {
        ...circle,
        studentCount: Number(value),
        createdAt: circle.createdAt.toISOString(),
      };
    })
  );

  res.json(withCounts);
});

router.post("/circles", async (req, res): Promise<void> => {
  const { name, description, schedule, onlineLink } = req.body;
  if (!name) {
    res.status(400).json({ error: "اسم الحلقة مطلوب" });
    return;
  }

  const [circle] = await db.insert(circles).values({ name, description, schedule, onlineLink }).returning();
  res.status(201).json({ ...circle, studentCount: 0, createdAt: circle.createdAt.toISOString() });
});

router.get("/circles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [circle] = await db.select().from(circles).where(eq(circles.id, id));
  if (!circle) {
    res.status(404).json({ error: "الحلقة غير موجودة" });
    return;
  }

  const [{ value }] = await db.select({ value: count() }).from(students).where(eq(students.circleId, id));
  res.json({ ...circle, studentCount: Number(value), createdAt: circle.createdAt.toISOString() });
});

router.patch("/circles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, description, schedule, onlineLink } = req.body;

  const [circle] = await db.update(circles).set({ name, description, schedule, onlineLink }).where(eq(circles.id, id)).returning();
  if (!circle) {
    res.status(404).json({ error: "الحلقة غير موجودة" });
    return;
  }

  const [{ value }] = await db.select({ value: count() }).from(students).where(eq(students.circleId, id));
  res.json({ ...circle, studentCount: Number(value), createdAt: circle.createdAt.toISOString() });
});

router.delete("/circles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(circles).where(eq(circles.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الحلقة غير موجودة" });
    return;
  }
  res.sendStatus(204);
});

export default router;
