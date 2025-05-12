import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { generateAIResponse } from './openai';

interface ClientInfo {
  userId?: number;
  roomId?: number;
}

interface ChatMessage {
  type: 'message';
  roomId: number;
  userId?: number;
  personaId?: number;
  message: string;
  timestamp: string;
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<WebSocket, ClientInfo>();

  wss.on('connection', (ws) => {
    // Initialize client info
    clients.set(ws, {});

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'join':
            handleJoinRoom(ws, message.roomId, message.userId);
            break;
          case 'message':
            await handleChatMessage(ws, message);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  async function handleJoinRoom(ws: WebSocket, roomId: number, userId?: number) {
    // Update client info
    clients.set(ws, { roomId, userId });

    // Send recent messages to the client
    try {
      const messages = await storage.getMessages(roomId);
      if (messages.length > 0) {
        ws.send(JSON.stringify({
          type: 'history',
          messages: messages
        }));
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  }

  async function handleChatMessage(ws: WebSocket, messageData: ChatMessage) {
    const clientInfo = clients.get(ws);
    if (!clientInfo || !clientInfo.roomId) return;

    try {
      // Store message in database
      const savedMessage = await storage.createMessage({
        room_id: messageData.roomId,
        user_id: messageData.userId,
        persona_id: messageData.personaId,
        message: messageData.message
      });

      // Broadcast message to all clients in the same room
      broadcastToRoom(clientInfo.roomId, {
        type: 'message',
        id: savedMessage.id,
        roomId: savedMessage.room_id,
        userId: savedMessage.user_id,
        personaId: savedMessage.persona_id,
        message: savedMessage.message,
        timestamp: savedMessage.created_at.toISOString()
      });

      // If no persona is selected and message is from a user, generate AI responses
      if (!messageData.personaId && messageData.userId) {
        await generateAIResponses(clientInfo.roomId, savedMessage);
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }

  function broadcastToRoom(roomId: number, message: any) {
    for (const [client, info] of clients.entries()) {
      if (info.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  async function generateAIResponses(roomId: number, userMessage: any) {
    try {
      // Get the chatroom details
      const chatroom = await storage.getChatroom(roomId);
      if (!chatroom) return;

      // Get active personas for this room
      const personas = await storage.getPersonas();
      if (!personas.length) return;

      // Get recent messages for context
      const recentMessages = await storage.getMessages(roomId);
      const lastMessages = recentMessages.slice(-10);

      // Choose a random persona to respond
      const randomPersona = personas[Math.floor(Math.random() * personas.length)];

      // Send typing indicator
      broadcastToRoom(roomId, {
        type: 'typing',
        personaId: randomPersona.id,
        personaName: randomPersona.name
      });

      // Generate AI response
      const aiResponse = await generateAIResponse(randomPersona, lastMessages, chatroom);

      // Save and broadcast AI message
      if (aiResponse) {
        const aiMessage = await storage.createMessage({
          room_id: roomId,
          persona_id: randomPersona.id,
          message: aiResponse
        });

        broadcastToRoom(roomId, {
          type: 'message',
          id: aiMessage.id,
          roomId: aiMessage.room_id,
          personaId: aiMessage.persona_id,
          message: aiMessage.message,
          timestamp: aiMessage.created_at.toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  return wss;
}
