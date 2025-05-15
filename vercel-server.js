import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let pool = null;

async function initDb() {
  try {
    let connectionString = process.env.DATABASE_URL;
    
    // Modify connection string to disable SSL if needed
    if (connectionString && !connectionString.includes('sslmode=')) {
      connectionString += '?sslmode=disable';
    } else if (connectionString && connectionString.includes('sslmode=')) {
      connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=disable');
    }
    
    console.log('Database URL is set:', !!connectionString);
    
    // Create connection pool with explicit parameters and completely disabled SSL verification
    const poolConfig = {
      connectionString,
      ssl: false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20
    };
    
    pool = new Pool(poolConfig);
    
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel!' });
});

app.get('/api/db-status', async (req, res) => {
  try {
    const dbStatus = {
      databaseUrlSet: !!process.env.DATABASE_URL,
      poolInitialized: !!pool
    };
    
    // Test the connection if pool exists
    if (pool) {
      try {
        const client = await pool.connect();
        dbStatus.connectionTest = 'success';
        client.release();
      } catch (error) {
        dbStatus.connectionTest = 'failed';
        dbStatus.connectionError = error.message;
      }
    } else {
      dbStatus.connectionTest = 'not attempted - pool not initialized';
    }
    
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    const result = await initDb();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from client/dist if they exist
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // Serve index.html for all routes not handled by API
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Fallback to serving the root index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Initialize database on startup
initDb().then(result => {
  console.log('Database initialization result:', result);
}).catch(error => {
  console.error('Error during database initialization:', error);
});

// Export for Vercel
export default app;
