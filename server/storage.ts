import { 
  users, tasks, projects,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Project, type InsertProject
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private tasksData: Map<number, Task>;
  private projectsData: Map<number, Project>;
  private userIdCounter: number;
  private taskIdCounter: number;
  private projectIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.tasksData = new Map();
    this.projectsData = new Map();
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.projectIdCounter = 1;
    
    // Add a demo user
    const demoUser: User = {
      id: this.userIdCounter++,
      username: 'ermak',
      password: 'ermak', // In a real app, this would be hashed
      fullName: 'Demo User'
    };
    this.usersData.set(demoUser.id, demoUser);
    
    // Add some demo projects
    const projects = [
      { name: 'Work Tasks', description: 'Professional tasks and deadlines', color: '#6366f1', userId: demoUser.id },
      { name: 'Personal', description: 'Personal errands and tasks', color: '#10b981', userId: demoUser.id },
      { name: 'Learning', description: 'Educational goals and courses', color: '#f59e0b', userId: demoUser.id }
    ];
    
    projects.forEach(project => {
      this.createProject({
        name: project.name,
        description: project.description,
        color: project.color,
        userId: project.userId
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }

  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasksData.values()).filter(
      task => task.userId === userId
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksData.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now
    };
    this.tasksData.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasksData.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasksData.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasksData.delete(id);
  }

  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projectsData.values()).filter(
      project => project.userId === userId
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsData.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now
    };
    this.projectsData.set(id, project);
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projectsData.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectUpdate };
    this.projectsData.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projectsData.delete(id);
  }

  // Dashboard stats
  async getTaskStats(userId: number): Promise<{ total: number; completed: number; pending: number; overdue: number; }> {
    const userTasks = await this.getTasks(userId);
    const now = new Date();
    
    const total = userTasks.length;
    const completed = userTasks.filter(task => task.completed).length;
    const pending = userTasks.filter(task => !task.completed).length;
    const overdue = userTasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < now
    ).length;
    
    return { total, completed, pending, overdue };
  }
}

export const storage = new MemStorage();
