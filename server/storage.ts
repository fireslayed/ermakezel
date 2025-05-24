import { 
  users, tasks, projects, reports, parts,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Project, type InsertProject,
  type Report, type InsertReport,
  type Part, type InsertPart
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { sendEmail } from "./email";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
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
  
  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
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