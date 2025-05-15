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

// Get all personas
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const personas = await storage.getPersonas();
    res.json(personas);
  } catch (error) {
    console.error('Error getting personas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific persona
router.get('/:personaId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { personaId } = req.params;
    const persona = await storage.getPersona(personaId);
    
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    
    res.json(persona);
  } catch (error) {
    console.error('Error getting persona:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new persona
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { name, description, avatar, prompt } = req.body;
    const persona = await storage.createPersona({
      name,
      description,
      avatar,
      prompt,
      createdBy: req.user.id
    });
    
    res.status(201).json(persona);
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a persona
router.put('/:personaId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { personaId } = req.params;
    const { name, description, avatar, prompt } = req.body;
    
    // Check if user is the creator of the persona
    const persona = await storage.getPersona(personaId);
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    
    if (persona.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this persona' });
    }
    
    const updatedPersona = await storage.updatePersona(personaId, {
      name,
      description,
      avatar,
      prompt
    });
    
    res.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a persona
router.delete('/:personaId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const storage = await ensureStorage();
    if (!storage) {
      return res.status(503).json({ error: 'Storage not initialized' });
    }
    
    const { personaId } = req.params;
    
    // Check if user is the creator of the persona
    const persona = await storage.getPersona(personaId);
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    
    if (persona.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this persona' });
    }
    
    await storage.deletePersona(personaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
