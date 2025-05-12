import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  created_at: timestamp("created_at").defaultNow()
});

export const chatrooms = pgTable("chatrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  created_by: integer("created_by").notNull().references(() => users.id),
  created_at: timestamp("created_at").defaultNow()
});

export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sample_prompt: text("sample_prompt").notNull(),
  avatar_url: text("avatar_url")
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  room_id: integer("room_id").notNull().references(() => chatrooms.id),
  user_id: integer("user_id").references(() => users.id),
  persona_id: integer("persona_id").references(() => personas.id),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true
});

export const insertChatroomSchema = createInsertSchema(chatrooms).omit({
  id: true,
  created_at: true
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChatroom = z.infer<typeof insertChatroomSchema>;
export type Chatroom = typeof chatrooms.$inferSelect;

export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Persona = typeof personas.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type Login = z.infer<typeof loginSchema>;
