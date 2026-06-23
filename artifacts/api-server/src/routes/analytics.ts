import { Router, type IRouter } from "express";
import { db, students, circles, attendanceRecords, memorizationRecords, payments, expenses } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  const [{ totalStudents }] = await db.select({ totalStudents: count() }).from(students);
  const [{ totalCircles }] = await db.select({ totalCircles: count() }).from(circles);
  const [{ totalMemorizationDays }] = await db.select({ totalMemorizationDays: count() }).from(memorizationRecords);

  const allAttendance = await db.select({ status: attendanceRecords.status }).from(attendanceRecords);
  const presentCount = allAttendance.filter(a => a.status === "حاضر").length;
  const attendanceRate = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : 0;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPayments = await db.select({ amount: payments.amount }).from(payments).where(eq(payments.month, currentMonth));
  const totalPaymentsThisMonth = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);

  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${year}-${month}`;
  const monthExpenses = await db.select({ amount: expenses.amount }).from(expenses).where(sql`${expenses.date} LIKE ${monthPrefix + "%"}`);
  const totalExpensesThisMonth = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount as string), 0);

  const topStudentsRaw = await db
    .select({ studentId: memorizationRecords.studentId, name: students.name, memorizationDays: count() })
    .from(memorizationRecords)
    .leftJoin(students, eq(memorizationRecords.studentId, students.id))
    .groupBy(memorizationRecords.studentId, students.name)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const recentMem = await db
    .select({ studentName: students.name, surahName: memorizationRecords.surahName, date: memorizationRecords.date })
    .from(memorizationRecords)
    .leftJoin(students, eq(memorizationRecords.studentId, students.id))
    .orderBy(sql`${memorizationRecords.createdAt} DESC`)
    .limit(5);

  const recentActivity = recentMem.map(m => ({
    type: "memorization",
    description: `${m.studentName} حفظ سورة ${m.surahName}`,
    date: m.date,
  }));

  res.json({
    totalStudents: Number(totalStudents),
    totalCircles: Number(totalCircles),
    attendanceRate,
    totalMemorizationDays: Number(totalMemorizationDays),
    totalPaymentsThisMonth,
    totalExpensesThisMonth,
    topStudents: topStudentsRaw.map(s => ({
      studentId: s.studentId,
      name: s.name ?? "",
      memorizationDays: Number(s.memorizationDays),
    })),
    recentActivity,
  });
});

router.get("/analytics/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [student] = await db.select().from(students).where(eq(students.id, id));
  if (!student) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }

  const attendance = await db.select({ status: attendanceRecords.status, date: attendanceRecords.date }).from(attendanceRecords).where(eq(attendanceRecords.studentId, id));
  const presentCount = attendance.filter(a => a.status === "حاضر").length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const memHistory = await db
    .select({
      date: memorizationRecords.date,
      surahName: memorizationRecords.surahName,
      fromVerse: memorizationRecords.fromVerse,
      toVerse: memorizationRecords.toVerse,
      rating: memorizationRecords.rating,
    })
    .from(memorizationRecords)
    .where(eq(memorizationRecords.studentId, id))
    .orderBy(memorizationRecords.date);

  const studentPayments = await db.select({ amount: payments.amount }).from(payments).where(eq(payments.studentId, id));
  const totalPayments = studentPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);

  res.json({
    studentId: student.id,
    name: student.name,
    studentCode: student.studentCode,
    attendanceRate,
    totalMemorizationDays: memHistory.length,
    totalPayments,
    memorizationHistory: memHistory,
    attendanceHistory: attendance.map(a => ({ date: a.date, status: a.status })),
  });
});

export default router;
