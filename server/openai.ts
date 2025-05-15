import { Persona, ChatMessage } from "@shared/schema";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
// Load environment variables from .env file if it exists
import dotenv from 'dotenv';

// Only load dotenv if the .env file exists
try {
  if (fs.existsSync('.env')) {
    dotenv.config();
    console.log('[OpenAI] Loaded environment variables from .env file');
  } else {
    console.log('[OpenAI] .env file not found, using environment variables from the system');
  }
} catch (error) {
  console.warn('[OpenAI] Error loading .env file:', error);
}

// Mock responses for different persona types as fallback
const mockResponses = {
  "Nova": [
    "My cybernetic enhancements are detecting unusual patterns in this conversation. Fascinating.",
    "In the digital underworld, information is the most valuable currency. What secrets do you seek?",
    "I've hacked into systems more complex than you can imagine. This challenge is trivial by comparison.",
    "The neural interface is stable, but I'm detecting anomalies in the network. Stay alert.",
    "My implants are processing multiple data streams simultaneously. Your question is just one of many."
  ],
  "Elara": [
    "The stars have always guided my people through the darkest nights. Let them guide you too.",
    "My elven senses perceive much that remains hidden to mortal eyes. The forest speaks to those who listen.",
    "Magic flows through all living things, connecting us to the ancient wisdom of the world.",
    "I have walked these lands for centuries and still find wonder in the smallest flower.",
    "The balance between light and shadow must be maintained. That is the first lesson of arcane wisdom."
  ],
  "Captain Drake": [
    "Arrr, me hearty! The seas be treacherous today, but me ship has weathered worse storms!",
    "I've buried treasure on islands that don't appear on any map. The secret dies with me!",
    "In all me years sailing the seven seas, I've never encountered a beast I couldn't defeat!",
    "A good captain knows when to fight and when to flee. Today we stand our ground!",
    "The code of the pirates is simple: take what ye can, give nothing back!"
  ],
  "default": [
    "I'm intrigued by your perspective. Please tell me more.",
    "That's a fascinating point you've raised. I'd like to explore that further.",
    "I'm processing what you've shared. It's quite thought-provoking.",
    "Your ideas are compelling. I'm curious about where this conversation will lead.",
    "I appreciate you sharing that with me. Let's continue this discussion."
  ]
};

// Get the Gemini API key from environment variables
let envConfig: Record<string, string> = {};

// Try to load from .env file, but don't fail if it doesn't exist
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log("Loaded Gemini API key from .env file");
  } else {
    console.log("No .env file found for Gemini API key, using system environment variables");
  }
} catch (error) {
  console.warn("Error reading .env file for Gemini API key:", error);
  console.log("Falling back to system environment variables");
}

// Initialize the Gemini API with the API key from .env or environment variables
const apiKey = envConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
console.log("Using Gemini API Key:", apiKey ? "[Key is set]" : "[No key found]");

let genAI: any;
let model: any;

try {
  genAI = new GoogleGenerativeAI(apiKey);
  
  // Configure the Gemini model - using Gemini 1.5 Flash model
  model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });
  console.log("Gemini model initialized successfully");
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
  console.log("Will use mock responses as fallback");
}

export async function generateAIResponse(persona: Persona, messages: ChatMessage[]): Promise<string> {
  // Try to use Gemini API first
  if (model) {
    try {
      // The first message in the array should be the latest user message (based on our websocket.ts changes)
      const latestUserMessage = messages[0]?.message || "";
      const userName = messages[0]?.user?.firstName || 
                     (messages[0]?.user?.email ? messages[0]?.user?.email.split('@')[0] : 'User');
      
      // Format the previous messages for minimal context
      const previousMessages = messages.slice(1).map(msg => {
        if (msg.persona) {
          return `${msg.persona.name}: ${msg.message}`;
        } else if (msg.user) {
          const msgUserName = msg.user.firstName || 
                           (msg.user.email ? msg.user.email.split('@')[0] : 'User');
          return `${msgUserName}: ${msg.message}`;
        } else {
          return `Unknown: ${msg.message}`;
        }
      }).join("\n");

      // Create a very focused prompt for Gemini that prioritizes the latest message
      const prompt = `You are ${persona.name}. ${persona.description}. 

You must ALWAYS speak in the style of your character. Stay in character no matter what.

The user (${userName}) has just said to you: "${latestUserMessage}"

This is the message you MUST respond to right now.

For minimal context, here are a few previous messages (but focus on responding to the latest message above):
${previousMessages}

Respond DIRECTLY to "${latestUserMessage}" as ${persona.name}. 
Your response must be concise (1-2 sentences) and DIRECTLY relevant to what was just asked.
DO NOT repeat previous responses or acknowledge previous conversations.
Respond as if this is the first time you're addressing this specific message.

${persona.samplePrompt || ''}`;

      // Generate content using Gemini
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      return text || "I'm not sure what to say at the moment.";
    } catch (error: any) {
      console.error("Error generating AI response with Gemini:", error);
      
      // Log detailed error information
      if (error.message) console.error("Error message:", error.message);
      if (error.stack) console.error("Error stack:", error.stack);
      
      console.log("Falling back to mock responses due to Gemini API error");
      // Fall back to mock responses
      return getMockResponse(persona);
    }
  } else {
    // Gemini API not available, use mock responses
    console.log("Using mock responses as Gemini API is not available");
    return getMockResponse(persona);
  }
}

// Function to get a mock response based on persona and latest message
function getMockResponse(persona: Persona): string {
  const personaName = persona.name;
  const availableResponses = mockResponses[personaName as keyof typeof mockResponses] || mockResponses.default;
  
  // Select a random response from the available options
  const randomIndex = Math.floor(Math.random() * availableResponses.length);
  return availableResponses[randomIndex];
}
