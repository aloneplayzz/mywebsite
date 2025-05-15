import passport from "passport";
import { Strategy as GitHubStrategy, Profile as GitHubProfile, VerifyCallback } from "passport-github2";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Check for required environment variables
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn("GitHub OAuth credentials missing. GitHub authentication will not work properly.");
}

export function setupGitHubAuth(app: Express): void {
  // Configure GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: "/api/auth/github/callback",
          scope: ["user:email"]
        },
        async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: VerifyCallback) => {
          try {
            // First check if a user with this email already exists
            const email = profile.emails?.[0]?.value || null;
            let existingUser = null;
            
            if (email) {
              // Try to find a user with the same email in the database
              const allUsers = await storage.getAllUsers();
              existingUser = allUsers.find(user => user.email === email);
            }
            
            if (existingUser) {
              // User with this email already exists, just return that user
              return done(null, existingUser);
            }
            
            // Create user object from GitHub profile
            const userInfo = {
              id: profile.id,
              email: email,
              firstName: profile.displayName?.split(" ")[0] || null,
              lastName: profile.displayName?.split(" ").slice(1).join(" ") || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
              provider: "github"
            };

            // Upsert user in database
            const savedUser = await storage.upsertUser(userInfo);
            
            return done(null, savedUser);
          } catch (error) {
            console.error("GitHub auth error:", error);
            return done(error as Error);
          }
        }
      )
    );
  }

  // Authentication routes
  app.get(
    "/api/auth/github",
    passport.authenticate("github", {
      scope: ["user:email"]
    })
  );

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      successRedirect: "/",
      failureRedirect: "/auth"
    })
  );
}
