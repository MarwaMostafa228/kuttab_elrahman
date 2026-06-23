import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, sheikhs, students } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    role?: "sheikh" | "student";
    userId?: number;
    name?: string;
    email?: string;
    studentCode?: string;
    studentId?: number;
  }
}

const SHEIKH_ACTIVATION_CODE = "sheikh@119955";

const router: IRouter = Router();

router.post("/auth/sheikh/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }

  const [sheikh] = await db.select().from(sheikhs).where(eq(sheikhs.email, email));
  if (!sheikh) {
    res.status(401).json({ error: "بيانات تسجيل الدخول غير صحيحة" });
    return;
  }

  const valid = await bcrypt.compare(password, sheikh.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "بيانات تسجيل الدخول غير صحيحة" });
    return;
  }

  req.session.role = "sheikh";
  req.session.userId = sheikh.id;
  req.session.name = sheikh.name;
  req.session.email = sheikh.email;

  res.json({
    role: "sheikh",
    userId: sheikh.id,
    name: sheikh.name,
    email: sheikh.email,
    studentCode: null,
    studentId: null,
  });
});

router.post("/auth/sheikh/register", async (req, res): Promise<void> => {
  const { email, password, activationCode, name } = req.body;

  if (!email || !password || !activationCode || !name) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  if (activationCode !== SHEIKH_ACTIVATION_CODE) {
    res.status(400).json({ error: "كود التفعيل غير صحيح" });
    return;
  }

  const [existing] = await db.select().from(sheikhs).where(eq(sheikhs.email, email));
  if (existing) {
    res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [sheikh] = await db.insert(sheikhs).values({ name, email, passwordHash }).returning();

  req.session.role = "sheikh";
  req.session.userId = sheikh.id;
  req.session.name = sheikh.name;
  req.session.email = sheikh.email;

  res.status(201).json({
    role: "sheikh",
    userId: sheikh.id,
    name: sheikh.name,
    email: sheikh.email,
    studentCode: null,
    studentId: null,
  });
});

router.post("/auth/student/login", async (req, res): Promise<void> => {
  const { studentCode } = req.body;
  if (!studentCode) {
    res.status(400).json({ error: "كود الطالب مطلوب" });
    return;
  }

  const [student] = await db.select().from(students).where(eq(students.studentCode, studentCode));
  if (!student) {
    res.status(401).json({ error: "الكود غير صحيح، تواصل مع الشيخ" });
    return;
  }

  req.session.role = "student";
  req.session.userId = student.id;
  req.session.name = student.name;
  req.session.studentCode = student.studentCode;
  req.session.studentId = student.id;

  res.json({
    role: "student",
    userId: student.id,
    name: student.name,
    email: null,
    studentCode: student.studentCode,
    studentId: student.id,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.sendStatus(204);
  });
});

router.get("/auth/me", (req, res): void => {
  if (!req.session.role) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return;
  }
  res.json({
    role: req.session.role,
    userId: req.session.userId,
    name: req.session.name ?? null,
    email: req.session.email ?? null,
    studentCode: req.session.studentCode ?? null,
    studentId: req.session.studentId ?? null,
  });
});

export default router;
