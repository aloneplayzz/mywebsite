import { Pool } from 'pg';

let storage = null;
let pool = null;

// Initialize database connection
export async function initializeDatabase() {
  if (storage) {
    return { storage, pool, success: true, message: 'Database already initialized' };
  }

  try {
    console.log('Initializing database connection pool');
    // Parse the connection string to extract components
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
      // Completely disable SSL verification
      ssl: false,
      // Add explicit timeout and connection settings
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20 // Maximum number of clients in the pool
    };
    
    // Create the pool
    pool = new Pool(poolConfig);
    
    // Test the connection
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
    
    // Import storage implementation
    try {
      // First try to import the storage class
      const { storage: storageInstance } = await import('../server/storage.js');
      storage = storageInstance;
      console.log('Storage instance imported successfully');
    } catch (storageError) {
      console.error('Error importing storage instance, trying to import class:', storageError);
      
      try {
        // If that fails, try to import the storage class and instantiate it
        const { DatabaseStorage } = await import('../server/storage.js');
        storage = new DatabaseStorage(pool);
        console.log('Storage implementation initialized with class');
      } catch (classError) {
        console.error('Error initializing storage from class:', classError);
        throw classError;
      }
    }
    
    return { storage, pool, success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Error initializing database:', error);
    
    // Create a mock storage implementation for fallback
    const createMockStorage = () => {
      console.log('Creating mock storage implementation');
      return {
        getUser: async () => ({ id: 'mock-user', name: 'Mock User' }),
        getChatrooms: async () => [],
        createChatroom: async () => ({ id: 'mock-room', name: 'Mock Room' }),
        getPersonas: async () => [],
        getChatroomMembers: async () => [],
        addChatroomMember: async () => true,
        removeChatroomMember: async () => true,
        getChatroom: async () => ({ id: 'mock-room', name: 'Mock Room', ownerId: 'mock-user' }),
        getUserByOAuthId: async () => null,
        createUser: async (userData) => ({ id: 'new-user', ...userData }),
        isChatroomMember: async () => true,
        // Add other mock methods as needed for the API to function
        sessionStore: { on: () => {}, use: () => {} }
      };
    };
    
    // Use mock storage if real storage cannot be loaded
    storage = createMockStorage();
    
    return { 
      storage,
      pool: null,
      success: false, 
      message: 'Failed to initialize database', 
      error: error.message,
      stack: error.stack
    };
  }
}

// Get database status
export async function getDatabaseStatus() {
  const dbStatus = {
    databaseUrlSet: !!process.env.DATABASE_URL,
    poolInitialized: !!pool,
    storageInitialized: !!storage
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
  
  return dbStatus;
}

// Get storage instance
export function getStorage() {
  return storage;
}

// Get pool instance
export function getPool() {
  return pool;
}
