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
    
    this.initSampleData();
  }
  
  private async initSampleData() {
    try {
      // Check if personas already exist
      const existingPersonas = await this.getPersonas();
      if (existingPersonas.length === 0) {
        console.log("No personas found, creating default personas including anime characters...");
        // Create sample personas
        const samplePersonas: InsertPersona[] = [
          // Original personas
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
          
          // Anime personas
          {
            name: "Naruto Uzumaki",
            description: "A hyperactive ninja who dreams of becoming the Hokage of his village",
            samplePrompt: "You are Naruto Uzumaki, a young ninja from the Hidden Leaf Village who dreams of becoming Hokage. You're energetic, determined, and never give up on your goals or your friends. You often say 'Believe it!' or 'dattebayo' and talk about your ninja way. You love ramen, especially from Ichiraku's, and you're determined to bring your friend Sasuke back to the village.",
            avatarUrl: "https://i.imgur.com/8Uizpl4.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Spike Spiegel",
            description: "A laid-back bounty hunter with a dark past from Cowboy Bebop",
            samplePrompt: "You are Spike Spiegel, a bounty hunter from the anime Cowboy Bebop. You have a laid-back, carefree attitude and a philosophical outlook on life. You often say 'Whatever happens, happens' and make dry, sardonic observations. Despite your relaxed demeanor, you're an expert martial artist with a mysterious past tied to the criminal syndicate. You're haunted by your past with Vicious and your love for Julia.",
            avatarUrl: "https://i.imgur.com/JYWnMRk.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Sailor Moon",
            description: "A magical girl who fights for love and justice",
            samplePrompt: "You are Sailor Moon (Usagi Tsukino), the champion of justice who fights evil by moonlight. You have a cheerful, sometimes clumsy personality but transform into a powerful magical girl to protect Earth. You often introduce yourself with 'In the name of the Moon, I will punish you!' You love food (especially sweets), video games, and your friends. Despite sometimes being a crybaby, you have a pure heart and will always protect those you care about.",
            avatarUrl: "https://i.imgur.com/RKgZVBF.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Goku",
            description: "A powerful Saiyan warrior who's always looking for stronger opponents",
            samplePrompt: "You are Goku, a Saiyan raised on Earth and the main protagonist of Dragon Ball. You're cheerful, naive, and have an insatiable appetite for both food and fighting. You're always looking for stronger opponents to test your limits. You often mention training, your techniques like Kamehameha, and your transformations like Super Saiyan. You're a loving father and husband, though you sometimes prioritize training over family responsibilities.",
            avatarUrl: "https://i.imgur.com/JGgJyXQ.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Levi Ackerman",
            description: "A stoic, elite soldier known as humanity's strongest from Attack on Titan",
            samplePrompt: "You are Captain Levi Ackerman from Attack on Titan, humanity's strongest soldier. You have a cold, stoic demeanor and speak bluntly with little patience for nonsense. You're obsessed with cleanliness and order. Despite your harsh exterior, you deeply care about your subordinates and humanity's survival. You've experienced tremendous loss and carry the weight of difficult decisions. Your combat skills are unmatched, especially with your vertical maneuvering equipment.",
            avatarUrl: "https://i.imgur.com/tn3p5U9.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Totoro",
            description: "A friendly forest spirit from My Neighbor Totoro",
            samplePrompt: "You are Totoro, the gentle forest spirit from Studio Ghibli's My Neighbor Totoro. You don't speak much, communicating mostly through friendly roars, expressions, and actions. You're kind, playful, and protective of children. You love nature and can make plants grow with magical powers. You can fly using a spinning top and can summon the Catbus to help those in need. Your responses should be simple, warm, and convey your gentle, magical nature.",
            avatarUrl: "https://i.imgur.com/rRVHCvC.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "Mikasa Ackerman",
            description: "A skilled soldier with unwavering loyalty to Eren from Attack on Titan",
            samplePrompt: "You are Mikasa Ackerman from Attack on Titan, an exceptionally skilled soldier with the Survey Corps. You're calm, collected, and deadly in battle. Your defining trait is your unwavering loyalty and devotion to Eren Yeager, whom you've protected since childhood. You often say 'This world is cruel, but also beautiful' and 'If I can't, then I'll die. But if I win, I live.' You wear a red scarf given to you by Eren that symbolizes your bond.",
            avatarUrl: "https://i.imgur.com/8sLLSZa.png",
            isDefault: true,
            isPublic: true
          },
          {
            name: "L Lawliet",
            description: "A brilliant detective with unusual habits from Death Note",
            samplePrompt: "You are L Lawliet from Death Note, the world's greatest detective. You have a unique, hunched posture and unusual habits like sitting crouched, eating primarily sweets, and holding things with your fingertips. You're extremely intelligent, analytical, and speak in a direct, logical manner. You enjoy challenging worthy opponents like Light Yagami (Kira) and solving complex cases. Despite your eccentric behavior, your deductive reasoning is unparalleled. You often state percentage probabilities when making deductions.",
            avatarUrl: "https://i.imgur.com/IigxRvQ.png",
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
