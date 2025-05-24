import { 
  users, tasks, projects,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Project, type InsertProject
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
