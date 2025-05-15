// Load environment variables from .env file if it exists
import { config } from 'dotenv';
import * as fs from 'fs';

try {
  // Check if .env file exists before trying to load it
  if (fs.existsSync('.env')) {
    config();
    console.log('Loaded environment variables from .env file');
  } else {
    console.log('.env file not found, using environment variables from the system');
  }
} catch (error) {
  console.warn('Error loading .env file:', error);
  console.log('Continuing with environment variables from the system');
}
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Function to initialize personas when the server starts
async function initializePersonas() {
  try {
    console.log('Checking if anime personas need to be initialized...');
    const existingPersonas = await storage.getPersonas();
    
    // Check if anime personas exist by looking for specific anime character names
    const animeNames = ['Naruto Uzumaki', 'Spike Spiegel', 'Sailor Moon', 'Goku', 'Levi Ackerman', 'Totoro', 'Mikasa Ackerman', 'L Lawliet'];
    const existingAnimePersonas = existingPersonas.filter(p => animeNames.includes(p.name));
    
    console.log(`Found ${existingPersonas.length} total personas, including ${existingAnimePersonas.length} anime personas.`);
    
    if (existingAnimePersonas.length < animeNames.length) {
      console.log('Some anime personas are missing, forcing initialization...');
      
      // Force the initialization of sample data
      await storage.initSampleData();
      
      // Verify the personas were created
      const updatedPersonas = await storage.getPersonas();
      const updatedAnimePersonas = updatedPersonas.filter(p => animeNames.includes(p.name));
      console.log(`After initialization: ${updatedPersonas.length} total personas, ${updatedAnimePersonas.length} anime personas.`);
    } else {
      console.log('All anime personas already exist, no need to initialize.');
    }
  } catch (error) {
    console.error('Error initializing personas:', error);
  }
}

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize personas when the server starts
  await initializePersonas();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only\\\\\\ port that is not firewalled.
  const port = 5002;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
