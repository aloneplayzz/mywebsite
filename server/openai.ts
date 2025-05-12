import OpenAI from "openai";
import { Persona, ChatMessage } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIResponse(persona: Persona, messages: ChatMessage[]): Promise<string> {
  try {
    // Format the recent messages for context
    const formattedMessages = messages.map(msg => {
      if (msg.persona) {
        return `${msg.persona.name}: ${msg.message}`;
      } else if (msg.user) {
        // Use firstName, email, or generic "User" as fallback
        const userName = msg.user.firstName || 
                        (msg.user.email ? msg.user.email.split('@')[0] : 'User');
        return `${userName}: ${msg.message}`;
      } else {
        return `Unknown: ${msg.message}`;
      }
    }).join("\n");

    // Create the prompt for the AI
    const prompt = `You are ${persona.name}. ${persona.description}. You're chatting in a themed room. 
Speak in the style of your character. Here is the chat history:

${formattedMessages}

Respond as ${persona.name} in 1-2 sentences. ${persona.samplePrompt}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || "I'm not sure what to say at the moment.";
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    
    // Handle rate limit errors specifically
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return "I'm currently unavailable due to API rate limits. Please try again later or contact the administrator to check the OpenAI API quota.";
    } else if (error.code === 'invalid_api_key' || error.status === 401) {
      return "I'm currently offline due to API authentication issues. Please contact the administrator to check the OpenAI API key.";
    }
    
    // Generic error
    throw new Error("Failed to generate AI response");
  }
}
