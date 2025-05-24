import { 
  users, tasks, projects, reports, parts, plans, planUsers, taskAssignments, 
  reminders, notifications,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Project, type InsertProject,
  type Report, type InsertReport,
  type Part, type InsertPart,
  type Plan, type InsertPlan,
  type PlanUser, type InsertPlanUser,
  type TaskAssignment, type InsertTaskAssignment,
  type Reminder, type InsertReminder,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { sendEmail } from "./email";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>; // Yeni: Tüm kullanıcıları getir (root için)
  
  // Task operations
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getAssignedTasks(userId: number): Promise<(Task & { assignedUsers: User[] })[]>; // Kullanıcıya atanmış görevleri getir
  
  // Project operations
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Report operations
  getReports(userId: number): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;
  sendReport(id: number, emailTo: string): Promise<boolean>;
  
  // Part operations
  getParts(userId: number): Promise<Part[]>;
  getPart(id: number): Promise<Part | undefined>;
  getPartByPartNumber(partNumber: string): Promise<Part | undefined>;
  createPart(part: InsertPart, qrCode?: string): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;
  
  // Plan operations
  getPlans(userId: number): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;
  getAssignedPlans(userId: number): Promise<Plan[]>; // Kullanıcıya atanmış planları getir
  
  // Plan-User operations (Yeni)
  assignPlanToUser(planId: number, userId: number, assignedBy: number): Promise<PlanUser>;
  removePlanFromUser(planId: number, userId: number): Promise<boolean>;
  getPlanUsers(planId: number): Promise<User[]>; // Bir plana atanmış kullanıcıları getir
  
  // Task Assignment operations (Yeni)
  assignTaskToUsers(taskId: number, userIds: number[], assignedBy: number): Promise<TaskAssignment[]>;
  removeTaskAssignment(taskId: number, userId: number): Promise<boolean>;
  updateTaskAssignmentStatus(taskId: number, userId: number, status: string, notes?: string): Promise<TaskAssignment | undefined>;
  getTaskAssignments(taskId: number): Promise<TaskAssignment[]>;
  getTaskAssignedUsers(taskId: number): Promise<User[]>;
  
  // Reminder operations (Yeni)
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getReminders(userId: number): Promise<Reminder[]>;
  getTaskReminders(taskId: number): Promise<Reminder[]>;
  getOverdueReminders(): Promise<Reminder[]>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
  markReminderAsSent(id: number): Promise<Reminder | undefined>;
  
  // Notification operations (Yeni)
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUserUnreadNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Dashboard stats
  getTaskStats(userId: number): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date();
    const taskData = {
      ...insertTask,
      createdAt: now,
      updatedAt: now
    };
    
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set({
        ...taskUpdate,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    // Önce görev atamalarını silelim
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, id));
    // Sonra görevi silelim
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
  
  // Kullanıcıya atanmış görevleri getir
  async getAssignedTasks(userId: number): Promise<(Task & { assignedUsers: User[] })[]> {
    // Kullanıcıya atanmış görevleri al
    const assignments = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.userId, userId));
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Görev ID'lerini topla
    const taskIds = assignments.map(assignment => assignment.taskId);
    
    // Görevleri al
    const tasksResult = await Promise.all(
      taskIds.map(async (taskId) => {
        const task = await this.getTask(taskId);
        if (!task) return null;
        
        // Bu göreve atanmış tüm kullanıcıları al
        const assignedUsers = await this.getTaskAssignedUsers(taskId);
        
        return {
          ...task,
          assignedUsers
        };
      })
    );
    
    // null olanları filtrele
    return tasksResult.filter(task => task !== null) as (Task & { assignedUsers: User[] })[];
  }
  
  // Görev atama işlemleri
  async assignTaskToUsers(taskId: number, userIds: number[], assignedBy: number): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];
    
    for (const userId of userIds) {
      // Daha önce atanmış mı kontrol et
      const existing = await db
        .select()
        .from(taskAssignments)
        .where(and(
          eq(taskAssignments.taskId, taskId),
          eq(taskAssignments.userId, userId)
        ));
      
      // Eğer atanmamışsa ekle
      if (existing.length === 0) {
        const [assignment] = await db
          .insert(taskAssignments)
          .values({
            taskId,
            userId,
            assignedBy,
            assignedAt: new Date(),
            status: "pending",
          })
          .returning();
        
        assignments.push(assignment);
      }
    }
    
    return assignments;
  }
  
  async removeTaskAssignment(taskId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  async updateTaskAssignmentStatus(taskId: number, userId: number, status: string, notes?: string): Promise<TaskAssignment | undefined> {
    const updateData: any = {
      status
    };
    
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const [updated] = await db
      .update(taskAssignments)
      .set(updateData)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      ))
      .returning();
    
    return updated;
  }
  
  async getTaskAssignments(taskId: number): Promise<TaskAssignment[]> {
    return await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));
  }
  
  async getTaskAssignedUsers(taskId: number): Promise<User[]> {
    // Bu göreve atanmış kullanıcı ID'lerini bul
    const assignments = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Kullanıcı ID'lerini topla
    const userIds = assignments.map(assignment => assignment.userId);
    
    // Kullanıcıları getir
    const usersResult = await Promise.all(
      userIds.map(async (userId) => {
        const user = await this.getUser(userId);
        return user;
      })
    );
    
    // null/undefined olanları filtrele
    return usersResult.filter(user => user !== undefined) as User[];
  }
  
  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }
  
  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
  
  // Report operations
  async getReports(userId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.userId, userId));
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createReport(insertReport: InsertReport): Promise<Report> {
    const now = new Date();
    const reportData = {
      ...insertReport,
      createdAt: now,
      updatedAt: now
    };
    
    const [report] = await db
      .insert(reports)
      .values(reportData)
      .returning();
    return report;
  }
  
  async updateReport(id: number, reportUpdate: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db
      .update(reports)
      .set({
        ...reportUpdate,
        updatedAt: new Date()
      })
      .where(eq(reports.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }
  
  async sendReport(id: number, emailTo: string): Promise<boolean> {
    try {
      const report = await this.getReport(id);
      if (!report) return false;
      
      // Get user info
      const user = await this.getUser(report.userId);
      if (!user) return false;
      
      // Get project info if available
      let projectName = "";
      if (report.projectId) {
        const project = await this.getProject(report.projectId);
        if (project) {
          projectName = project.name;
        }
      }
      
      // Send email
      const success = await sendEmail({
        to: emailTo,
        subject: `Rapor: ${report.title}`,
        text: `
          Rapor: ${report.title}
          Tarih: ${report.createdAt?.toLocaleDateString()}
          Oluşturan: ${user.fullName || user.username}
          Proje: ${projectName || "Belirtilmemiş"}
          
          ${report.description || ""}
        `,
        html: `
          <h2>Rapor: ${report.title}</h2>
          <p><strong>Tarih:</strong> ${report.createdAt?.toLocaleDateString()}</p>
          <p><strong>Oluşturan:</strong> ${user.fullName || user.username}</p>
          <p><strong>Proje:</strong> ${projectName || "Belirtilmemiş"}</p>
          <hr />
          <div>${report.description || ""}</div>
        `
      });
      
      if (success) {
        // Update report status to sent
        await this.updateReport(id, { 
          status: "sent", 
          emailTo 
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error sending report:", error);
      return false;
    }
  }
  
  // Part operations
  async getParts(userId: number): Promise<Part[]> {
    return await db
      .select()
      .from(parts)
      .where(eq(parts.userId, userId));
  }

  async getPart(id: number): Promise<Part | undefined> {
    const result = await db
      .select()
      .from(parts)
      .where(eq(parts.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getPartByPartNumber(partNumber: string): Promise<Part | undefined> {
    const result = await db
      .select()
      .from(parts)
      .where(eq(parts.partNumber, partNumber));
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createPart(insertPart: InsertPart, qrCode?: string): Promise<Part> {
    const now = new Date();
    const partData = {
      ...insertPart,
      qrCode: qrCode || null,
      createdAt: now,
      updatedAt: now
    };
    
    const [part] = await db
      .insert(parts)
      .values(partData)
      .returning();
    
    return part;
  }

  async updatePart(id: number, partUpdate: Partial<InsertPart>): Promise<Part | undefined> {
    const updateData = {
      ...partUpdate,
      updatedAt: new Date()
    };
    
    const [updatedPart] = await db
      .update(parts)
      .set(updateData)
      .where(eq(parts.id, id))
      .returning();
    
    return updatedPart;
  }

  async deletePart(id: number): Promise<boolean> {
    const result = await db
      .delete(parts)
      .where(eq(parts.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Dashboard stats
  async getTaskStats(userId: number): Promise<{ total: number; completed: number; pending: number; overdue: number; }> {
    // Get total tasks
    const totalResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.userId, userId));
    
    // Get completed tasks
    const completedResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.completed, true)
      ));
    
    // Get pending tasks
    const pendingResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.completed, false)
      ));
    
    // Get overdue tasks
    const overdueResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.completed, false),
        sql`${tasks.dueDate} < NOW()`
      ));
    
    return {
      total: Number(totalResult[0]?.count || 0),
      completed: Number(completedResult[0]?.count || 0),
      pending: Number(pendingResult[0]?.count || 0),
      overdue: Number(overdueResult[0]?.count || 0)
    };
  }
  
  // Plan operations
  async getPlans(userId: number): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.userId, userId));
  }
  
  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }
  
  async createPlan(insertPlan: InsertPlan): Promise<Plan> {
    const now = new Date();
    const planData = {
      ...insertPlan,
      createdAt: now,
      updatedAt: now
    };
    
    const [plan] = await db.insert(plans).values(planData).returning();
    return plan;
  }
  
  async updatePlan(id: number, planUpdate: Partial<InsertPlan>): Promise<Plan | undefined> {
    const [plan] = await db
      .update(plans)
      .set({
        ...planUpdate,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  }
  
  async deletePlan(id: number): Promise<boolean> {
    // İlişkili görevleri de silelim
    const relatedTasks = await db.select().from(tasks).where(eq(tasks.planId, id));
    for (const task of relatedTasks) {
      await this.deleteTask(task.id);
    }
    
    // Önce planın atamalarını silelim
    await db.delete(planUsers).where(eq(planUsers.planId, id));
    
    // Sonra planı silelim
    const result = await db.delete(plans).where(eq(plans.id, id)).returning();
    return result.length > 0;
  }
  
  // Kullanıcıya atanmış planları getir
  async getAssignedPlans(userId: number): Promise<Plan[]> {
    // Kullanıcıya atanmış planları bul
    const assignments = await db
      .select()
      .from(planUsers)
      .where(eq(planUsers.userId, userId));
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Plan ID'lerini topla
    const planIds = assignments.map(assignment => assignment.planId);
    
    // Planları getir
    const plans = await Promise.all(
      planIds.map(async (planId) => {
        const plan = await this.getPlan(planId);
        return plan;
      })
    );
    
    // null/undefined olanları filtrele
    return plans.filter(plan => plan !== undefined) as Plan[];
  }
  
  // Plan-User ilişkisi işlemleri
  async assignPlanToUser(planId: number, userId: number, assignedBy: number): Promise<PlanUser> {
    const [assignment] = await db
      .insert(planUsers)
      .values({
        planId,
        userId,
        assignedBy,
        assignedAt: new Date()
      })
      .returning();
    
    return assignment;
  }
  
  async removePlanFromUser(planId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(planUsers)
      .where(and(
        eq(planUsers.planId, planId),
        eq(planUsers.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  async getPlanUsers(planId: number): Promise<User[]> {
    // Bu plana atanmış kullanıcı ID'lerini bul
    const assignments = await db
      .select()
      .from(planUsers)
      .where(eq(planUsers.planId, planId));
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Kullanıcı ID'lerini topla
    const userIds = assignments.map(assignment => assignment.userId);
    
    // Kullanıcıları getir
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await this.getUser(userId);
        return user;
      })
    );
    
    // null/undefined olanları filtrele
    return users.filter(user => user !== undefined) as User[];
  }

  // Reminder operations
  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }
  
  async getReminders(userId: number): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId));
  }
  
  async getTaskReminders(taskId: number): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.taskId, taskId));
  }
  
  async getOverdueReminders(): Promise<Reminder[]> {
    // Gönderilmemiş ve tarihi geçmiş hatırlatıcıları getir
    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.sent, false),
          sql`${reminders.reminderDate} <= NOW()`
        )
      );
  }
  
  async updateReminder(id: number, reminderUpdate: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updated] = await db
      .update(reminders)
      .set({
        ...reminderUpdate,
        updatedAt: new Date()
      })
      .where(eq(reminders.id, id))
      .returning();
    
    return updated;
  }
  
  async deleteReminder(id: number): Promise<boolean> {
    const result = await db
      .delete(reminders)
      .where(eq(reminders.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async markReminderAsSent(id: number): Promise<Reminder | undefined> {
    const [updated] = await db
      .update(reminders)
      .set({ 
        sent: true,
        updatedAt: new Date()
      })
      .where(eq(reminders.id, id))
      .returning();
    
    return updated;
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    
    return notification;
  }
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`);
  }
  
  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(sql`${notifications.createdAt} DESC`);
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return updated;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return true;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Initialize demo data if needed
  async initializeDemoData(): Promise<void> {
    // Check if users table is empty
    const usersCount = await db.select({ count: count() }).from(users);
    
    if (Number(usersCount[0]?.count || 0) === 0) {
      // Create demo user
      const demoUser = await this.createUser({
        username: 'ermak',
        password: 'ermak', // In a real app, this would be hashed
        fullName: 'Demo User'
      });
      
      // Create demo projects
      const demoProjects = [
        { name: 'Work Tasks', description: 'Professional tasks and deadlines', color: '#6366f1', userId: demoUser.id },
        { name: 'Personal', description: 'Personal errands and tasks', color: '#10b981', userId: demoUser.id },
        { name: 'Learning', description: 'Educational goals and courses', color: '#f59e0b', userId: demoUser.id }
      ];
      
      for (const project of demoProjects) {
        await this.createProject(project);
      }
    }
  }
}

export const storage = new DatabaseStorage();