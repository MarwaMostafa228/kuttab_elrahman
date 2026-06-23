import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sheikhs = pgTable("sheikhs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSheikhSchema = createInsertSchema(sheikhs).omit({ id: true, createdAt: true });
export type InsertSheikh = z.infer<typeof insertSheikhSchema>;
export type Sheikh = typeof sheikhs.$inferSelect;
