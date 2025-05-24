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
  // Part operations
  async getParts(userId: number): Promise<Part[]> {
    return await db.select().from(parts).where(eq(parts.userId, userId));
  }

  async getPart(id: number): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getPartByPartNumber(partNumber: string): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.partNumber, partNumber));
    return result.length > 0 ? result[0] : undefined;
  }

  async createPart(insertPart: InsertPart, qrCode?: string): Promise<Part> {
    const partWithDefaults = {
      ...insertPart,
      qrCode: qrCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.insert(parts).values(partWithDefaults).returning();
    return result[0];
  }

  async updatePart(id: number, partUpdate: Partial<InsertPart>): Promise<Part | undefined> {
    const result = await db.update(parts)
      .set({
        ...partUpdate,
        updatedAt: new Date()
      })
      .where(eq(parts.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deletePart(id: number): Promise<boolean> {
    const result = await db.delete(parts).where(eq(parts.id, id)).returning();
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
    const result = await db.insert(reports).values({
      ...insertReport,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateReport(id: number, reportUpdate: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db.update(reports)
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
      // Önce rapor bilgilerini getir
      const report = await this.getReport(id);
      if (!report) {
        console.error('Rapor bulunamadı:', id);
        return false;
      }
      
      // E-posta modülünü import et
      const { sendEmail } = await import('./email');
      
      // Proje bilgisini al (varsa)
      let projectName = "";
      if (report.projectId) {
        const project = await db.select().from(projects).where(eq(projects.id, report.projectId));
        if (project.length > 0) {
          projectName = project[0].name;
        }
      }
      
      // Rapor türünü belirle
      const reportTypes: Record<string, string> = {
        "daily": "Günlük Rapor",
        "installation": "Kurulum Raporu",
        "maintenance": "Bakım Raporu",
        "inspection": "Denetim Raporu",
        "incident": "Olay Raporu",
        "production": "Üretim Raporu"
      };
      
      const reportTypeName = reportTypes[report.reportType || 'daily'] || 'Rapor';
      
      // HTML içeriği oluştur
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">${report.title}</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Rapor Türü:</strong> ${reportTypeName}</p>
            ${projectName ? `<p><strong>Proje:</strong> ${projectName}</p>` : ''}
            ${report.location ? `<p><strong>Konum:</strong> ${report.location}</p>` : ''}
            <p><strong>Tarih:</strong> ${new Date(report.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4b5563;">Açıklama</h3>
            <p style="white-space: pre-line;">${report.description || 'Açıklama bulunmuyor.'}</p>
          </div>
          
          <div style="font-size: 12px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            <p>Bu e-posta ErmakPlan Beta v2 uygulaması tarafından gönderilmiştir.</p>
          </div>
        </div>
      `;
      
      // E-posta gönder
      const emailSent = await sendEmail({
        to: emailTo,
        subject: `[ErmakPlan] ${report.title}`,
        html: htmlContent,
        text: `${report.title}\n\nRapor Türü: ${reportTypeName}\n${projectName ? `Proje: ${projectName}\n` : ''}${report.location ? `Konum: ${report.location}\n` : ''}Tarih: ${new Date(report.createdAt).toLocaleDateString('tr-TR')}\n\nAçıklama:\n${report.description || 'Açıklama bulunmuyor.'}\n\n---\nBu e-posta ErmakPlan Beta v2 uygulaması tarafından gönderilmiştir.`,
      });
      
      if (emailSent) {
        // Rapor durumunu güncelle
        const result = await db.update(reports)
          .set({ 
            status: "sent",
            emailTo: emailTo,
            updatedAt: new Date()
          })
          .where(eq(reports.id, id))
          .returning();
        
        return result.length > 0;
      } else {
        console.error('E-posta gönderilemedi');
        return false;
      }
    } catch (error) {
      console.error('Rapor gönderirken hata oluştu:', error);
      return false;
    }
  }
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
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
    const taskWithDefaults = {
      ...insertTask,
      createdAt: new Date()
    };
    const result = await db.insert(tasks).values(taskWithDefaults).returning();
    return result[0];
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
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
    const projectWithDefaults = {
      ...insertProject,
      createdAt: new Date()
    };
    const result = await db.insert(projects).values(projectWithDefaults).returning();
    return result[0];
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
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
    const newPart = {
      ...insertPart,
      qrCode: qrCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [part] = await db
      .insert(parts)
      .values(newPart)
      .returning();
    
    return part;
  }

  async updatePart(id: number, partUpdate: Partial<InsertPart>): Promise<Part | undefined> {
    const part = await this.getPart(id);
    if (!part) return undefined;
    
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
      .where(eq(parts.id, id));
    
    return true;
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
