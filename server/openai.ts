import OpenAI from "openai";
import type { Persona, Message, Chatroom } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIResponse(
  persona: Persona,
  recentMessages: Message[],
  chatroom: Chatroom
): Promise<string> {
  try {
    // Format recent messages for context
    const messageHistory = recentMessages.map(msg => {
      let sender = "User";
      if (msg.persona_id) {
        // This is an AI message
        sender = `AI Persona (${persona.name})`;
      }
      return `${sender}: ${msg.message}`;
    }).join("\n");

    // Create the prompt for the AI
    const prompt = `You are ${persona.name}. You're chatting in a themed room called "${chatroom.name}" with the description: "${chatroom.description}". 
    
${persona.sample_prompt}

Here is the chat history:

${messageHistory}

Respond as ${persona.name} in 1–2 sentences.`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model
      messages: [
        { role: "system", content: "You are roleplaying as a character in a themed chatroom." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I seem to be having trouble connecting to my thoughts right now.";
  }
}
