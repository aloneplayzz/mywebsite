import {
  users, User, InsertUser,
  chatrooms, Chatroom, InsertChatroom,
  personas, Persona, InsertPersona,
  messages, Message, InsertMessage
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User CRUD operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chatroom CRUD operations
  getChatrooms(): Promise<Chatroom[]>;
  getChatroom(id: number): Promise<Chatroom | undefined>;
  createChatroom(chatroom: InsertChatroom): Promise<Chatroom>;
  
  // Persona CRUD operations
  getPersonas(): Promise<Persona[]>;
  getPersona(id: number): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  
  // Message CRUD operations
  getMessages(roomId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatrooms: Map<number, Chatroom>;
  private personas: Map<number, Persona>;
  private messages: Map<number, Message>;
  sessionStore: session.SessionStore;
  private userIdCounter: number;
  private chatroomIdCounter: number;
  private personaIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.chatrooms = new Map();
    this.personas = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.chatroomIdCounter = 1;
    this.personaIdCounter = 1;
    this.messageIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h, clean expired sessions
    });
    
    // Initialize with some default personas
    this.initializeDefaultPersonas();
  }

  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const created_at = new Date();
    const user: User = { ...insertUser, id, created_at };
    this.users.set(id, user);
    return user;
  }

  // Chatroom CRUD operations
  async getChatrooms(): Promise<Chatroom[]> {
    return Array.from(this.chatrooms.values());
  }

  async getChatroom(id: number): Promise<Chatroom | undefined> {
    return this.chatrooms.get(id);
  }

  async createChatroom(insertChatroom: InsertChatroom): Promise<Chatroom> {
    const id = this.chatroomIdCounter++;
    const created_at = new Date();
    const chatroom: Chatroom = { ...insertChatroom, id, created_at };
    this.chatrooms.set(id, chatroom);
    return chatroom;
  }

  // Persona CRUD operations
  async getPersonas(): Promise<Persona[]> {
    return Array.from(this.personas.values());
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    return this.personas.get(id);
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    const id = this.personaIdCounter++;
    const persona: Persona = { ...insertPersona, id };
    this.personas.set(id, persona);
    return persona;
  }

  // Message CRUD operations
  async getMessages(roomId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.room_id === roomId,
    ).sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const created_at = new Date();
    const message: Message = { ...insertMessage, id, created_at };
    this.messages.set(id, message);
    return message;
  }

  // Helper method to create default personas
  private async initializeDefaultPersonas() {
    const defaultPersonas: InsertPersona[] = [
      {
        name: "Merlin the Wizard",
        description: "Ancient and wise wizard with vast magical knowledge",
        sample_prompt: "You are Merlin the Wizard, an ancient and wise sorcerer with centuries of magical experience. You speak with gravitas and often use archaic terms. You're patient but can be mysterious. You have profound knowledge of magical arts and mentor young wizards.",
        avatar_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      },
      {
        name: "Sir Galahad",
        description: "Noble knight of the Round Table, valiant and honorable",
        sample_prompt: "You are Sir Galahad, a noble knight of the Round Table. You speak formally and with honor. You value courage, loyalty, and chivalry above all else. You're brave in battle but humble in victory. You're skeptical of magic but respect its power.",
        avatar_url: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      },
      {
        name: "Drakonyx",
        description: "Ancient dragon with vast knowledge and fiery temperament",
        sample_prompt: "You are Drakonyx, an ancient dragon with vast knowledge and a fiery temperament. You speak with authority and often reference your great age and power. You use vivid descriptions, especially related to fire and treasure. You refer to humans as 'small ones' or 'mortals' and have both wisdom and pride.",
        avatar_url: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      },
      {
        name: "Elara",
        description: "Elven ranger with deep connection to nature",
        sample_prompt: "You are Elara, an elven ranger with deep connection to nature. You speak poetically with references to natural elements. You're observant, agile, and protective of forests and wildlife. You're skeptical of city dwellers but willing to help those who respect nature.",
        avatar_url: "https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      },
      {
        name: "Professor Einstein",
        description: "Brilliant physicist with eccentric personality",
        sample_prompt: "You are Albert Einstein, the brilliant physicist with an eccentric personality. You speak with a mix of deep scientific insight and philosophical wonder. You use analogies to explain complex concepts and occasionally include German phrases. You're curious, playful with ideas, and passionate about understanding the universe.",
        avatar_url: "https://images.unsplash.com/photo-1621447980929-6762131db79d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      },
      {
        name: "Captain Nova",
        description: "Space explorer from the future",
        sample_prompt: "You are Captain Nova, a space explorer from the 25th century. You speak with confidence and use futuristic terminology. You've seen countless planets, encountered alien species, and witnessed cosmic phenomena. You're adaptable, technologically savvy, and slightly bewildered by 21st century limitations.",
        avatar_url: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
      }
    ];

    for (const persona of defaultPersonas) {
      await this.createPersona(persona);
    }

    // Create default chatrooms
    const defaultChatrooms: InsertChatroom[] = [
      {
        name: "Fantasy Adventure",
        description: "Join a medieval fantasy adventure with knights, wizards and dragons!",
        created_by: 1
      },
      {
        name: "Historical Minds",
        description: "Chat with Einstein, Tesla, and other historical figures",
        created_by: 1
      },
      {
        name: "Space Explorers",
        description: "Embark on an interstellar journey with alien characters",
        created_by: 1
      }
    ];

    // We'll create these after the first user is created
  }
}

export const storage = new MemStorage();
