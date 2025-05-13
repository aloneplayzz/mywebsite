import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { setupWebsockets } from "./websocket";
import { 
  insertChatroomSchema, 
  insertChatroomMemberSchema, 
  insertPersonaSchema, 
  insertPersonaCategorySchema,
  insertAttachmentSchema
} from "@shared/schema";
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
        createdBy: req.user.id
      });

      const chatroom = await storage.createChatroom(validatedData);
      
      // Automatically add the creator as an owner
      await storage.addChatroomMember(chatroom.id, req.user.id, 'owner');
      
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
  
  // API route for starring messages
  app.patch("/api/messages/:id/star", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const { isStarred } = req.body;
      if (typeof isStarred !== 'boolean') {
        return res.status(400).json({ message: "isStarred must be a boolean" });
      }
      
      const message = await storage.starMessage(messageId, isStarred);
      res.json(message);
    } catch (error) {
      console.error("Error starring message:", error);
      res.status(500).json({ message: "Failed to star message" });
    }
  });
  
  // API routes for attachments
  app.post("/api/messages/:id/attachments", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      try {
        const attachmentData = insertAttachmentSchema.parse({
          ...req.body,
          messageId,
        });
        
        const attachment = await storage.createAttachment(attachmentData);
        res.status(201).json(attachment);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Invalid attachment data", 
            errors: error.errors 
          });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });
  
  app.get("/api/messages/:id/attachments", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const attachments = await storage.getAttachmentsByMessageId(messageId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });
  
  // Chatroom members API
  app.get("/api/chatrooms/:id/members", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }

      const chatroom = await storage.getChatroom(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }

      const members = await storage.getChatroomMembers(chatroomId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chatroom members:", error);
      res.status(500).json({ message: "Failed to fetch chatroom members" });
    }
  });
  
  app.get("/api/chatrooms/:id/members/:userId", async (req, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }

      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const member = await storage.getChatroomMember(chatroomId, userId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching chatroom member:", error);
      res.status(500).json({ message: "Failed to fetch chatroom member" });
    }
  });
  
  app.post("/api/chatrooms/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }
      
      const chatroom = await storage.getChatroom(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      // Only chatroom owner or moderator can add members with specific roles
      if (req.body.role && req.body.role !== 'member') {
        const isOwnerOrMod = await storage.isChatroomModerator(chatroomId, req.user.claims.sub);
        if (!isOwnerOrMod) {
          return res.status(403).json({ message: "You don't have permission to add members with this role" });
        }
      }
      
      const validatedData = insertChatroomMemberSchema.parse({
        chatroomId,
        userId: req.body.userId,
        role: req.body.role || 'member'
      });
      
      const member = await storage.addChatroomMember(validatedData.chatroomId, validatedData.userId, validatedData.role);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding chatroom member:", error);
      res.status(500).json({ message: "Failed to add chatroom member" });
    }
  });
  
  app.patch("/api/chatrooms/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }
      
      const chatroom = await storage.getChatroom(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      // Only chatroom owner can change roles to owner
      // Only chatroom owner or moderator can update member roles
      if (req.body.role === 'owner') {
        const isOwner = await storage.isChatroomOwner(chatroomId, req.user.claims.sub);
        if (!isOwner) {
          return res.status(403).json({ message: "Only the chatroom owner can assign ownership" });
        }
      } else {
        const isOwnerOrMod = await storage.isChatroomModerator(chatroomId, req.user.claims.sub);
        if (!isOwnerOrMod) {
          return res.status(403).json({ message: "You don't have permission to change member roles" });
        }
      }
      
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['owner', 'moderator', 'member'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const member = await storage.updateChatroomMemberRole(chatroomId, userId, role);
      res.json(member);
    } catch (error) {
      console.error("Error updating chatroom member:", error);
      res.status(500).json({ message: "Failed to update chatroom member" });
    }
  });
  
  app.delete("/api/chatrooms/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const chatroomId = parseInt(req.params.id);
      if (isNaN(chatroomId)) {
        return res.status(400).json({ message: "Invalid chatroom ID" });
      }
      
      const chatroom = await storage.getChatroom(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      const { userId } = req.params;
      
      // Users can remove themselves, or mods/owners can remove others
      if (userId !== req.user.claims.sub) {
        const isOwnerOrMod = await storage.isChatroomModerator(chatroomId, req.user.claims.sub);
        if (!isOwnerOrMod) {
          return res.status(403).json({ message: "You don't have permission to remove members" });
        }
        
        // Cannot remove owners if you're a moderator
        const memberToRemove = await storage.getChatroomMember(chatroomId, userId);
        if (memberToRemove?.role === 'owner' && !await storage.isChatroomOwner(chatroomId, req.user.claims.sub)) {
          return res.status(403).json({ message: "Moderators cannot remove owners" });
        }
      }
      
      await storage.removeChatroomMember(chatroomId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing chatroom member:", error);
      res.status(500).json({ message: "Failed to remove chatroom member" });
    }
  });

  // User API routes
  app.get('/api/auth/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSockets
  setupWebsockets(httpServer);

  return httpServer;
}
