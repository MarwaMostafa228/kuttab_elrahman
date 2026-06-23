import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { circles } from "./circles";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  studentCode: text("student_code").notNull().unique(),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  enrollmentDate: date("enrollment_date", { mode: "string" }),
  circleId: integer("circle_id").references(() => circles.id),
  notes: text("notes"),
  guardianNotes: text("guardian_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, studentCode: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
