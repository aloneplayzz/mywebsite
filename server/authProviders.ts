import { Auth } from "@auth/core";
import ExpressAuth from "@auth/express";
import { db } from "./db";
import { users } from "@shared/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import Google from "@auth/core/providers/google";
import EmailProvider from "@auth/core/providers/email";
import Credentials from "@auth/core/providers/credentials";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password function
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Environment variable validation
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}

export async function setupAuthProviders(app: any) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google auth credentials not provided. Google auth will not be available.");
  }

  const providers = [
    // Replit authentication is handled separately in replitAuth.ts
    
    // Google provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    
    // Email magic link provider
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
    
    // Username/password credentials provider
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        // Find user by username
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.username));
        
        if (!user || !user.password) return null;
        
        // Verify password
        const isValid = await comparePasswords(credentials.password, user.password);
        
        if (isValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.firstName || user.email?.split('@')[0] || user.id,
            image: user.profileImageUrl,
          };
        }
        
        return null;
      },
    }),
  ];

  // Set up Auth.js with Express
  ExpressAuth(app, {
    providers,
    adapter: DrizzleAdapter(db), // Using Drizzle adapter with our existing db instance
    secret: process.env.SESSION_SECRET,
    trustHost: true,
    cookies: {
      sessionToken: {
        name: "session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
      // Modify session data
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.sub || session.user.id;
        }
        return session;
      },
      // Add user data to JWT token
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
    },
    pages: {
      signIn: "/auth",
      error: "/auth?error=true",
      newUser: "/auth?newUser=true",
    },
  });
}

// Helper function to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}