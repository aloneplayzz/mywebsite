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
        return `${msg.user.username}: ${msg.message}`;
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
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}
