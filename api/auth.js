import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { initializeDatabase } from './db.js';

const router = express.Router();
let storage = null;

// Initialize database and storage
async function ensureStorage() {
  if (!storage) {
    const { storage: storageInstance } = await initializeDatabase();
    storage = storageInstance;
  }
  return storage;
}

// Configure passport strategies
function configurePassport() {
  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const storage = await ensureStorage();
        if (!storage) {
          return done(new Error('Storage not initialized'));
        }
        
        // Find or create user
        let user = await storage.getUserByOAuthId('google', profile.id);
        if (!user) {
          user = await storage.createUser({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            oauthProvider: 'google',
            oauthId: profile.id,
            avatar: profile.photos?.[0]?.value
          });
        }
        
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }
  
  // GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const storage = await ensureStorage();
        if (!storage) {
          return done(new Error('Storage not initialized'));
        }
        
        // Find or create user
        let user = await storage.getUserByOAuthId('github', profile.id);
        if (!user) {
          user = await storage.createUser({
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value,
            oauthProvider: 'github',
            oauthId: profile.id,
            avatar: profile.photos?.[0]?.value
          });
        }
        
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }
  
  // Discord Strategy
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(new DiscordStrategy({
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: '/api/auth/discord/callback',
      scope: ['identify', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const storage = await ensureStorage();
        if (!storage) {
          return done(new Error('Storage not initialized'));
        }
        
        // Find or create user
        let user = await storage.getUserByOAuthId('discord', profile.id);
        if (!user) {
          user = await storage.createUser({
            name: profile.username,
            email: profile.email,
            oauthProvider: 'discord',
            oauthId: profile.id,
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null
          });
        }
        
        done(null, user);
      } catch (error) {
        done(error);
      }
    }));
  }
}

// Configure passport
configurePassport();

// Google auth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// GitHub auth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Discord auth routes
router.get('/discord', passport.authenticate('discord', { scope: ['identify', 'email'] }));

router.get('/discord/callback', 
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Get current user
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

export default router;
