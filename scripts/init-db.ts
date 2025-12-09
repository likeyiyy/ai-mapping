#!/usr/bin/env ts-node

import { getDatabase } from '../lib/mongodb';
import { ConversationService } from '../lib/models/conversation';

async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const db = await getDatabase();
    const service = new ConversationService(db);

    console.log('Creating indexes...');
    await service.createIndexes();

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initDatabase().then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

export { initDatabase };