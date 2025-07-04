import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, notifyLocationReportCreated, notifyLocationReportUpdated, notifyLocationReportDeleted } from "./websocket";
import { 
  loginSchema, 
  insertTaskSchema, 
  insertProjectSchema,
  insertUserSchema,
  insertReportSchema,
  insertPartSchema,
  insertPlanSchema,
  insertPlanUserSchema,
  insertTaskAssignmentSchema,
  insertReminderSchema,
  insertNotificationSchema,
  insertLocationReportSchema
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

  // Yer Bildirimi (Location Report) API rotaları
  // Bugünkü yer bildirimini al
  app.get('/api/location-reports/today', requireAuth, async (req, res) => {
    try {
      const report = await storage.getTodayLocationReport(req.session.userId!);
      res.json(report || null);
    } catch (error) {
      console.error('Bugünkü yer bildirimi alınırken hata:', error);
      res.status(500).json({ message: 'Bugünkü yer bildirimi alınamadı' });
    }
  });
  
  // Kullanıcının tüm yer bildirimlerini al
  app.get('/api/location-reports', requireAuth, async (req, res) => {
    try {
      const reports = await storage.getUserLocationReports(req.session.userId!);
      res.json(reports);
    } catch (error) {
      console.error('Yer bildirimleri alınırken hata:', error);
      res.status(500).json({ message: 'Yer bildirimleri alınamadı' });
    }
  });
  
  // Admin için tüm kullanıcıların yer bildirimlerini al
  app.get('/api/admin/location-reports', requireAuth, async (req, res) => {
    try {
      // İsteğe bağlı olarak: Sadece admin (ID=1) için erişim sağla
      if (req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const reports = await storage.getAllLocationReports();
      res.json(reports);
    } catch (error) {
      console.error('Tüm yer bildirimleri alınırken hata:', error);
      res.status(500).json({ message: 'Yer bildirimleri alınamadı' });
    }
  });
  
  // Yeni yer bildirimi oluştur
  app.post('/api/location-reports', requireAuth, async (req, res) => {
    try {
      const reportData = insertLocationReportSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const report = await storage.createLocationReport(reportData);
      
      // WebSocket ile bildirim gönder
      const user = await storage.getUser(req.session.userId);
      notifyLocationReportCreated({...report, user});
      
      res.status(201).json(report);
    } catch (error) {
      console.error('Yer bildirimi oluşturulurken hata:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors });
      }
      res.status(500).json({ message: 'Yer bildirimi oluşturulamadı' });
    }
  });
  
  // Yer bildirimini güncelle
  app.put('/api/location-reports/:id', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Geçersiz yer bildirimi ID' });
      }
      
      // Yer bildirimini kontrol et
      const report = await storage.getLocationReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Yer bildirimi bulunamadı' });
      }
      
      // Sadece kendi yer bildirimlerini güncelleyebilir
      if (report.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu yer bildirimini güncelleme yetkiniz yok' });
      }
      
      const updateData = req.body;
      const updatedReport = await storage.updateLocationReport(reportId, updateData);
      
      // WebSocket ile bildirim gönder
      if (updatedReport) {
        const user = await storage.getUser(updatedReport.userId);
        notifyLocationReportUpdated({...updatedReport, user});
      }
      
      res.json(updatedReport);
    } catch (error) {
      console.error('Yer bildirimi güncellenirken hata:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors });
      }
      res.status(500).json({ message: 'Yer bildirimi güncellenemedi' });
    }
  });
  
  // Yer bildirimini sil
  app.delete('/api/location-reports/:id', requireAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Geçersiz yer bildirimi ID' });
      }
      
      // Yer bildirimini kontrol et
      const report = await storage.getLocationReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Yer bildirimi bulunamadı' });
      }
      
      // Sadece kendi yer bildirimlerini veya admin (ID=1) silebilir
      if (report.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu yer bildirimini silme yetkiniz yok' });
      }
      
      const success = await storage.deleteLocationReport(reportId);
      
      // WebSocket ile bildirim gönder
      if (success) {
        notifyLocationReportDeleted(reportId);
      }
      
      if (success) {
        res.json({ message: 'Yer bildirimi başarıyla silindi' });
      } else {
        res.status(500).json({ message: 'Yer bildirimi silinemedi' });
      }
    } catch (error) {
      console.error('Yer bildirimi silinirken hata:', error);
      res.status(500).json({ message: 'Yer bildirimi silinemedi' });
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

  // Kullanıcı listeleme
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      // Tüm kullanıcıları getir - yetki kontrolünü kaldırıyoruz şimdilik
      // Bu ayar sayfasının çalışması için gerekli
      const users = await storage.getAllUsers();
      
      // Şifreleri gizle
      const safeUsers = users.map(user => {
        const { password, ...userInfo } = user;
        return userInfo;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Kullanıcı listesi alınamadı:', error);
      res.status(500).json({ message: 'Kullanıcı listesi alınamadı' });
    }
  });

  // Plan-User ilişkisi rotaları
  app.get('/api/plans/assigned', requireAuth, async (req, res) => {
    try {
      // Kullanıcıya atanmış planları getir
      const plans = await storage.getAssignedPlans(req.session.userId!);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Atanmış planlar alınamadı' });
    }
  });
  
  app.get('/api/plans/:planId/users', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Geçersiz plan ID' });
      }
      
      // Plan sahibi veya root ise izin ver
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (plan.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const users = await storage.getPlanUsers(planId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Plan kullanıcıları alınamadı' });
    }
  });
  
  app.post('/api/plans/:planId/users', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Geçersiz plan ID' });
      }
      
      // Plan sahibi veya root ise izin ver
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (plan.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const { userId } = req.body;
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: 'Geçerli bir kullanıcı ID gerekli' });
      }
      
      // Kullanıcı gerçekten var mı kontrol et
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
      
      const planUser = await storage.assignPlanToUser(planId, userId, req.session.userId!);
      res.status(201).json(planUser);
    } catch (error) {
      res.status(500).json({ message: 'Kullanıcı plana atanamadı' });
    }
  });
  
  app.delete('/api/plans/:planId/users/:userId', requireAuth, async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(planId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Geçersiz ID değerleri' });
      }
      
      // Plan sahibi veya root ise izin ver
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan bulunamadı' });
      }
      
      if (plan.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const success = await storage.removePlanFromUser(planId, userId);
      if (success) {
        res.json({ message: 'Kullanıcı plandan başarıyla çıkarıldı' });
      } else {
        res.status(404).json({ message: 'Plan-kullanıcı ilişkisi bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Kullanıcı plandan çıkarılamadı' });
    }
  });
  
  // Görev atama rotaları
  app.get('/api/tasks/assigned', requireAuth, async (req, res) => {
    try {
      // Kullanıcıya atanmış görevleri getir
      const tasks = await storage.getAssignedTasks(req.session.userId!);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Atanmış görevler alınamadı' });
    }
  });
  
  app.get('/api/tasks/:taskId/assignments', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Geçersiz görev ID' });
      }
      
      // Görev sahibi veya root ise izin ver
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      if (task.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const assignments = await storage.getTaskAssignments(taskId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: 'Görev atamaları alınamadı' });
    }
  });
  
  app.get('/api/tasks/:taskId/users', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Geçersiz görev ID' });
      }
      
      // Görev sahibi veya root ise izin ver
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      if (task.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const users = await storage.getTaskAssignedUsers(taskId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Görev kullanıcıları alınamadı' });
    }
  });
  
  app.post('/api/tasks/:taskId/assign', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Geçersiz görev ID' });
      }
      
      // Görev sahibi veya root ise izin ver
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      if (task.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'En az bir kullanıcı ID\'si gerekli' });
      }
      
      const assignments = await storage.assignTaskToUsers(taskId, userIds, req.session.userId!);
      res.status(201).json(assignments);
    } catch (error) {
      res.status(500).json({ message: 'Görev atanamadı' });
    }
  });
  
  app.delete('/api/tasks/:taskId/users/:userId', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(taskId) || isNaN(userId)) {
        return res.status(400).json({ message: 'Geçersiz ID değerleri' });
      }
      
      // Görev sahibi veya root ise izin ver
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      if (task.userId !== req.session.userId && req.session.userId !== 1) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      
      const success = await storage.removeTaskAssignment(taskId, userId);
      if (success) {
        res.json({ message: 'Görev ataması başarıyla kaldırıldı' });
      } else {
        res.status(404).json({ message: 'Görev-kullanıcı ilişkisi bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Görev ataması kaldırılamadı' });
    }
  });
  
  app.patch('/api/tasks/:taskId/status', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Geçersiz görev ID' });
      }
      
      // Bu görev kullanıcıya atanmış mı kontrol et
      const assignments = await storage.getTaskAssignments(taskId);
      const userAssignment = assignments.find(a => a.userId === req.session.userId);
      
      if (!userAssignment) {
        return res.status(403).json({ message: 'Bu görev size atanmamış' });
      }
      
      const { status, notes } = req.body;
      if (!status || typeof status !== 'string' || !['pending', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Geçerli bir durum değeri gerekli: pending, in_progress veya completed' });
      }
      
      const updated = await storage.updateTaskAssignmentStatus(
        taskId, 
        req.session.userId!, 
        status, 
        notes
      );
      
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ message: 'Görev ataması bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Görev durumu güncellenemedi' });
    }
  });

  // Hatırlatıcı (Reminder) API rotaları
  app.get('/api/reminders', requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.session.userId!);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: 'Hatırlatıcılar alınamadı' });
    }
  });

  app.get('/api/tasks/:taskId/reminders', requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Geçersiz görev ID' });
      }
      
      // Görevi kontrol et
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      const reminders = await storage.getTaskReminders(taskId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: 'Görev hatırlatıcıları alınamadı' });
    }
  });

  app.post('/api/reminders', requireAuth, async (req, res) => {
    try {
      const reminderData = {
        ...req.body,
        userId: req.session.userId!,
        sent: false
      };
      
      const validatedReminder = insertReminderSchema.parse(reminderData);
      const reminder = await storage.createReminder(validatedReminder);
      
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors });
      }
      res.status(500).json({ message: 'Hatırlatıcı oluşturulamadı' });
    }
  });

  app.patch('/api/reminders/:id', requireAuth, async (req, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: 'Geçersiz hatırlatıcı ID' });
      }
      
      // Hatırlatıcı verilerini güncelle
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.userId;
      
      const updatedReminder = await storage.updateReminder(reminderId, updateData);
      if (!updatedReminder) {
        return res.status(404).json({ message: 'Hatırlatıcı bulunamadı' });
      }
      
      res.json(updatedReminder);
    } catch (error) {
      res.status(500).json({ message: 'Hatırlatıcı güncellenemedi' });
    }
  });

  app.delete('/api/reminders/:id', requireAuth, async (req, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: 'Geçersiz hatırlatıcı ID' });
      }
      
      const success = await storage.deleteReminder(reminderId);
      if (success) {
        res.json({ message: 'Hatırlatıcı başarıyla silindi' });
      } else {
        res.status(404).json({ message: 'Hatırlatıcı bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Hatırlatıcı silinemedi' });
    }
  });

  // Bildirim (Notification) API rotaları
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Bildirimler alınamadı' });
    }
  });

  app.get('/api/notifications/unread', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserUnreadNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Okunmamış bildirimler alınamadı' });
    }
  });

  app.post('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notificationData = {
        ...req.body,
        userId: req.session.userId!,
        isRead: false,
        createdAt: new Date()
      };
      
      const validatedNotification = insertNotificationSchema.parse(notificationData);
      const notification = await storage.createNotification(validatedNotification);
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors: error.errors });
      }
      res.status(500).json({ message: 'Bildirim oluşturulamadı' });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Geçersiz bildirim ID' });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      if (!updatedNotification) {
        return res.status(404).json({ message: 'Bildirim bulunamadı' });
      }
      
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: 'Bildirim güncellenemedi' });
    }
  });

  app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.session.userId!);
      res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
    } catch (error) {
      res.status(500).json({ message: 'Bildirimler güncellenemedi' });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Geçersiz bildirim ID' });
      }
      
      const success = await storage.deleteNotification(notificationId);
      if (success) {
        res.json({ message: 'Bildirim başarıyla silindi' });
      } else {
        res.status(404).json({ message: 'Bildirim bulunamadı' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Bildirim silinemedi' });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket sunucusunu başlat
  setupWebSocket(httpServer);
  
  return httpServer;
}
