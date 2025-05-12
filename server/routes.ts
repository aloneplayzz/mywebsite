import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebsockets } from "./websocket";
import { insertChatroomSchema, insertPersonaSchema, insertPersonaCategorySchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes with Replit OAuth
  await setupAuth(app);

  // API routes for chatrooms
  app.get("/api/chatrooms", async (req, res) => {
    try {
      const chatrooms = await storage.getChatrooms();
      res.json(chatrooms);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  app.get("/api/chatrooms/:id", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }

      const chatroom = await storage.getChatroom(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }

      const activeUsers = storage.getActiveUsers(chatroomId);
      res.json({
        ...chatroom,
        activeUsers: activeUsers.length
      });
    } catch (error) {
      console.error("Error fetching chatroom:", error);
      res.status(500).json({ message: "Failed to fetch chatroom" });
    }
  });

  app.post("/api/chatrooms", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertChatroomSchema.parse({
        ...req.body,
        createdBy: parseInt(req.user.claims.sub) || 0
      });

      const chatroom = await storage.createChatroom(validatedData);
      res.status(201).json(chatroom);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating chatroom:", error);
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  });

  // API routes for persona categories
  app.get("/api/persona-categories", async (req, res) => {
    try {
      const categories = await storage.getPersonaCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching persona categories:", error);
      res.status(500).json({ message: "Failed to fetch persona categories" });
    }
  });

  app.post("/api/persona-categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPersonaCategorySchema.parse(req.body);
      const category = await storage.createPersonaCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating persona category:", error);
      res.status(500).json({ message: "Failed to create persona category" });
    }
  });

  // API routes for personas
  app.get("/api/personas", async (req, res) => {
    try {
      const personas = await storage.getPersonas();
      res.json(personas);
    } catch (error) {
      console.error("Error fetching personas:", error);
      res.status(500).json({ message: "Failed to fetch personas" });
    }
  });

  app.post("/api/personas", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPersonaSchema.parse(req.body);
      const persona = await storage.createPersona(validatedData);
      res.status(201).json(persona);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating persona:", error);
      res.status(500).json({ message: "Failed to create persona" });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      if (isNaN(personaId)) {
        return res.status(400).json({ message: "Invalid persona ID" });
      }

      const persona = await storage.getPersona(personaId);
      if (!persona) {
        return res.status(404).json({ message: "Persona not found" });
      }

      res.json(persona);
    } catch (error) {
      console.error("Error fetching persona:", error);
      res.status(500).json({ message: "Failed to fetch persona" });
    }
  });

  // API routes for messages
  app.get("/api/chatrooms/:id/messages", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessagesByRoom(chatroomId, limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSockets
  setupWebsockets(httpServer);

  return httpServer;
}
