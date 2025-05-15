import { storage } from './storage';

// Force initialization of anime personas
async function initAnimePersonas() {
  try {
    console.log('Starting initialization of anime personas...');
    
    // Get existing personas
    const existingPersonas = await storage.getPersonas();
    console.log(`Found ${existingPersonas.length} existing personas`);
    
    // If there are no personas or if we want to force initialization
    if (existingPersonas.length === 0) {
      console.log('No personas found, initializing anime personas...');
      
      // This will trigger the initSampleData method which creates the anime personas
      await (storage as any).initSampleData();
      
      // Verify personas were created
      const newPersonas = await storage.getPersonas();
      console.log(`Successfully created ${newPersonas.length} personas`);
      console.log('Persona names:', newPersonas.map(p => p.name).join(', '));
    } else {
      console.log('Personas already exist, no need to initialize');
      console.log('Existing persona names:', existingPersonas.map(p => p.name).join(', '));
    }
    
    console.log('Persona initialization complete');
  } catch (error) {
    console.error('Error initializing anime personas:', error);
  }
}

// Run the initialization
initAnimePersonas().then(() => {
  console.log('Initialization script completed');
  process.exit(0);
}).catch(err => {
  console.error('Initialization script failed:', err);
  process.exit(1);
});
