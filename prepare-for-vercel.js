#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the api directory exists
if (!fs.existsSync(path.join(__dirname, 'api'))) {
  console.log('Creating api directory');
  fs.mkdirSync(path.join(__dirname, 'api'));
}

// Compile TypeScript files
console.log('Compiling TypeScript files...');
try {
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  console.log('TypeScript compilation successful');
} catch (error) {
  console.error('Error compiling TypeScript:', error);
  process.exit(1);
}

console.log('Setup complete! Your project is ready for Vercel deployment.');
console.log('Remember to set these environment variables in Vercel:');
console.log('- DATABASE_URL');
console.log('- SESSION_SECRET');
console.log('- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
console.log('- GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
console.log('- DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET');
