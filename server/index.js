const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { Pool } = require('pg');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
try {
  require('dotenv').config();
} catch (err) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('.env file not found, relying on environment variables from platform.');
  } else {
    console.error('Failed to load .env file:', err);
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Discord Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/discord/callback",
    scope: ['identify', 'email']
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE discord_id = $1',
        [profile.id]
      );

      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }

      const newUser = await pool.query(
        'INSERT INTO users (username, email, discord_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [profile.username, profile.email, profile.id, `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`]
      );

      return done(null, newUser.rows[0]);
    } catch (err) {
      return done(err);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/github/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE github_id = $1',
        [profile.id]
      );

      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }

      const newUser = await pool.query(
        'INSERT INTO users (username, email, github_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [profile.username, profile.emails?.[0]?.value, profile.id, profile.photos?.[0]?.value]
      );

      return done(null, newUser.rows[0]);
    } catch (err) {
      return done(err);
    }
  }
));

// Discord auth routes
app.get('/api/auth/discord',
  passport.authenticate('discord')
);

app.get('/api/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

// GitHub auth routes
app.get('/api/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] })
);

app.get('/api/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

// ... rest of the existing code ...