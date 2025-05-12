import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { generateAIResponse } from './openai';
import { ChatMessage, InsertMessage } from '@shared/schema';

interface WebSocketClient extends WebSocket {
  userId?: number;
  roomId?: number;
}

interface WSMessage {
  type: string;
  payload: any;
}

export function setupWebsockets(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data: WSMessage = JSON.parse(message);
        
        switch (data.type) {
          case 'join_room':
            handleJoinRoom(ws, data.payload);
            break;
            
          case 'leave_room':
            handleLeaveRoom(ws);
            break;
            
          case 'send_message':
            await handleSendMessage(ws, data.payload);
            break;
            
          case 'ping':
            // Respond with pong to keep connection alive
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
          default:
            console.warn('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        sendErrorToClient(ws, 'Failed to process your request');
      }
    });
    
    ws.on('close', () => {
      // Clean up when client disconnects
      handleLeaveRoom(ws);
      console.log('WebSocket client disconnected');
    });
  });
  
  // Function to handle room joining
  function handleJoinRoom(ws: WebSocketClient, { userId, roomId }: { userId: number, roomId: number }) {
    ws.userId = userId;
    ws.roomId = roomId;
    
    // Add user to active users list
    storage.addActiveUser(roomId, userId);
    
    // Broadcast user joined to all clients in the room
    broadcastToRoom(roomId, {
      type: 'user_joined',
      payload: { userId, roomId }
    });
    
    // Send room history to the new user
    sendRoomHistory(ws, roomId);
    
    // Send active users list to all clients in the room
    broadcastActiveUsers(roomId);
  }
  
  // Function to handle room leaving
  function handleLeaveRoom(ws: WebSocketClient) {
    const { userId, roomId } = ws;
    
    if (userId && roomId) {
      // Remove user from active users list
      storage.removeActiveUser(roomId, userId);
      
      // Broadcast user left to all clients in the room
      broadcastToRoom(roomId, {
        type: 'user_left',
        payload: { userId, roomId }
      });
      
      // Send updated active users list to all clients in the room
      broadcastActiveUsers(roomId);
      
      // Reset client data
      ws.userId = undefined;
      ws.roomId = undefined;
    }
  }
  
  // Function to handle sending messages
  async function handleSendMessage(ws: WebSocketClient, { message, personaId }: { message: string, personaId?: number }) {
    const { userId, roomId } = ws;
    
    if (!userId || !roomId) {
      return sendErrorToClient(ws, 'You must join a room before sending messages');
    }
    
    // Store the user message
    const userMessage = await storage.createMessage({
      roomId,
      userId,
      message,
      personaId: undefined,
    });
    
    // Augment with user info
    const user = await storage.getUser(userId);
    const chatMessage: ChatMessage = {
      ...userMessage,
      user
    };
    
    // Broadcast the message to all clients in the room
    broadcastToRoom(roomId, {
      type: 'new_message',
      payload: chatMessage
    });
    
    // If a persona is selected, generate an AI response
    if (personaId) {
      // Send typing indicator
      broadcastToRoom(roomId, {
        type: 'persona_typing',
        payload: { personaId, roomId }
      });
      
      // Get recent messages for context
      const recentMessages = await storage.getMessagesByRoom(roomId, 10);
      
      // Get persona details
      const persona = await storage.getPersona(personaId);
      
      if (persona) {
        try {
          // Generate AI response
          const aiResponse = await generateAIResponse(persona, recentMessages);
          
          // Store the AI message
          const aiMessage = await storage.createMessage({
            roomId,
            userId: undefined,
            personaId,
            message: aiResponse,
          });
          
          // Augment with persona info
          const chatAiMessage: ChatMessage = {
            ...aiMessage,
            persona
          };
          
          // Broadcast the AI message to all clients in the room
          broadcastToRoom(roomId, {
            type: 'new_message',
            payload: chatAiMessage
          });
        } catch (error) {
          console.error('Error generating AI response:', error);
          broadcastToRoom(roomId, {
            type: 'ai_error',
            payload: { personaId, error: 'Failed to generate AI response' }
          });
        }
      }
    }
  }
  
  // Helper function to broadcast a message to all clients in a room
  function broadcastToRoom(roomId: number, data: WSMessage) {
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Helper function to send room history to a client
  async function sendRoomHistory(ws: WebSocketClient, roomId: number) {
    try {
      const messages = await storage.getMessagesByRoom(roomId);
      ws.send(JSON.stringify({
        type: 'room_history',
        payload: messages
      }));
    } catch (error) {
      console.error('Error sending room history:', error);
      sendErrorToClient(ws, 'Failed to load room history');
    }
  }
  
  // Helper function to broadcast active users list to all clients in a room
  function broadcastActiveUsers(roomId: number) {
    const activeUsers = storage.getActiveUsers(roomId);
    
    broadcastToRoom(roomId, {
      type: 'active_users',
      payload: { roomId, activeUsers }
    });
  }
  
  // Helper function to send error message to a client
  function sendErrorToClient(ws: WebSocketClient, errorMessage: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: errorMessage }
      }));
    }
  }
  
  return wss;
}
