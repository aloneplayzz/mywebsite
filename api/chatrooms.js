import express from 'express';
import { initializeDatabase } from './db.js';

const router = express.Router();
let storage = null;

// Initialize database and storage
async function ensureStorage() {
  if (!storage) {
    const { storage: storageInstance } = await initializeDatabase();
    storage = storageInstance;
  }
  return storage;
}

// Get all chatrooms for the current user
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const chatrooms = await storage.getChatrooms(req.user.id);
    res.json(chatrooms);
  } catch (error) {
    console.error('Error getting chatrooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific chatroom
router.get('/:chatroomId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    const chatroom = await storage.getChatroom(chatroomId);
    
    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }
    
    // Check if user is a member of the chatroom
    const isMember = await storage.isChatroomMember(chatroomId, req.user.id);
    if (!isMember && !chatroom.isPublic) {
      return res.status(403).json({ error: 'Not authorized to view this chatroom' });
    }
    
    res.json(chatroom);
  } catch (error) {
    console.error('Error getting chatroom:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new chatroom
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { name, description, isPublic } = req.body;
    const chatroom = await storage.createChatroom({
      name,
      description,
      ownerId: req.user.id,
      isPublic: isPublic || false
    });
    
    res.status(201).json(chatroom);
  } catch (error) {
    console.error('Error creating chatroom:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a chatroom
router.put('/:chatroomId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    const { name, description, isPublic } = req.body;
    
    // Check if user is the owner of the chatroom
    const chatroom = await storage.getChatroom(chatroomId);
    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }
    
    if (chatroom.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this chatroom' });
    }
    
    const updatedChatroom = await storage.updateChatroom(chatroomId, {
      name,
      description,
      isPublic
    });
    
    res.json(updatedChatroom);
  } catch (error) {
    console.error('Error updating chatroom:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a chatroom
router.delete('/:chatroomId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    
    // Check if user is the owner of the chatroom
    const chatroom = await storage.getChatroom(chatroomId);
    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }
    
    if (chatroom.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this chatroom' });
    }
    
    await storage.deleteChatroom(chatroomId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chatroom:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a chatroom
router.get('/:chatroomId/messages', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    
    // Check if user is a member of the chatroom
    const isMember = await storage.isChatroomMember(chatroomId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to view messages in this chatroom' });
    }
    
    const messages = await storage.getChatroomMessages(chatroomId);
    res.json(messages);
  } catch (error) {
    console.error('Error getting chatroom messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message to a chatroom
router.post('/:chatroomId/messages', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    const { content, personaId } = req.body;
    
    // Check if user is a member of the chatroom
    const isMember = await storage.isChatroomMember(chatroomId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to send messages to this chatroom' });
    }
    
    const message = await storage.createChatroomMessage(chatroomId, {
      content,
      senderId: req.user.id,
      personaId
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending chatroom message:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
