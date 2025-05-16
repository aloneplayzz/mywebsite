import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";
import { User } from "@shared/schema";

// Session store setup
const PgStore = ConnectPgSimple(session);

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials missing. Google authentication will not work properly.");
}

// Define a simple type for our user session
type UserSession = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

// Declare globals for Express sessions
declare global {
  namespace Express {
    interface User extends UserSession {}
  }
}

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "ai-persona-chat-dev-secret",
    store: new PgStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  });
}

export function setupGoogleAuth(app: Express): void {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === "production" 
            ? `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`
            : "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // First check if a user with this email already exists
            const email = profile.emails?.[0]?.value || null;
            let existingUser = null;
            
            if (email) {
              // Try to find a user with the same email in the database
              const allUsers = await storage.getAllUsers();
              existingUser = allUsers.find(user => user.email === email);
            }
            
            let savedUser;
            
            if (existingUser) {
              // User with this email already exists, use that user
              savedUser = existingUser;
            } else {
              // Create user object from Google profile
              const userInfo = {
                id: profile.id,
                email: email,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                profileImageUrl: profile.photos?.[0]?.value || null,
                provider: "google"
              };

              // Upsert user in database
              savedUser = await storage.upsertUser(userInfo);
            }
            
            // Create a simplified session user
            const sessionUser: UserSession = {
              id: savedUser.id,
              email: savedUser.email,
              firstName: savedUser.firstName,
              lastName: savedUser.lastName,
              profileImageUrl: savedUser.profileImageUrl
            };

            // Return this session user object
            return done(null, sessionUser as any);
          } catch (error) {
            console.error("Google auth error:", error);
            return done(error as Error);
          }
        }
      )
    );
  }

  // Session serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      
      if (!user) {
        return done(null, false);
      }

      // Create simplified session user
      const sessionUser: UserSession = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      };

      // Return the session user
      done(null, sessionUser as any);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  // Authentication routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account"
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/auth"
    })
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/auth");
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};