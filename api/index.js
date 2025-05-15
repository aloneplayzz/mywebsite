import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple';
import { initializeDatabase, getPool } from './db.js';
import authRoutes from './auth.js';
import chatroomsRoutes from './chatrooms.js';
import personasRoutes from './personas.js';

// Initialize express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().then(result => {
  console.log('Database initialization result:', result);
  
  // Initialize session after database is connected
  const pool = getPool();
  if (pool) {
    const PgSession = connectPgSimple(session);
    app.use(session({
      store: new PgSession({
        pool,
        tableName: 'session'
      }),
      secret: process.env.SESSION_SECRET || 'default-secret-for-development',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
    }));
  } else {
    // Fallback to memory session store if database is not available
    app.use(session({
      secret: process.env.SESSION_SECRET || 'default-secret-for-development',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
    }));
  }
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
}).catch(error => {
  console.error('Error during database initialization:', error);
});

// API Routes for database status
app.get('/api/db-status', async (req, res) => {
  try {
    const { getDatabaseStatus } = await import('./db.js');
    const dbStatus = await getDatabaseStatus();
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    const result = await initializeDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatroomsRoutes);
app.use('/api/personas', personasRoutes);

// Catch-all route for 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Export the Express API
export default app;
