import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertTaskSchema, 
  insertProjectSchema,
  insertUserSchema,
  insertReportSchema,
  insertPartSchema,
  insertPlanSchema
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
      console.log('Login attempt:', req.body);
      const credentials = loginSchema.parse(req.body);
      console.log('Parsed credentials:', credentials);
      
      const user = await storage.getUserByUsername(credentials.username);
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user || user.password !== credentials.password) {
        console.log('Password check failed');
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      console.log('Session set with userId:', user.id);
      
      // Return user info without password
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error('Login error:', error);
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

  // Report routes
  app.get('/api/reports', requireAuth, async (req, res) => {
    try {
      const reports = await storage.getReports(req.session.userId!);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Ensure user can only access their own reports
      if (report.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch report' });
    }
  });

  app.post('/api/reports', requireAuth, async (req, res) => {
    try {
      // Set userId from session
      const reportData = { ...req.body, userId: req.session.userId! };
      const validatedReport = insertReportSchema.parse(reportData);
      
      const report = await storage.createReport(validatedReport);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create report' });
    }
  });

  app.patch('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      // Check if report exists and belongs to user
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Parse update data
      const updateData = { ...req.body };
      delete updateData.id; // Don't allow updating ID
      delete updateData.userId; // Don't allow changing owner
      
      const updatedReport = await storage.updateReport(reportId, updateData);
      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update report' });
    }
  });

  app.delete('/api/reports/:id', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      // Check if report exists and belongs to user
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const success = await storage.deleteReport(reportId);
      if (success) {
        res.json({ message: 'Report deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete report' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete report' });
    }
  });

  app.post('/api/reports/:id/send', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      // Check if report exists and belongs to user
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Validate email
      const { emailTo } = req.body;
      if (!emailTo || typeof emailTo !== 'string' || !emailTo.includes('@')) {
        return res.status(400).json({ message: 'Valid email address is required' });
      }
      
      const success = await storage.sendReport(reportId, emailTo);
      if (success) {
        res.json({ message: 'Report sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send report' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to send report' });
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

  // Parça API rotaları
  app.get('/api/parts', requireAuth, async (req, res) => {
    try {
      const parts = await storage.getParts(req.session.userId!);
      res.json(parts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      res.status(500).json({ message: 'Parçalar alınırken hata oluştu' });
    }
  });

  app.get('/api/parts/:id', requireAuth, async (req, res) => {
    try {
      const partId = parseInt(req.params.id);
      if (isNaN(partId)) {
        return res.status(400).json({ message: 'Geçersiz parça ID' });
      }
      
      const part = await storage.getPart(partId);
      
      if (!part) {
        return res.status(404).json({ message: 'Parça bulunamadı' });
      }
      
      if (part.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu parçayı görüntüleme yetkiniz yok' });
      }
      
      res.json(part);
    } catch (error) {
      console.error('Error fetching part:', error);
      res.status(500).json({ message: 'Parça alınırken hata oluştu' });
    }
  });

  app.post('/api/parts', requireAuth, async (req, res) => {
    try {
      const partData = insertPartSchema.parse(req.body);
      
      // Parça numarası benzersiz olmalı
      const existingPart = await storage.getPartByPartNumber(partData.partNumber);
      if (existingPart) {
        return res.status(400).json({ message: 'Bu parça numarası zaten kullanılıyor' });
      }

      // QR kod oluştur
      const QRCode = await import('qrcode');
      const qrCodeData = JSON.stringify({
        partNumber: partData.partNumber,
        name: partData.name,
        id: Date.now() // geçici ID, veritabanına kaydedilirken güncellenir
      });
      
      // QR kod base64 olarak oluştur
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);
      
      // Parçayı userId ile ekle
      const part = await storage.createPart({
        ...partData,
        userId: req.session.userId!
      }, qrCodeImage);
      
      res.status(201).json(part);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Geçersiz veri formatı', errors: error.errors });
      }
      console.error('Error creating part:', error);
      res.status(500).json({ message: 'Parça eklenirken hata oluştu' });
    }
  });

  app.put('/api/parts/:id', requireAuth, async (req, res) => {
    try {
      const partId = parseInt(req.params.id);
      if (isNaN(partId)) {
        return res.status(400).json({ message: 'Geçersiz parça ID' });
      }
      
      const existingPart = await storage.getPart(partId);
      
      if (!existingPart) {
        return res.status(404).json({ message: 'Parça bulunamadı' });
      }
      
      if (existingPart.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu parçayı düzenleme yetkiniz yok' });
      }

      const partData = insertPartSchema.partial().parse(req.body);
      
      // Parça numarası değişiyorsa, benzersiz olmalı
      if (partData.partNumber && partData.partNumber !== existingPart.partNumber) {
        const duplicatePart = await storage.getPartByPartNumber(partData.partNumber);
        if (duplicatePart) {
          return res.status(400).json({ message: 'Bu parça numarası zaten kullanılıyor' });
        }
      }
      
      // QR kodu güncelle, parça numarası değiştiyse
      let qrCodeImage = existingPart.qrCode;
      if (partData.partNumber && partData.partNumber !== existingPart.partNumber) {
        const QRCode = await import('qrcode');
        const qrCodeData = JSON.stringify({
          partNumber: partData.partNumber,
          name: partData.name || existingPart.name,
          id: existingPart.id
        });
        
        // QR kod base64 olarak oluştur
        qrCodeImage = await QRCode.toDataURL(qrCodeData);
      }
      
      const updatedPart = await storage.updatePart(partId, {
        ...partData,
        qrCode: qrCodeImage
      });
      
      res.json(updatedPart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Geçersiz veri formatı', errors: error.errors });
      }
      console.error('Error updating part:', error);
      res.status(500).json({ message: 'Parça güncellenirken hata oluştu' });
    }
  });

  app.delete('/api/parts/:id', requireAuth, async (req, res) => {
    try {
      const partId = parseInt(req.params.id);
      if (isNaN(partId)) {
        return res.status(400).json({ message: 'Geçersiz parça ID' });
      }
      
      const existingPart = await storage.getPart(partId);
      
      if (!existingPart) {
        return res.status(404).json({ message: 'Parça bulunamadı' });
      }
      
      if (existingPart.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu parçayı silme yetkiniz yok' });
      }
      
      const deleted = await storage.deletePart(partId);
      
      if (deleted) {
        res.json({ message: 'Parça başarıyla silindi' });
      } else {
        res.status(500).json({ message: 'Parça silinirken bir hata oluştu' });
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      res.status(500).json({ message: 'Parça silinirken hata oluştu' });
    }
  });
  
  // Plan routes
  app.get('/api/plans', requireAuth, async (req, res) => {
    try {
      const plans = await storage.getPlans(req.session.userId!);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: 'Planlar alınırken hata oluştu' });
    }
  });
  
  app.get('/api/plans/:id', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Geçersiz plan ID' });
      }
      
      const plan = await storage.getPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (plan.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu planı görüntüleme yetkiniz yok' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ message: 'Plan alınırken hata oluştu' });
    }
  });
  
  app.post('/api/plans', requireAuth, async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      
      // Kullanıcı ID'sini ekle
      const plan = await storage.createPlan({
        ...planData,
        userId: req.session.userId!
      });
      
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Geçersiz veri formatı', errors: error.errors });
      }
      console.error('Error creating plan:', error);
      res.status(500).json({ message: 'Plan eklenirken hata oluştu' });
    }
  });
  
  app.put('/api/plans/:id', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Geçersiz plan ID' });
      }
      
      const existingPlan = await storage.getPlan(planId);
      
      if (!existingPlan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (existingPlan.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu planı düzenleme yetkiniz yok' });
      }
      
      const planData = insertPlanSchema.partial().parse(req.body);
      const updatedPlan = await storage.updatePlan(planId, planData);
      
      res.json(updatedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Geçersiz veri formatı', errors: error.errors });
      }
      console.error('Error updating plan:', error);
      res.status(500).json({ message: 'Plan güncellenirken hata oluştu' });
    }
  });
  
  app.delete('/api/plans/:id', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Geçersiz plan ID' });
      }
      
      const existingPlan = await storage.getPlan(planId);
      
      if (!existingPlan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (existingPlan.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Bu planı silme yetkiniz yok' });
      }
      
      const result = await storage.deletePlan(planId);
      if (result) {
        res.status(200).json({ message: 'Plan başarıyla silindi' });
      } else {
        res.status(500).json({ message: 'Plan silinirken bir hata oluştu' });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ message: 'Plan silinirken hata oluştu' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
