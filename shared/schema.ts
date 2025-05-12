import { pgTable, text, serial, integer, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// User model
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);

// Chatroom model
export const chatrooms = pgTable("chatrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  theme: text("theme").default("default"),
});

// Chatroom Member model with roles
export const chatroomMembers = pgTable("chatroom_members", {
  id: serial("id").primaryKey(),
  chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // Possible values: "owner", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertChatroomSchema = createInsertSchema(chatrooms).pick({
  name: true,
  description: true,
  createdBy: true,
  theme: true,
});

export const insertChatroomMemberSchema = createInsertSchema(chatroomMembers).pick({
  chatroomId: true,
  userId: true,
  role: true,
});

// Persona categories
export const personaCategories = pgTable("persona_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPersonaCategorySchema = createInsertSchema(personaCategories).pick({
  name: true,
  description: true,
});

// Persona model with enhanced features
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  samplePrompt: text("sample_prompt").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  categoryId: integer("category_id"),
  popularity: integer("popularity").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customizable: boolean("customizable").default(false),
});

export const insertPersonaSchema = createInsertSchema(personas).pick({
  name: true,
  description: true,
  samplePrompt: true,
  avatarUrl: true,
  categoryId: true,
  customizable: true,
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: varchar("user_id"),
  personaId: integer("persona_id"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  userId: true,
  personaId: true,
  message: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chatroom = typeof chatrooms.$inferSelect;
export type InsertChatroom = z.infer<typeof insertChatroomSchema>;

export type ChatroomMember = typeof chatroomMembers.$inferSelect;
export type InsertChatroomMember = z.infer<typeof insertChatroomMemberSchema>;

export type PersonaCategory = typeof personaCategories.$inferSelect;
export type InsertPersonaCategory = z.infer<typeof insertPersonaCategorySchema>;

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Extended types for frontend
export type PersonaWithCategory = Persona & {
  category?: PersonaCategory;
};

export type ChatMessage = Message & {
  user?: User;
  persona?: PersonaWithCategory;
};

export type ChatroomWithStats = Chatroom & {
  activeUsers: number;
  messageCount?: number;
};
