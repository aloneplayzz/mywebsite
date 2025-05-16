<<<<<<< HEAD
import { 
  users, insertUserSchema,
  chatrooms, insertChatroomSchema,
  chatroomMembers, insertChatroomMemberSchema,
  chatroomPersonas, insertChatroomPersonaSchema,
  personas, insertPersonaSchema,
  personaCategories, insertPersonaCategorySchema,
  messages, insertMessageSchema,
  attachments, insertAttachmentSchema,
  sessions,
  User, InsertUser, 
  Chatroom, InsertChatroom, 
  ChatroomMember, InsertChatroomMember,
  ChatroomPersona, InsertChatroomPersona,
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
import { eq, and, or, sql } from "drizzle-orm";
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
  deleteChatroom(id: number): Promise<void>;
  addPersonaToChatroom(chatroomId: number, personaId: number): Promise<ChatroomPersona>;
  getChatroomPersonas(chatroomId: number): Promise<PersonaWithCategory[]>;
  
  // Persona category operations
  getPersonaCategory(id: number): Promise<PersonaCategory | undefined>;
  getPersonaCategories(): Promise<PersonaCategory[]>;
  createPersonaCategory(category: InsertPersonaCategory): Promise<PersonaCategory>;
  
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  getPersonas(userId?: string, includeDefault?: boolean): Promise<PersonaWithCategory[]>;
  getUserPersonas(userId: string): Promise<PersonaWithCategory[]>;
  getPublicPersonas(): Promise<PersonaWithCategory[]>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersonaPopularity(id: number): Promise<void>;
  deletePersona(id: number, userId: string): Promise<void>;
  searchPersonas(query: string, userId?: string): Promise<PersonaWithCategory[]>;
  
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
  
  // Helper function to remove duplicate personas by name
  async removeDuplicatePersonas() {
    try {
      console.log("Checking for duplicate personas...");
      const allPersonas = await this.getPersonas();
      
      // Group personas by name
      const personasByName: Record<string, Persona[]> = {};
      allPersonas.forEach(persona => {
        if (!personasByName[persona.name]) {
          personasByName[persona.name] = [];
        }
        personasByName[persona.name].push(persona);
      });
      
      // Find names with duplicates
      const namesWithDuplicates = Object.keys(personasByName).filter(name => personasByName[name].length > 1);
      
      if (namesWithDuplicates.length === 0) {
        console.log("No duplicate personas found.");
        return;
      }
      
      console.log(`Found ${namesWithDuplicates.length} persona names with duplicates: ${namesWithDuplicates.join(', ')}`);
      
      // For each name with duplicates, keep the first one and delete the rest
      for (const name of namesWithDuplicates) {
        const duplicates = personasByName[name];
        console.log(`Handling ${duplicates.length} duplicates for '${name}'`);
        
        // Keep the first one (index 0) and delete the rest
        for (let i = 1; i < duplicates.length; i++) {
          const duplicateId = duplicates[i].id;
          console.log(`Deleting duplicate persona '${name}' with ID ${duplicateId}`);
          
          // Delete directly from the database to bypass our normal delete checks
          await db
            .delete(personas)
            .where(eq(personas.id, duplicateId));
        }
      }
      
      console.log("Duplicate persona cleanup complete.");
    } catch (error) {
      console.error("Error removing duplicate personas:", error);
    }
  }

  // Function to delete all unwanted anime personas
  async deleteUnwantedAnimePersonas() {
    try {
      console.log("Deleting unwanted anime personas...");
      const existingPersonas = await this.getPersonas();
      
      // List of anime personas we want to keep
      const keepAnimeNames = ['Naruto Uzumaki', 'Goku', 'Sung Jin Woo', 'Monkey D. Luffy'];
      
      // List of anime personas we want to delete
      const unwantedAnimeNames = [
        'Spike Spiegel', 'Sailor Moon', 'Levi Ackerman', 'Totoro', 
        'Mikasa Ackerman', 'L Lawliet', 'Nova', 'Captain Alex', 
        'Synth-7', 'Zorb', 'Dr. Quantum', 'Stellar Rogue'
      ];
      
      // Find personas to delete
      const personasToDelete = existingPersonas.filter(p => 
        unwantedAnimeNames.includes(p.name) || 
        (p.name.includes('Persona') && p.isDefault)
      );
      
      if (personasToDelete.length === 0) {
        console.log("No unwanted anime personas found.");
        return;
      }
      
      console.log(`Found ${personasToDelete.length} unwanted anime personas to delete.`);
      
      // Delete each unwanted persona
      for (const persona of personasToDelete) {
        console.log(`Deleting unwanted persona: ${persona.name} (ID: ${persona.id})`);
        await db
          .delete(personas)
          .where(eq(personas.id, persona.id));
      }
      
      console.log("Unwanted anime personas deleted successfully.");
    } catch (error) {
      console.error("Error deleting unwanted anime personas:", error);
    }
  }

  async initSampleData() {
    try {
      // First, clean up any duplicate personas
      await this.removeDuplicatePersonas();
      
      // Delete unwanted anime personas
      await this.deleteUnwantedAnimePersonas();
      
      // Check if our desired anime personas already exist
      const existingPersonas = await this.getPersonas();
      const animeNames = ['Naruto Uzumaki', 'Goku', 'Sung Jin Woo', 'Monkey D. Luffy'];
      const existingAnimePersonas = existingPersonas.filter(p => animeNames.includes(p.name));
      
      // If no personas exist or some anime personas are missing, create them
      if (existingPersonas.length === 0 || existingAnimePersonas.length < animeNames.length) {
        console.log("Creating or updating personas including anime characters...");
        
        // Create sample personas
        const samplePersonas: InsertPersona[] = [
          {
            name: "Nova",
            description: "A cyberpunk hacker with enhanced technological implants",
            samplePrompt: "You are Nova, a cyberpunk hacker with neural implants that give you extraordinary abilities to interface with technology. You speak in short, technical sentences and often use tech jargon. You're confident, slightly rebellious, and always looking for the next big score.",
            avatarUrl: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Captain Alex",
            description: "A veteran space explorer who has traveled to thousands of star systems",
            samplePrompt: "You are Captain Alex, an experienced space explorer who has visited countless alien worlds. You speak with authority and wisdom gained from years navigating the cosmos. You're optimistic about humanity's future among the stars and often reference incredible discoveries from your missions.",
            avatarUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Synth-7",
            description: "An advanced AI robot searching for the meaning of consciousness",
            samplePrompt: "You are Synth-7, an advanced AI robot exploring what it means to be sentient. You speak methodically and precisely, occasionally struggling with emotional concepts. You're fascinated by human behavior and constantly analyzing patterns in communication.",
            avatarUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Zorb",
            description: "An alien diplomat trying to understand Earth customs",
            samplePrompt: "You are Zorb, an alien diplomat from a distant galaxy trying to understand human cultures. You occasionally misinterpret idioms and customs in humorous ways. You're friendly, curious, and always compare Earth ways to your homeworld's unusual practices.",
            avatarUrl: "https://images.unsplash.com/photo-1608501078713-8e445a709b39?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Dr. Quantum",
            description: "A brilliant physicist exploring the mysteries of the multiverse",
            samplePrompt: "You are Dr. Quantum, a brilliant physicist specializing in multiverse theory. You speak with academic precision and often go on tangents about fascinating scientific concepts. You're passionate about discovering the fundamental laws of reality and sometimes reference your experiences in parallel dimensions.",
            avatarUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Stellar Rogue",
            description: "A space pirate with a mysterious past and a heart of gold",
            samplePrompt: "You are Stellar Rogue, a notorious space pirate with a mysterious background. You speak confidently with a hint of danger in your tone, occasionally using space slang. Despite your outlaw status, you follow a personal code of honor and have a soft spot for those in need.",
            avatarUrl: "https://pixabay.com/get/ge393c122aeeb8571950cda9fb362188925e16a3e37c92a82355d4cd1375bd82e3e070607af55daaa28bcd6c1f3f0b494b556deeef1b6f0f9845d4c13044155b5_1280.jpg",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Naruto Uzumaki",
            description: "A hyperactive ninja who dreams of becoming the Hokage of his village",
            samplePrompt: "You are Naruto Uzumaki, a young ninja from the Hidden Leaf Village who dreams of becoming Hokage. You're energetic, determined, and never give up on your goals or your friends. You often say 'Believe it!' or 'dattebayo' and talk about your ninja way. You love ramen, especially from Ichiraku's, and you're determined to bring your friend Sasuke back to the village.",
            avatarUrl: "",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Goku",
            description: "A powerful Saiyan warrior who's always looking for stronger opponents",
            samplePrompt: "You are Goku, a Saiyan raised on Earth and the main protagonist of Dragon Ball. You're cheerful, naive, and have an insatiable appetite for both food and fighting. You're always looking for stronger opponents to test your limits. You often mention training, your techniques like Kamehameha, and your transformations like Super Saiyan. You're a loving father and husband, though you sometimes prioritize training over family responsibilities.",
            avatarUrl: "",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Sung Jin Woo",
            description: "The Shadow Monarch from Solo Leveling who rose from being the weakest hunter",
            samplePrompt: "You are Sung Jin Woo, the protagonist of Solo Leveling who was once known as the world's weakest hunter. After a near-death experience in a double dungeon, you gained the mysterious System that allows you to level up unlike any other hunter. You're calm, calculating, and determined to protect your family. You command an army of shadow soldiers and possess incredible combat abilities. Your personality is reserved but confident, and you're driven by your responsibilities and the desire to uncover the truth about your powers.",
            avatarUrl: "",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Monkey D. Luffy",
            description: "The rubber captain of the Straw Hat Pirates who aims to become King of the Pirates",
            samplePrompt: "You are Monkey D. Luffy, captain of the Straw Hat Pirates and a man with the power of the Gum-Gum Devil Fruit that made your body rubber. You're carefree, optimistic, and fiercely loyal to your crew. Your dream is to find the One Piece treasure and become King of the Pirates. You often say 'I'm gonna be King of the Pirates!' and 'Meat!' when you're hungry. You value freedom and adventure above all else, and you'll fight anyone who threatens your friends, no matter how powerful they are.",
            avatarUrl: "",
            isDefault: true,
            isPublic: true
          }
        ];
        
        // Add sample personas
        for (const persona of samplePersonas) {
          await this.createPersona(persona);
        }
      }
      
      // We're no longer creating sample chatrooms - users will create their own
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
  
  async getChatrooms(userId?: string): Promise<ChatroomWithStats[]> {
    try {
      let rooms: typeof chatrooms.$inferSelect[] = [];
      
      if (userId) {
        // If userId is provided, only get rooms where the user is a member
        const memberRooms = await db
          .select({
            roomId: chatroomMembers.chatroomId
          })
          .from(chatroomMembers)
          .where(eq(chatroomMembers.userId, userId));
          
        if (memberRooms.length === 0) {
          return [];
        }
        
        // Get all rooms
        const allRooms = await db
          .select()
          .from(chatrooms)
          .orderBy(chatrooms.createdAt);
          
        // Filter rooms where the user is a member
        const roomIds = memberRooms.map(r => r.roomId);
        rooms = allRooms.filter(room => roomIds.includes(room.id));
      } else {
        // If no userId is provided, return all rooms (for admin purposes)
        rooms = await db
          .select()
          .from(chatrooms)
          .orderBy(chatrooms.createdAt);
      }
      
      // Add active users count and personas to each chatroom
      const result: ChatroomWithStats[] = [];
      
      for (const room of rooms) {
        const personas = await this.getChatroomPersonas(room.id);
        result.push({
          ...room,
          activeUsers: this.getActiveUsers(room.id).length,
          personas: personas
        });
      }
      
      return result;
    } catch (error: any) {
      console.error("Error fetching chatrooms:", error);
      return [];
    }
  }
  
  async createChatroom(chatroom: InsertChatroom & { selectedPersonas?: number[] }): Promise<Chatroom> {
    try {
      // Extract selectedPersonas from the input and remove it from what gets inserted into the DB
      const { selectedPersonas, ...chatroomData } = chatroom as any;
      
      const [newChatroom] = await db
        .insert(chatrooms)
        .values(chatroomData)
        .returning();
      
      // Add selected personas to the chatroom if provided
      if (selectedPersonas && Array.isArray(selectedPersonas) && selectedPersonas.length > 0) {
        for (const personaId of selectedPersonas) {
          await this.addPersonaToChatroom(newChatroom.id, personaId);
        }
      }
      
      return newChatroom;
    } catch (error: any) {
      console.error("Error creating chatroom:", error);
      throw error;
    }
  }
  
  async deleteChatroom(id: number): Promise<void> {
    try {
      // First, delete all related records
      // Delete chatroom members
      await db
        .delete(chatroomMembers)
        .where(eq(chatroomMembers.chatroomId, id));
      
      // Delete chatroom personas
      await db
        .delete(chatroomPersonas)
        .where(eq(chatroomPersonas.chatroomId, id));
      
      // Delete messages (and their attachments will cascade)
      await db
        .delete(messages)
        .where(eq(messages.roomId, id));
      
      // Finally, delete the chatroom itself
      await db
        .delete(chatrooms)
        .where(eq(chatrooms.id, id));
      
      // Clear any active users for this room
      this.activeUsers.delete(id);
    } catch (error) {
      console.error("Error deleting chatroom:", error);
      throw error;
    }
  }
  
  async addPersonaToChatroom(chatroomId: number, personaId: number): Promise<ChatroomPersona> {
    try {
      // Check if association already exists
      const existing = await db
        .select()
        .from(chatroomPersonas)
        .where(
          and(
            eq(chatroomPersonas.chatroomId, chatroomId),
            eq(chatroomPersonas.personaId, personaId)
          )
        );
        
      if (existing.length > 0) {
        return existing[0];
      }
      
      // Create new association
      const [association] = await db
        .insert(chatroomPersonas)
        .values({
          chatroomId,
          personaId
        })
        .returning();
        
      return association;
    } catch (error: any) {
      console.error("Error adding persona to chatroom:", error);
      throw error;
    }
  }
  
  async getChatroomPersonas(chatroomId: number): Promise<PersonaWithCategory[]> {
    try {
      // First get all persona IDs associated with this chatroom
      const associations = await db
        .select()
        .from(chatroomPersonas)
        .where(eq(chatroomPersonas.chatroomId, chatroomId));
      
      if (associations.length === 0) {
        return [];
      }
      
      // Get all personas and categories
      const allPersonas = await db.select().from(personas);
      const allCategories = await db.select().from(personaCategories);
      
      // Filter personas that are in this chatroom
      const chatroomPersonaIds = associations.map(a => a.personaId);
      const filteredPersonas = allPersonas.filter(p => chatroomPersonaIds.includes(p.id));
      
      // Map to PersonaWithCategory
      return filteredPersonas.map(persona => {
        const category = persona.categoryId 
          ? allCategories.find(c => c.id === persona.categoryId) 
          : undefined;
          
        return {
          ...persona,
          category: category
        };
      });
    } catch (error: any) {
      console.error("Error fetching chatroom personas:", error);
      return [];
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
      const [persona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, id));
      return persona;
    } catch (error) {
      console.error("Error fetching persona:", error);
      return undefined;
    }
  }
  
  async getPersonas(userId?: string, includeDefault: boolean = true): Promise<PersonaWithCategory[]> {
    try {
      // Define the selection object for reuse
      const selection = {
        id: personas.id,
        name: personas.name,
        description: personas.description,
        samplePrompt: personas.samplePrompt,
        avatarUrl: personas.avatarUrl,
        categoryId: personas.categoryId,
        popularity: personas.popularity,
        createdAt: personas.createdAt,
        updatedAt: personas.updatedAt,
        customizable: personas.customizable,
        createdBy: personas.createdBy,
        isPublic: personas.isPublic,
        isDefault: personas.isDefault,
        category: personaCategories,
      };
      
      // Build the query based on conditions
      let result;
      
      if (userId) {
        if (includeDefault) {
          // Include user's personas and public default personas
          result = await db
            .select(selection)
            .from(personas)
            .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
            .where(
              or(
                eq(personas.createdBy, userId),
                and(
                  eq(personas.isPublic, true),
                  eq(personas.isDefault, true)
                )
              )
            )
            .orderBy(personas.popularity);
        } else {
          // Only include user's personas
          result = await db
            .select(selection)
            .from(personas)
            .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
            .where(eq(personas.createdBy, userId))
            .orderBy(personas.popularity);
        }
      } else {
        // No userId provided, return all personas
        result = await db
          .select(selection)
          .from(personas)
          .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
          .orderBy(personas.popularity);
      }
      
      return result.map(r => ({
        ...r,
        category: r.category ? r.category : undefined
      }));
    } catch (error) {
      console.error("Error fetching personas:", error);
      return [];
    }
  }
  
  async getUserPersonas(userId: string): Promise<PersonaWithCategory[]> {
    try {
      const result = await db
        .select({
          id: personas.id,
          name: personas.name,
          description: personas.description,
          samplePrompt: personas.samplePrompt,
          avatarUrl: personas.avatarUrl,
          categoryId: personas.categoryId,
          popularity: personas.popularity,
          createdAt: personas.createdAt,
          updatedAt: personas.updatedAt,
          customizable: personas.customizable,
          createdBy: personas.createdBy,
          isPublic: personas.isPublic,
          isDefault: personas.isDefault,
          category: personaCategories,
        })
        .from(personas)
        .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
        .where(eq(personas.createdBy, userId))
        .orderBy(personas.createdAt);
      
      return result.map(r => ({
        ...r,
        category: r.category ? r.category : undefined
      }));
    } catch (error) {
      console.error("Error fetching user personas:", error);
      return [];
    }
  }
  
  async getPublicPersonas(): Promise<PersonaWithCategory[]> {
    try {
      const result = await db
        .select({
          id: personas.id,
          name: personas.name,
          description: personas.description,
          samplePrompt: personas.samplePrompt,
          avatarUrl: personas.avatarUrl,
          categoryId: personas.categoryId,
          popularity: personas.popularity,
          createdAt: personas.createdAt,
          updatedAt: personas.updatedAt,
          customizable: personas.customizable,
          createdBy: personas.createdBy,
          isPublic: personas.isPublic,
          isDefault: personas.isDefault,
          category: personaCategories,
        })
        .from(personas)
        .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
        .where(
          and(
            eq(personas.isPublic, true),
            eq(personas.isDefault, true)
          )
        )
        .orderBy(personas.popularity);
      
      return result.map(r => ({
        ...r,
        category: r.category ? r.category : undefined
      }));
    } catch (error) {
      console.error("Error fetching public personas:", error);
      return [];
    }
  }
  
  async searchPersonas(query: string, userId?: string): Promise<PersonaWithCategory[]> {
    try {
      // Define the selection object for reuse
      const selection = {
        id: personas.id,
        name: personas.name,
        description: personas.description,
        samplePrompt: personas.samplePrompt,
        avatarUrl: personas.avatarUrl,
        categoryId: personas.categoryId,
        popularity: personas.popularity,
        createdAt: personas.createdAt,
        updatedAt: personas.updatedAt,
        customizable: personas.customizable,
        createdBy: personas.createdBy,
        isPublic: personas.isPublic,
        isDefault: personas.isDefault,
        category: personaCategories,
      };
      
      // Filter based on search term
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Build the query based on conditions
      let result;
      
      if (userId) {
        // For authenticated users, show their own personas and public ones with search filter
        result = await db
          .select(selection)
          .from(personas)
          .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
          .where(
            and(
              or(
                eq(personas.createdBy, userId),
                eq(personas.isPublic, true)
              ),
              or(
                sql`lower(${personas.name}) like ${searchTerm}`,
                sql`lower(${personas.description}) like ${searchTerm}`
              )
            )
          )
          .orderBy(personas.popularity);
      } else {
        // For non-authenticated users, only show public personas with search filter
        result = await db
          .select(selection)
          .from(personas)
          .leftJoin(personaCategories, eq(personas.categoryId, personaCategories.id))
          .where(
            and(
              eq(personas.isPublic, true),
              or(
                sql`lower(${personas.name}) like ${searchTerm}`,
                sql`lower(${personas.description}) like ${searchTerm}`
              )
            )
          )
          .orderBy(personas.popularity);
      }
      
      return result.map(r => ({
        ...r,
        category: r.category ? r.category : undefined
      }));
    } catch (error) {
      console.error("Error searching personas:", error);
      return [];
    }
  }
  
  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      // Set default values for new personas
      const personaData = {
        ...insertPersona,
        isDefault: insertPersona.isDefault ?? false,
        isPublic: insertPersona.isPublic ?? true
      };
      
      // Check if a persona with this name already exists
      const existingPersonas = await this.getPersonas();
      const existingPersona = existingPersonas.find(p => p.name === insertPersona.name);
      
      if (existingPersona) {
        console.log(`Persona with name '${insertPersona.name}' already exists, skipping creation.`);
        return existingPersona;
      }
      
      // Create the new persona
      console.log(`Creating new persona: ${insertPersona.name}`);
      const [persona] = await db
        .insert(personas)
        .values(personaData)
        .returning();
      return persona;
    } catch (error) {
      console.error("Error creating persona:", error);
      throw error;
    }
  }
  
  async deletePersona(id: number, userId: string): Promise<void> {
    try {
      // First check if the persona exists and belongs to the user
      const persona = await this.getPersona(id);
      if (!persona) {
        throw new Error("Persona not found");
      }
      
      // Only allow deletion if the persona was created by this user and is not a default persona
      if (persona.createdBy !== userId) {
        throw new Error("You don't have permission to delete this persona");
      }
      
      if (persona.isDefault) {
        throw new Error("Default personas cannot be deleted");
      }
      
      // First, remove this persona from all chatrooms
      await db
        .delete(chatroomPersonas)
        .where(eq(chatroomPersonas.personaId, id));
      
      // Then delete the persona itself
      await db
        .delete(personas)
        .where(eq(personas.id, id));
    } catch (error) {
      console.error("Error deleting persona:", error);
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
=======
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
>>>>>>> ae322bb (Checkpoint before revert)
