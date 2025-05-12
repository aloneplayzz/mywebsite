import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { ZodError } from "zod";
import { 
  insertChatroomSchema, 
  insertMessageSchema,
  insertPersonaSchema,
  Chatroom,
  Message,
  Persona
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes
  app.get("/api/chatrooms", async (req, res) => {
    try {
      const chatrooms = await storage.getChatrooms();
      res.json(chatrooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  app.get("/api/chatrooms/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const chatroom = await storage.getChatroom(roomId);
      
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      res.json(chatroom);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chatroom" });
    }
  });

  app.post("/api/chatrooms", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const chatroomData = insertChatroomSchema.parse({
        ...req.body,
        created_by: req.user.id
      });
      
      const chatroom = await storage.createChatroom(chatroomData);
      res.status(201).json(chatroom);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid chatroom data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  });

  app.get("/api/personas", async (req, res) => {
    try {
      const personas = await storage.getPersonas();
      res.json(personas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personas" });
    }
  });

  app.post("/api/personas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const personaData = insertPersonaSchema.parse(req.body);
      const persona = await storage.createPersona(personaData);
      res.status(201).json(persona);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid persona data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create persona" });
    }
  });

  app.get("/api/chatrooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessages(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chatrooms/:roomId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const roomId = parseInt(req.params.roomId);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        room_id: roomId,
        user_id: req.user.id
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);

  return httpServer;
}
