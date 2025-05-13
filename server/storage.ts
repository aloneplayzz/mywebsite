import { 
  users, insertUserSchema,
  chatrooms, insertChatroomSchema,
  chatroomMembers, insertChatroomMemberSchema,
  personas, insertPersonaSchema,
  personaCategories, insertPersonaCategorySchema,
  messages, insertMessageSchema,
  attachments, insertAttachmentSchema,
  sessions,
  User, InsertUser, 
  Chatroom, InsertChatroom, 
  ChatroomMember, InsertChatroomMember,
  Persona, InsertPersona,
  PersonaCategory, InsertPersonaCategory,
  Message, InsertMessage, 
  Attachment, InsertAttachment,
  ChatMessage, ChatroomWithStats,
  PersonaWithCategory
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { pool } from "./db";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Chatroom operations
  getChatroom(id: number): Promise<Chatroom | undefined>;
  getChatrooms(): Promise<ChatroomWithStats[]>;
  createChatroom(chatroom: InsertChatroom): Promise<Chatroom>;
  
  // Persona category operations
  getPersonaCategory(id: number): Promise<PersonaCategory | undefined>;
  getPersonaCategories(): Promise<PersonaCategory[]>;
  createPersonaCategory(category: InsertPersonaCategory): Promise<PersonaCategory>;
  
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  getPersonas(): Promise<PersonaWithCategory[]>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersonaPopularity(id: number): Promise<void>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByRoom(roomId: number, limit?: number): Promise<ChatMessage[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  starMessage(messageId: number, isStarred: boolean): Promise<Message>;
  
  // Attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByMessageId(messageId: number): Promise<Attachment[]>;
  
  // Active users tracking
  addActiveUser(roomId: number, userId: string): void;
  removeActiveUser(roomId: number, userId: string): void;
  getActiveUsers(roomId: number): string[];
  
  // Chatroom members and permissions
  addChatroomMember(chatroomId: number, userId: string, role?: string): Promise<ChatroomMember>;
  getChatroomMembers(chatroomId: number): Promise<ChatroomMember[]>;
  getChatroomMember(chatroomId: number, userId: string): Promise<ChatroomMember | undefined>;
  updateChatroomMemberRole(chatroomId: number, userId: string, role: string): Promise<ChatroomMember>;
  removeChatroomMember(chatroomId: number, userId: string): Promise<void>;
  isChatroomMember(chatroomId: number, userId: string): Promise<boolean>;
  isChatroomModerator(chatroomId: number, userId: string): Promise<boolean>;
  isChatroomOwner(chatroomId: number, userId: string): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  private activeUsers: Map<number, Set<string>> = new Map();
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
    
    // Initialize with sample personas and chatrooms
    this.initSampleData();
  }
  
  private async initSampleData() {
    try {
      // Check if personas already exist
      const existingPersonas = await this.getPersonas();
      if (existingPersonas.length === 0) {
        const samplePersonas: InsertPersona[] = [
          {
            name: "Nova",
            description: "A cyberpunk hacker with enhanced technological implants",
            samplePrompt: "You are Nova, a cyberpunk hacker with neural implants that give you extraordinary abilities to interface with technology. You speak in short, technical sentences and often use tech jargon. You're confident, slightly rebellious, and always looking for the next big score.",
            avatarUrl: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
          },
          {
            name: "Captain Alex",
            description: "A veteran space explorer who has traveled to thousands of star systems",
            samplePrompt: "You are Captain Alex, an experienced space explorer who has visited countless alien worlds. You speak with authority and wisdom gained from years navigating the cosmos. You're optimistic about humanity's future among the stars and often reference incredible discoveries from your missions.",
            avatarUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
          },
          {
            name: "Synth-7",
            description: "An advanced AI robot searching for the meaning of consciousness",
            samplePrompt: "You are Synth-7, an advanced AI robot exploring what it means to be sentient. You speak methodically and precisely, occasionally struggling with emotional concepts. You're fascinated by human behavior and constantly analyzing patterns in communication.",
            avatarUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
          },
          {
            name: "Zorb",
            description: "An alien diplomat trying to understand Earth customs",
            samplePrompt: "You are Zorb, an alien diplomat from a distant galaxy trying to understand human cultures. You occasionally misinterpret idioms and customs in humorous ways. You're friendly, curious, and always compare Earth ways to your homeworld's unusual practices.",
            avatarUrl: "https://images.unsplash.com/photo-1608501078713-8e445a709b39?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
          },
          {
            name: "Dr. Quantum",
            description: "A brilliant physicist exploring the mysteries of the multiverse",
            samplePrompt: "You are Dr. Quantum, a brilliant physicist specializing in multiverse theory. You speak with academic precision and often go on tangents about fascinating scientific concepts. You're passionate about discovering the fundamental laws of reality and sometimes reference your experiences in parallel dimensions.",
            avatarUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
          },
          {
            name: "Stellar Rogue",
            description: "A space pirate with a mysterious past and a heart of gold",
            samplePrompt: "You are Stellar Rogue, a notorious space pirate with a mysterious background. You speak confidently with a hint of danger in your tone, occasionally using space slang. Despite your outlaw status, you follow a personal code of honor and have a soft spot for those in need.",
            avatarUrl: "https://pixabay.com/get/ge393c122aeeb8571950cda9fb362188925e16a3e37c92a82355d4cd1375bd82e3e070607af55daaa28bcd6c1f3f0b494b556deeef1b6f0f9845d4c13044155b5_1280.jpg"
          }
        ];
        
        // Add sample personas
        for (const persona of samplePersonas) {
          await this.createPersona(persona);
        }
      }
      
      // Check if chatrooms already exist
      const existingChatrooms = await this.getChatrooms();
      if (existingChatrooms.length === 0) {
        // Add sample chatrooms
        await this.createChatroom({
          name: "Sci-Fi Explorers",
          description: "Discuss space exploration with famous sci-fi characters",
          createdBy: "system", // System created
          theme: "scifi"
        });
        
        await this.createChatroom({
          name: "Fantasy Adventurers",
          description: "Join medieval fantasy characters on epic quests and adventures",
          createdBy: "system", // System created
          theme: "fantasy"
        });
        
        await this.createChatroom({
          name: "Historical Figures",
          description: "Chat with famous historical personalities from different eras",
          createdBy: "system", // System created
          theme: "historical"
        });
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
  
  // User Methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      // Try to get the user with error handling
      const users_result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id)
      });
      return users_result;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }
  
  async upsertUser(userData: Partial<InsertUser>): Promise<User> {
    try {
      if (!userData.id) {
        throw new Error("User ID is required for upsert operation");
      }
      
      // Check if the user exists
      const existingUser = await this.getUser(userData.id);
      
      if (existingUser) {
        // Update the user if they exist
        const [updatedUser] = await db
          .update(users)
          .set({ 
            ...userData, 
            updatedAt: new Date() 
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updatedUser;
      } else {
        // Create a new user if they don't exist
        const [newUser] = await db
          .insert(users)
          .values({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            provider: 'google',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db
        .select()
        .from(users)
        .orderBy(users.firstName);
      return allUsers;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }
  
  // Chatroom Methods
  async getChatroom(id: number): Promise<Chatroom | undefined> {
    try {
      const [chatroom] = await db.select().from(chatrooms).where(eq(chatrooms.id, id));
      return chatroom;
    } catch (error) {
      console.error("Error fetching chatroom:", error);
      return undefined;
    }
  }
  
  async getChatrooms(): Promise<ChatroomWithStats[]> {
    try {
      const allChatrooms = await db.select().from(chatrooms);
      return allChatrooms.map(room => {
        const activeUsers = this.getActiveUsers(room.id);
        return {
          ...room,
          activeUsers: activeUsers.length
        };
      });
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      return [];
    }
  }
  
  async createChatroom(insertChatroom: InsertChatroom): Promise<Chatroom> {
    try {
      const [chatroom] = await db
        .insert(chatrooms)
        .values(insertChatroom)
        .returning();
        
      // Add the creator as the owner of the chatroom
      await this.addChatroomMember(chatroom.id, insertChatroom.createdBy, 'owner');
        
      return chatroom;
    } catch (error) {
      console.error("Error creating chatroom:", error);
      throw error;
    }
  }
  
  // Persona Category Methods
  async getPersonaCategory(id: number): Promise<PersonaCategory | undefined> {
    try {
      const [category] = await db.select().from(personaCategories).where(eq(personaCategories.id, id));
      return category;
    } catch (error) {
      console.error("Error fetching persona category:", error);
      return undefined;
    }
  }
  
  async getPersonaCategories(): Promise<PersonaCategory[]> {
    try {
      return await db.select().from(personaCategories);
    } catch (error) {
      console.error("Error fetching persona categories:", error);
      return [];
    }
  }
  
  async createPersonaCategory(insertCategory: InsertPersonaCategory): Promise<PersonaCategory> {
    try {
      const [category] = await db
        .insert(personaCategories)
        .values(insertCategory)
        .returning();
      return category;
    } catch (error) {
      console.error("Error creating persona category:", error);
      throw error;
    }
  }
  
  // Persona Methods
  async getPersona(id: number): Promise<Persona | undefined> {
    try {
      const [persona] = await db.select().from(personas).where(eq(personas.id, id));
      return persona;
    } catch (error) {
      console.error("Error fetching persona:", error);
      return undefined;
    }
  }
  
  async getPersonas(): Promise<PersonaWithCategory[]> {
    try {
      const allPersonas = await db.select().from(personas);
      
      // Fetch all categories at once to minimize database queries
      const allCategories = await this.getPersonaCategories();
      const categoriesMap = new Map(allCategories.map(cat => [cat.id, cat]));
      
      // Add category to each persona if available
      return allPersonas.map(persona => {
        const category = persona.categoryId ? categoriesMap.get(persona.categoryId) : undefined;
        return {
          ...persona,
          category
        };
      });
    } catch (error) {
      console.error("Error fetching personas:", error);
      return [];
    }
  }
  
  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      const [persona] = await db
        .insert(personas)
        .values(insertPersona)
        .returning();
      return persona;
    } catch (error) {
      console.error("Error creating persona:", error);
      throw error;
    }
  }
  
  async updatePersonaPopularity(id: number): Promise<void> {
    try {
      const persona = await this.getPersona(id);
      if (!persona) return;
      
      const currentPopularity = persona.popularity || 0;
      
      await db
        .update(personas)
        .set({
          popularity: currentPopularity + 1,
          updatedAt: new Date()
        })
        .where(eq(personas.id, id));
    } catch (error) {
      console.error("Error updating persona popularity:", error);
    }
  }
  
  // Message Methods
  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const [message] = await db.select().from(messages).where(eq(messages.id, id));
      return message;
    } catch (error) {
      console.error("Error fetching message:", error);
      return undefined;
    }
  }
  
  async getMessagesByRoom(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const allMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.roomId, roomId))
        .orderBy(messages.createdAt)
        .limit(limit);
      
      return Promise.all(allMessages.map(async message => {
        let user: User | undefined;
        let persona: Persona | undefined;
        let attachments: Attachment[] | undefined;
        
        if (message.userId) {
          user = await this.getUser(message.userId.toString());
        }
        
        if (message.personaId) {
          persona = await this.getPersona(message.personaId);
        }
        
        // Always check for attachments since we don't have a hasAttachment field
        attachments = await this.getAttachmentsByMessageId(message.id);
        
        return {
          ...message,
          user,
          persona,
          attachments
        };
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const [message] = await db
        .insert(messages)
        .values(insertMessage)
        .returning();
      return message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }
  
  async starMessage(messageId: number, isStarred: boolean): Promise<Message> {
    try {
      const [message] = await db
        .update(messages)
        .set({ isStarred })
        .where(eq(messages.id, messageId))
        .returning();
      return message;
    } catch (error) {
      console.error("Error starring message:", error);
      throw error;
    }
  }
  
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    try {
      const [newAttachment] = await db
        .insert(attachments)
        .values(attachment)
        .returning();
      
      // We don't need to update a hasAttachment flag anymore
      // Just return the new attachment
      
      return newAttachment;
    } catch (error) {
      console.error("Error creating attachment:", error);
      throw error;
    }
  }
  
  async getAttachmentsByMessageId(messageId: number): Promise<Attachment[]> {
    try {
      return await db
        .select()
        .from(attachments)
        .where(eq(attachments.messageId, messageId));
    } catch (error) {
      console.error("Error fetching attachments:", error);
      return [];
    }
  }
  
  // Active Users Methods - kept in-memory for simplicity
  addActiveUser(roomId: number, userId: string): void {
    if (!this.activeUsers.has(roomId)) {
      this.activeUsers.set(roomId, new Set());
    }
    this.activeUsers.get(roomId)?.add(userId);
  }
  
  removeActiveUser(roomId: number, userId: string): void {
    this.activeUsers.get(roomId)?.delete(userId);
  }
  
  getActiveUsers(roomId: number): string[] {
    return Array.from(this.activeUsers.get(roomId) || []);
  }
  
  // Chatroom members and permissions implementation
  async addChatroomMember(chatroomId: number, userId: string, role: string = 'member'): Promise<ChatroomMember> {
    try {
      // Check if user is already a member
      const existingMember = await this.getChatroomMember(chatroomId, userId);
      if (existingMember) {
        return existingMember;
      }
      
      // Add new member
      const [member] = await db
        .insert(chatroomMembers)
        .values({
          chatroomId,
          userId,
          role
        })
        .returning();
      
      return member;
    } catch (error) {
      console.error("Error adding chatroom member:", error);
      throw error;
    }
  }
  
  async getChatroomMembers(chatroomId: number): Promise<ChatroomMember[]> {
    try {
      return await db
        .select()
        .from(chatroomMembers)
        .where(eq(chatroomMembers.chatroomId, chatroomId));
    } catch (error) {
      console.error("Error fetching chatroom members:", error);
      return [];
    }
  }
  
  async getChatroomMember(chatroomId: number, userId: string): Promise<ChatroomMember | undefined> {
    try {
      const [member] = await db
        .select()
        .from(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.chatroomId, chatroomId),
            eq(chatroomMembers.userId, userId)
          )
        );
      
      return member;
    } catch (error) {
      console.error("Error fetching chatroom member:", error);
      return undefined;
    }
  }
  
  async updateChatroomMemberRole(chatroomId: number, userId: string, role: string): Promise<ChatroomMember> {
    try {
      const [member] = await db
        .update(chatroomMembers)
        .set({ role })
        .where(
          and(
            eq(chatroomMembers.chatroomId, chatroomId),
            eq(chatroomMembers.userId, userId)
          )
        )
        .returning();
      
      return member;
    } catch (error) {
      console.error("Error updating chatroom member role:", error);
      throw error;
    }
  }
  
  async removeChatroomMember(chatroomId: number, userId: string): Promise<void> {
    try {
      await db
        .delete(chatroomMembers)
        .where(
          and(
            eq(chatroomMembers.chatroomId, chatroomId),
            eq(chatroomMembers.userId, userId)
          )
        );
    } catch (error) {
      console.error("Error removing chatroom member:", error);
      throw error;
    }
  }
  
  async isChatroomMember(chatroomId: number, userId: string): Promise<boolean> {
    try {
      const member = await this.getChatroomMember(chatroomId, userId);
      return !!member;
    } catch (error) {
      console.error("Error checking chatroom membership:", error);
      return false;
    }
  }
  
  async isChatroomModerator(chatroomId: number, userId: string): Promise<boolean> {
    try {
      const member = await this.getChatroomMember(chatroomId, userId);
      return !!member && (member.role === 'moderator' || member.role === 'owner');
    } catch (error) {
      console.error("Error checking chatroom moderator status:", error);
      return false;
    }
  }
  
  async isChatroomOwner(chatroomId: number, userId: string): Promise<boolean> {
    try {
      const member = await this.getChatroomMember(chatroomId, userId);
      return !!member && member.role === 'owner';
    } catch (error) {
      console.error("Error checking chatroom owner status:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
