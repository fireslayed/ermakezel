import { pgTable, text, serial, integer, boolean, timestamp, json, real, varchar, primaryKey, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(), // Görevi oluşturan kullanıcı (genellikle root/admin)
  projectId: integer("project_id"),
  planId: integer("plan_id").references(() => plans.id, { onDelete: "set null" }), // Görevin bağlı olduğu plan
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(3, "Password must be at least 3 characters"),
});

// Report model
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  reportType: text("report_type").default("daily"), // daily, maintenance, issue, etc.
  emailTo: text("email_to"),
  status: text("status").default("draft"), // draft, sent
  attachments: json("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
// Parça model
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  partNumber: varchar("part_number", { length: 50 }).notNull().unique(),
  qrCode: text("qr_code"),
  image: text("image"),
  length: real("length"),
  width: real("width"),
  height: real("height"),
  weight: real("weight"),
  color: text("color"),
  description: text("description"),
  userId: integer("user_id").notNull(),
  category: text("category"),
  technicalDrawing: text("technical_drawing"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Plan model
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  content: json("content").$type<{
    backgroundImages: Array<{
      id: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    points: Array<{
      id: string;
      x: number;
      y: number;
      notes: string[];
      images: string[];
      parts: number[];
    }>;
  }>().default({ backgroundImages: [], points: [] }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LoginCredentials = z.infer<typeof loginSchema>;
// Plan-User ilişkisi (hangi planların hangi kullanıcılara atandığını takip etmek için)
export const planUsers = pgTable("plan_users", {
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").notNull().references(() => users.id), // Atamayı yapan kullanıcı (genellikle root/admin)
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.planId, table.userId] })
  }
});

export const insertPlanUserSchema = createInsertSchema(planUsers);

// Task modelini güncelliyoruz (görev atama sistemi için)
export const taskAssignments = pgTable("task_assignments", {
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.taskId, table.userId] })
  }
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({
  assignedAt: true,
  completedAt: true,
});

// İlişkileri tanımlıyoruz
export const usersRelations = relations(users, ({ many }) => ({
  assignedPlans: many(planUsers),
  assignedTasks: many(taskAssignments),
  createdTasks: many(tasks, { relationName: "createdBy" }),
  locationReports: many(locationReports),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  assignedUsers: many(planUsers),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tasks.userId],
    references: [users.id],
    relationName: "createdBy"
  }),
  assignedTo: many(taskAssignments),
  plan: one(plans, {
    fields: [tasks.planId],
    references: [plans.id]
  }),
}));

export const planUsersRelations = relations(planUsers, ({ one }) => ({
  user: one(users, {
    fields: [planUsers.userId],
    references: [users.id]
  }),
  plan: one(plans, {
    fields: [planUsers.planId],
    references: [plans.id]
  }),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [taskAssignments.taskId],
    references: [tasks.id]
  }),
}));

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanUser = typeof planUsers.$inferSelect;
export type InsertPlanUser = z.infer<typeof insertPlanUserSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;

// Hatırlatıcılar tablosu
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderType: varchar("reminder_type", { length: 50 }).notNull().default("email"), // email, notification, sms
  message: text("message"),
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Kullanıcı bildirimleri tablosu
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"), // info, warning, error, success
  isRead: boolean("is_read").default(false),
  relatedTaskId: integer("related_task_id").references(() => tasks.id),
  relatedPlanId: integer("related_plan_id").references(() => plans.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Yer bildirimleri için tablo
export const locationReports = pgTable("location_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportDate: timestamp("report_date").notNull().defaultNow(),
  location: text("location").notNull(),
  description: text("description"),
  gpsLat: numeric("gps_lat"),
  gpsLong: numeric("gps_long"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Yer bildirimleri için ilişki
export const locationReportsRelations = relations(locationReports, ({ one }) => ({
  user: one(users, {
    fields: [locationReports.userId],
    references: [users.id],
  }),
}));

// Yer bildirimi şeması
export const insertLocationReportSchema = createInsertSchema(locationReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LocationReport = typeof locationReports.$inferSelect;
export type InsertLocationReport = z.infer<typeof insertLocationReportSchema>;


