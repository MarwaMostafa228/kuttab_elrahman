import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { students } from "./students";

export const memorizationRecords = pgTable("memorization_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  surahName: text("surah_name").notNull(),
  fromVerse: integer("from_verse").notNull(),
  toVerse: integer("to_verse").notNull(),
  rating: text("rating").notNull(),
  notes: text("notes"),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemorizationSchema = createInsertSchema(memorizationRecords).omit({ id: true, createdAt: true });
export type InsertMemorization = z.infer<typeof insertMemorizationSchema>;
export type MemorizationRecord = typeof memorizationRecords.$inferSelect;
