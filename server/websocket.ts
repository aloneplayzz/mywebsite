import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { generateAIResponse } from './openai';
<<<<<<< HEAD
import { ChatMessage, InsertMessage, InsertAttachment, attachmentTypes } from '@shared/schema';

interface WebSocketClient extends WebSocket {
  userId?: string;
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
            
          case 'send_attachment':
            await handleSendAttachment(ws, data.payload);
            break;
            
          case 'send_voice_message':
            await handleSendVoiceMessage(ws, data.payload);
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
  function handleJoinRoom(ws: WebSocketClient, { userId, roomId }: { userId: string, roomId: number }) {
    ws.userId = userId;
    ws.roomId = roomId;
    
    // Add user to active users list
    storage.addActiveUser(roomId, userId.toString());
    
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
      storage.removeActiveUser(roomId, userId.toString());
      
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
    
    try {
      // Store the user message
      const userMessage = await storage.createMessage({
        roomId,
        userId, // userId is already a string
        message,
        personaId: undefined,
      });
      
      // Augment with user info
      const user = await storage.getUser(userId.toString());
      const chatMessage: ChatMessage = {
        ...userMessage,
        user
      };
      
      // Broadcast the message to all clients in the room
      broadcastToRoom(roomId, {
        type: 'new_message',
        payload: chatMessage
      });
    
      // If a persona was specified, generate an AI response
      if (personaId) {
        try {
          // Send typing indicator
          broadcastToRoom(roomId, {
            type: 'persona_typing',
            payload: { personaId, roomId }
          });
          
          // Get the persona
          const persona = await storage.getPersona(personaId);
          if (!persona) {
            return sendErrorToClient(ws, 'Persona not found');
          }
          
          // Create a special context array with just the latest user message and minimal history
          // This ensures the AI responds to the current message
          const specialContext: ChatMessage[] = [
            // The latest user message (the one that was just sent)
            {
              ...userMessage,
              user
            }
          ];
          
          // Add a few previous messages for context, but not too many
          const previousMessages = await storage.getMessagesByRoom(roomId, 5);
          // Filter out the current message (which would be first in the list) and add only a few previous ones
          const filteredPreviousMessages = previousMessages
            .filter(msg => msg.id !== userMessage.id)
            .slice(0, 3);
          
          // Combine the context with the current message first (most important)
          const aiContext = [...specialContext, ...filteredPreviousMessages];
          
          // Generate AI response with focused context
          const aiResponse = await generateAIResponse(persona, aiContext);
          
          // Store the AI response
          const aiMessage = await storage.createMessage({
            roomId,
            userId: undefined,
            personaId,
            message: aiResponse,
          });
          
          // Augment with persona info
          const aiChatMessage: ChatMessage = {
            ...aiMessage,
            persona
          };
          
          // Broadcast the AI response to all clients in the room
          broadcastToRoom(roomId, {
            type: 'new_message',
            payload: aiChatMessage
          });
        } catch (error) {
          console.error('Error generating AI response:', error);
          
          try {
            // Get the persona for the error message
            const persona = await storage.getPersona(personaId);
            
            // Create a fallback error message from the persona
            const errorMessage = await storage.createMessage({
              roomId,
              userId: undefined,
              personaId,
              message: "I'm having trouble accessing my knowledge. Please try again later.",
            });
            
            const chatErrorMessage: ChatMessage = {
              ...errorMessage,
              persona
            };
            
            // Send error message to all users in the room as a regular message
            broadcastToRoom(roomId, {
              type: 'new_message', 
              payload: chatErrorMessage
            });
          } catch (storeError) {
            console.error('Error storing fallback message:', storeError);
            // If even the fallback fails, send an error event
            broadcastToRoom(roomId, {
              type: 'ai_error',
              payload: { personaId, error: 'Failed to generate AI response' }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendErrorToClient(ws, 'Failed to process your message');
    }
  }
  
  // Function to handle sending attachments
  async function handleSendAttachment(ws: WebSocketClient, {
    url,
    fileName,
    fileSize,
    fileType,
    attachmentType
  }: {
    url: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    attachmentType: string
  }) {
    const { userId, roomId } = ws;
    
    if (!userId || !roomId) {
      return sendErrorToClient(ws, 'You must join a room before sending attachments');
    }
    
    try {
      // Validate attachment type
      const validTypes = ['image', 'audio', 'video', 'document', 'voice_message'] as const;
      if (!validTypes.includes(attachmentType as any)) {
        return sendErrorToClient(ws, 'Invalid attachment type');
      }
      
      // First, create a message to hold the attachment
      const message = await storage.createMessage({
        roomId,
        userId,
        message: `Sent ${attachmentType}`, // Default message for attachment
      });
      
      // Then create the attachment linked to this message
      const attachment = await storage.createAttachment({
        messageId: message.id,
        url,
        fileName,
        fileSize,
        fileType,
        attachmentType: attachmentType as "image" | "audio" | "video" | "document" | "voice_message"
      });
      
      // Get user info
      const user = await storage.getUser(userId);
      
      // Construct the chat message with its attachment
      const chatMessage: ChatMessage = {
        ...message,
        user,
        attachments: [attachment]
      };
      
      // Broadcast the message with attachment to all clients in the room
      broadcastToRoom(roomId, {
        type: 'new_message',
        payload: chatMessage
      });
    } catch (error) {
      console.error('Error handling attachment:', error);
      sendErrorToClient(ws, 'Failed to process attachment');
    }
  }
  
  // Function to handle voice messages
  async function handleSendVoiceMessage(ws: WebSocketClient, {
    url,
    fileName,
    fileSize,
    fileType
  }: {
    url: string,
    fileName: string,
    fileSize: number,
    fileType: string
  }) {
    const { userId, roomId } = ws;
    
    if (!userId || !roomId) {
      return sendErrorToClient(ws, 'You must join a room before sending voice messages');
    }
    
    try {
      // First create the message
      const insertedMessage = await storage.createMessage({
        roomId,
        userId,
        message: "Voice message" // Default text for voice messages
      });
      
      // Then create the voice attachment
      const attachment = await storage.createAttachment({
        messageId: insertedMessage.id,
        url,
        fileName,
        fileSize,
        fileType: fileType || 'audio/webm',
        attachmentType: 'voice_message'
      });
      
      // Get user info
      const user = await storage.getUser(userId);
      
      // Create full chatMessage to broadcast
      const chatMessage: ChatMessage = {
        ...insertedMessage,
        user,
        attachments: [attachment]
      };
      
      // Broadcast the message to all clients in the room
      broadcastToRoom(roomId, {
        type: 'new_message',
        payload: chatMessage
      });
    } catch (error) {
      console.error('Error handling voice message:', error);
      sendErrorToClient(ws, 'Failed to process voice message');
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
  
=======

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

>>>>>>> ae322bb (Checkpoint before revert)
  return wss;
}
