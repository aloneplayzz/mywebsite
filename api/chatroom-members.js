import express from 'express';
import { Pool } from 'pg';
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

// Get members of a chatroom
router.get('/:chatroomId/members', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    const members = await storage.getChatroomMembers(chatroomId);
    res.json(members);
  } catch (error) {
    console.error('Error getting chatroom members:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a member to a chatroom
router.post('/:chatroomId/members', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId } = req.params;
    const { userId } = req.body;
    
    // Check if user is owner of the chatroom
    const chatroom = await storage.getChatroom(chatroomId);
    if (chatroom.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add members' });
    }
    
    await storage.addChatroomMember(chatroomId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding chatroom member:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a member from a chatroom
router.delete('/:chatroomId/members/:userId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { chatroomId, userId } = req.params;
    
    // Check if user is owner of the chatroom
    const chatroom = await storage.getChatroom(chatroomId);
    if (chatroom.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to remove members' });
    }
    
    await storage.removeChatroomMember(chatroomId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing chatroom member:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
