import { 
  users, insertUserSchema,
  chatrooms, insertChatroomSchema,
  personas, insertPersonaSchema,
  messages, insertMessageSchema,
  sessions,
  User, InsertUser, 
  Chatroom, InsertChatroom, 
  Persona, InsertPersona, 
  Message, InsertMessage, 
  ChatMessage, ChatroomWithStats
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
  upsertUser(user: InsertUser): Promise<User>;
  
  // Chatroom operations
  getChatroom(id: number): Promise<Chatroom | undefined>;
  getChatrooms(): Promise<ChatroomWithStats[]>;
  createChatroom(chatroom: InsertChatroom): Promise<Chatroom>;
  
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  getPersonas(): Promise<Persona[]>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByRoom(roomId: number, limit?: number): Promise<ChatMessage[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Active users tracking
  addActiveUser(roomId: number, userId: string): void;
  removeActiveUser(roomId: number, userId: string): void;
  getActiveUsers(roomId: number): string[];
  
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
          createdBy: 0, // System created
          theme: "scifi"
        });
        
        await this.createChatroom({
          name: "Fantasy Adventurers",
          description: "Join medieval fantasy characters on epic quests and adventures",
          createdBy: 0, // System created
          theme: "fantasy"
        });
        
        await this.createChatroom({
          name: "Historical Figures",
          description: "Chat with famous historical personalities from different eras",
          createdBy: 0, // System created
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
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }
  
  async upsertUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
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
      return chatroom;
    } catch (error) {
      console.error("Error creating chatroom:", error);
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
  
  async getPersonas(): Promise<Persona[]> {
    try {
      return await db.select().from(personas);
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
        
        if (message.userId) {
          user = await this.getUser(message.userId.toString());
        }
        
        if (message.personaId) {
          persona = await this.getPersona(message.personaId);
        }
        
        return {
          ...message,
          user,
          persona
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
}

export const storage = new DatabaseStorage();
