import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertTaskSchema, 
  insertProjectSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  const SessionStore = MemoryStore(session);
  app.use(session({
    store: new SessionStore({ checkPeriod: 86400000 }), // prune expired entries every 24h
    secret: process.env.SESSION_SECRET || 'taskmaster-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Return user info without password
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const newUser = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(newUser.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(newUser);
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Return user info without password
      const { password, ...userInfo } = user;
      res.status(201).json(userInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user info without password
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user information' });
    }
  });

  // Task routes
  app.get('/api/tasks', requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.session.userId!);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Ensure user can only access their own tasks
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch task' });
    }
  });

  app.post('/api/tasks', requireAuth, async (req, res) => {
    try {
      // Set userId from session
      const taskData = { ...req.body, userId: req.session.userId! };
      const validatedTask = insertTaskSchema.parse(taskData);
      
      const task = await storage.createTask(validatedTask);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      
      // Check if task exists and belongs to user
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Parse update data
      const updateData = { ...req.body };
      delete updateData.id; // Don't allow updating ID
      delete updateData.userId; // Don't allow changing owner
      
      const updatedTask = await storage.updateTask(taskId, updateData);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      
      // Check if task exists and belongs to user
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const success = await storage.deleteTask(taskId);
      if (success) {
        res.json({ message: 'Task deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete task' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete task' });
    }
  });

  // Project routes
  app.get('/api/projects', requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.session.userId!);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Ensure user can only access their own projects
      if (project.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', requireAuth, async (req, res) => {
    try {
      // Set userId from session
      const projectData = { ...req.body, userId: req.session.userId! };
      const validatedProject = insertProjectSchema.parse(projectData);
      
      const project = await storage.createProject(validatedProject);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create project' });
    }
  });

  app.patch('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Check if project exists and belongs to user
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Parse update data
      const updateData = { ...req.body };
      delete updateData.id; // Don't allow updating ID
      delete updateData.userId; // Don't allow changing owner
      
      const updatedProject = await storage.updateProject(projectId, updateData);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Check if project exists and belongs to user
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const success = await storage.deleteProject(projectId);
      if (success) {
        res.json({ message: 'Project deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete project' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getTaskStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
