import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { deals as dealsTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  insertUserSchema,
  insertLeadSchema,
  insertPropertySchema,
  insertDealSchema,
  insertTaskSchema,
  insertMessageSchema,
  insertDocumentSchema,
  insertActivitySchema,
} from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key";
const upload = multer({ dest: "uploads/" });

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token, user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token, user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ error: "Failed to get user" });
    }
  });

  // Lead routes
  app.get("/api/leads", authenticateToken, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", authenticateToken, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", authenticateToken, async (req: any, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(data);
      
      await storage.createActivity({
        type: "lead",
        userId: req.user.id,
        action: "created lead",
        target: lead.name,
        metadata: { leadId: lead.id },
      });

      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", authenticateToken, async (req: any, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      
      await storage.createActivity({
        type: "lead",
        userId: req.user.id,
        action: "updated lead",
        target: lead.name,
        metadata: { leadId: lead.id },
      });

      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete lead" });
    }
  });

  // Property routes
  app.get("/api/properties", authenticateToken, async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", authenticateToken, async (req: any, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      
      await storage.createActivity({
        type: "property",
        userId: req.user.id,
        action: "added property",
        target: property.title,
        metadata: { propertyId: property.id },
      });

      res.json(property);
    } catch (error) {
      res.status(400).json({ error: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", authenticateToken, async (req: any, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, req.body);
      
      await storage.createActivity({
        type: "property",
        userId: req.user.id,
        action: "updated property",
        target: property.title,
        metadata: { propertyId: property.id },
      });

      res.json(property);
    } catch (error) {
      res.status(400).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", authenticateToken, async (req: any, res) => {
    try {
      const propertyId = req.params.id;
      
      // First, delete all related deals that reference this property
      const deals = await storage.getAllDeals();
      const relatedDeals = deals.filter(deal => deal.propertyId === propertyId);
      for (const deal of relatedDeals) {
        await db.delete(dealsTable).where(eq(dealsTable.id, deal.id));
      }
      
      // Delete all related tasks
      const tasks = await storage.getAllTasks();
      const relatedTasks = tasks.filter(task => task.relatedPropertyId === propertyId);
      for (const task of relatedTasks) {
        await storage.deleteTask(task.id);
      }
      
      // Delete all related documents
      const documents = await storage.getDocumentsByProperty(propertyId);
      for (const doc of documents) {
        await storage.deleteDocument(doc.id);
      }
      
      // Finally, delete the property itself
      await storage.deleteProperty(propertyId);
      
      await storage.createActivity({
        type: "property",
        userId: req.user.id,
        action: "deleted property",
        target: propertyId,
        metadata: { propertyId },
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(400).json({ error: "Failed to delete property" });
    }
  });

  // Deal routes
  app.get("/api/deals", authenticateToken, async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", authenticateToken, async (req: any, res) => {
    try {
      const data = insertDealSchema.parse(req.body);
      
      // Calculate commission if not provided
      if (!data.commissionAmount && data.offerAmount && data.commissionRate) {
        const commissionAmount = (parseFloat(data.offerAmount) * parseFloat(data.commissionRate)) / 100;
        data.commissionAmount = commissionAmount.toString();
      }

      const deal = await storage.createDeal(data);
      
      await storage.createActivity({
        type: "deal",
        userId: req.user.id,
        action: "created deal",
        target: `Deal #${deal.id.slice(0, 8)}`,
        metadata: { dealId: deal.id },
      });

      res.json(deal);
    } catch (error) {
      res.status(400).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", authenticateToken, async (req: any, res) => {
    try {
      const deal = await storage.updateDeal(req.params.id, req.body);
      
      await storage.createActivity({
        type: "deal",
        userId: req.user.id,
        action: "updated deal",
        target: `Deal #${deal.id.slice(0, 8)}`,
        metadata: { dealId: deal.id },
      });

      res.json(deal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update deal" });
    }
  });

  // Task routes
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, async (req: any, res) => {
    try {
      const data = insertTaskSchema.parse({ ...req.body, createdBy: req.user.id });
      const task = await storage.createTask(data);
      
      await storage.createActivity({
        type: "task",
        userId: req.user.id,
        action: "created task",
        target: task.title,
        metadata: { taskId: task.id },
      });

      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete task" });
    }
  });

  // Message routes
  app.get("/api/messages/:conversationId", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getMessagesByConversation(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to create message" });
    }
  });

  // Document routes
  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", authenticateToken, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      const document = await storage.createDocument({
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024).toFixed(2)} KB`,
        fileType: req.file.mimetype,
        fileUrl,
        uploadedBy: req.user.id,
        relatedLeadId: req.body.relatedLeadId || null,
        relatedPropertyId: req.body.relatedPropertyId || null,
        relatedDealId: req.body.relatedDealId || null,
      });

      await storage.createActivity({
        type: "document",
        userId: req.user.id,
        action: "uploaded document",
        target: req.file.originalname,
        metadata: { documentId: document.id },
      });

      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (document) {
        const filePath = path.join(process.cwd(), document.fileUrl);
        await fs.unlink(filePath).catch(() => {});
      }
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete document" });
    }
  });

  // Property image upload route
  app.post("/api/properties/upload-images", authenticateToken, upload.array("images", 10), async (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const imageUrls: string[] = [];
      const publicDir = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '/tmp/public';
      
      // Ensure public directory exists
      try {
        await fs.mkdir(publicDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      for (const file of req.files) {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        const filename = `property-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const destPath = path.join(publicDir, filename);
        
        // Move file from temp upload to public storage
        await fs.rename(file.path, destPath);
        
        // Create public URL using Replit domain
        const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
        const replId = process.env.REPL_ID || '';
        const replOwner = process.env.REPL_OWNER || '';
        const replSlug = process.env.REPL_SLUG || '';
        
        // Generate Replit object storage URL
        const publicUrl = `https://${replId}.${replOwner}.repl.co/objstore/${bucketId}/public/${filename}`;
        imageUrls.push(publicUrl);
      }

      res.json({ imageUrls });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(400).json({ error: "Failed to upload images" });
    }
  });

  // Activity routes
  app.get("/api/activities", authenticateToken, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch activities" });
    }
  });

  // Dashboard analytics routes
  app.get("/api/analytics/dashboard", authenticateToken, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const properties = await storage.getAllProperties();
      const deals = await storage.getAllDeals();
      const tasks = await storage.getAllTasks();

      const closedDeals = deals.filter(d => d.status === "closed");
      const totalRevenue = closedDeals.reduce((sum, deal) => {
        return sum + parseFloat(deal.commissionAmount || "0");
      }, 0);

      res.json({
        totalLeads: leads.length,
        activeProperties: properties.filter(p => p.status === "available").length,
        monthlyRevenue: totalRevenue,
        dealsClosed: closedDeals.length,
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch analytics" });
    }
  });

  // User management routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      const user = await storage.updateUser(req.params.id, updateData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
