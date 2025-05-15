// Express server for Vercel deployment
const express = require('express');
let Pool;
try {
  const pg = require('pg');
  Pool = pg.Pool;
} catch (error) {
  console.error('Error loading pg module:', error);
  // Create a mock Pool class if pg module fails to load
  Pool = class MockPool {
    constructor() {}
    connect() { return Promise.reject(new Error('Mock pool - pg module not loaded')); }
  };
}
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let pool = null;
let storage = null;

async function initializeDatabase() {
  try {
    console.log('Initializing database connection pool');
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL environment variable is not set');
      return { 
        success: false, 
        message: 'DATABASE_URL environment variable is not set'
      };
    }
    
    // Parse the connection string to extract components
    let connectionString = process.env.DATABASE_URL;
    console.log('Database URL format:', connectionString.split('@')[0].replace(/:[^:]*@/, ':****@'));
    
    // Modify connection string to disable SSL if needed
    if (connectionString && !connectionString.includes('sslmode=')) {
      connectionString += '?sslmode=disable';
      console.log('Added sslmode=disable to connection string');
    } else if (connectionString && connectionString.includes('sslmode=')) {
      connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=disable');
      console.log('Modified existing sslmode to disable');
    }
    
    // Create connection pool with explicit parameters and completely disabled SSL verification
    const poolConfig = {
      connectionString,
      // Completely disable SSL verification
      ssl: false,
      // Add explicit timeout and connection settings
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20 // Maximum number of clients in the pool
    };
    
    console.log('Creating pool with config:', { ...poolConfig, connectionString: '****' });
    
    try {
      // Create the pool
      pool = new Pool(poolConfig);
      console.log('Pool created successfully');
      
      // Test the connection
      try {
        const client = await pool.connect();
        console.log('Successfully connected to the database');
        client.release();
        
        return { success: true, message: 'Database initialized successfully' };
      } catch (connectError) {
        console.error('Error connecting to database:', connectError);
        return { 
          success: false, 
          message: 'Failed to connect to database', 
          error: connectError.message,
          stack: connectError.stack
        };
      }
    } catch (poolError) {
      console.error('Error creating pool:', poolError);
      return { 
        success: false, 
        message: 'Failed to create connection pool', 
        error: poolError.message,
        stack: poolError.stack
      };
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    
    return { 
      success: false, 
      message: 'Failed to initialize database', 
      error: error.message,
      stack: error.stack
    };
  }
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// API Routes
app.get('/api/hello', (req, res) => {
  try {
    res.json({ message: 'Hello from Vercel!', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in /api/hello:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/env', (req, res) => {
  try {
    // Only return safe environment variables
    const safeEnv = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_REGION: process.env.VERCEL_REGION,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      SESSION_SECRET_SET: !!process.env.SESSION_SECRET,
      GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
      DISCORD_CLIENT_ID_SET: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET_SET: !!process.env.DISCORD_CLIENT_SECRET,
      GITHUB_CLIENT_ID_SET: !!process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET_SET: !!process.env.GITHUB_CLIENT_SECRET
    };
    
    res.json(safeEnv);
  } catch (error) {
    console.error('Error in /api/env:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/db-status', async (req, res) => {
  try {
    console.log('DB status request received');
    const dbStatus = {
      databaseUrlSet: !!process.env.DATABASE_URL,
      poolInitialized: !!pool,
      storageInitialized: !!storage,
      timestamp: new Date().toISOString()
    };
    
    // Test the connection if pool exists
    if (pool) {
      try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        dbStatus.connectionTest = 'success';
        client.release();
        console.log('Database connection test successful');
      } catch (error) {
        console.error('Database connection test failed:', error);
        dbStatus.connectionTest = 'failed';
        dbStatus.connectionError = error.message;
        dbStatus.connectionErrorStack = error.stack;
      }
    } else {
      console.log('Pool not initialized, skipping connection test');
      dbStatus.connectionTest = 'not attempted - pool not initialized';
    }
    
    console.log('Sending DB status response:', dbStatus);
    res.json(dbStatus);
  } catch (error) {
    console.error('Error in /api/db-status:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    console.log('Database initialization request received');
    const result = await initializeDatabase();
    console.log('Database initialization completed with result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/init-db:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Root route - serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Persona Chatroom</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          }
          h1 {
            color: #333;
          }
          p {
            color: #666;
            margin-bottom: 1.5rem;
          }
          .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #4338ca;
          }
          .status {
            margin-top: 2rem;
            padding: 1rem;
            background-color: #f3f4f6;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI Persona Chatroom</h1>
          <p>Welcome to the AI Persona Chatroom application. This is a simple landing page to verify your Vercel deployment is working.</p>
          
          <a href="/client/" class="button">Go to Application</a>
          
          <div class="status">
            <h3>API Status</h3>
            <p>Check the database connection status: <a href="#" id="check-db">Database Status</a></p>
            <div id="status-result">Click the link above to check database status</div>
          </div>
        </div>

        <script>
          document.getElementById('check-db').addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
              const response = await fetch('/api/db-status');
              const data = await response.json();
              
              document.getElementById('status-result').innerHTML = \`
                <pre>\${JSON.stringify(data, null, 2)}</pre>
              \`;
            } catch (error) {
              document.getElementById('status-result').innerHTML = \`
                <p style="color: red">Error checking database status: \${error.message}</p>
              \`;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Check installed dependencies
function checkDependencies() {
  const requiredDependencies = ['express', 'cors'];
  const missingDependencies = [];
  
  for (const dep of requiredDependencies) {
    try {
      require.resolve(dep);
    } catch (e) {
      missingDependencies.push(dep);
    }
  }
  
  // Optional dependencies - we'll try to load these but won't fail if they're missing
  const optionalDependencies = ['pg'];
  const missingOptionalDependencies = [];
  
  for (const dep of optionalDependencies) {
    try {
      require.resolve(dep);
    } catch (e) {
      missingOptionalDependencies.push(dep);
    }
  }
  
  return {
    missing: missingDependencies,
    missingOptional: missingOptionalDependencies,
    allRequired: missingDependencies.length === 0
  };
}

// Check dependencies on startup
const dependencyCheck = checkDependencies();
console.log('Dependency check:', dependencyCheck);

// Initialize database on startup
initializeDatabase().then(result => {
  console.log('Database initialization result:', result);
}).catch(error => {
  console.error('Error during database initialization:', error);
});

// Export the Express app
module.exports = app;
