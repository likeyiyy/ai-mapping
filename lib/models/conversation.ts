import { Db, ObjectId } from 'mongodb';

export interface ConversationNodeDB {
  _id?: ObjectId;
  id: string;
  type: 'user' | 'assistant';
  content: string;
  model?: string;
  parentId: string | null;
  children: string[];
  metadata: {
    timestamp: Date;
    tokens?: number;
    cost?: number;
  };
  position?: { x: number; y: number };
}

export interface ConversationTreeDB {
  _id?: ObjectId;
  id: string;
  title: string;
  rootNode: string;
  nodes: Map<string, ConversationNodeDB>;
  layout: 'tree' | 'radial' | 'force';
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For future multi-user support
}

// Convert Map to object for MongoDB storage
export function serializeMap(map: Map<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

// Convert object to Map after retrieving from MongoDB
export function deserializeMap(obj: Record<string, any>): Map<string, any> {
  const map = new Map();
  for (const [key, value] of Object.entries(obj)) {
    map.set(key, value);
  }
  return map;
}

export class ConversationService {
  private db: Db;
  private collectionName = 'conversations';

  constructor(database: Db) {
    this.db = database;
  }

  // Create or update a conversation tree
  async saveConversation(conversation: Omit<ConversationTreeDB, '_id'>): Promise<ObjectId> {
    const collection = this.db.collection(this.collectionName);

    // Convert nodes Map to object for storage
    const conversationToSave = {
      ...conversation,
      nodes: serializeMap(conversation.nodes),
      updatedAt: new Date()
    };

    // Check if conversation already exists
    const existing = await collection.findOne({ id: conversation.id });

    if (existing) {
      // Update existing conversation
      await collection.updateOne(
        { id: conversation.id },
        { $set: conversationToSave }
      );
      return existing._id;
    } else {
      // Create new conversation
      const result = await collection.insertOne(conversationToSave as any);
      return result.insertedId;
    }
  }

  // Get a conversation by ID
  async getConversation(id: string): Promise<ConversationTreeDB | null> {
    const collection = this.db.collection(this.collectionName);
    const doc = await collection.findOne({ id });

    if (!doc) return null;

    // Convert nodes object back to Map
    return {
      ...doc,
      nodes: deserializeMap(doc.nodes),
      _id: doc._id
    };
  }

  // Get all conversations (for a user, if userId is provided)
  async getAllConversations(userId?: string): Promise<ConversationTreeDB[]> {
    const collection = this.db.collection(this.collectionName);
    const filter = userId ? { userId } : {};

    const docs = await collection.find(filter).sort({ updatedAt: -1 }).toArray();

    return docs.map(doc => ({
      ...doc,
      nodes: deserializeMap(doc.nodes),
      _id: doc._id
    }));
  }

  // Delete a conversation
  async deleteConversation(id: string): Promise<boolean> {
    const collection = this.db.collection(this.collectionName);
    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Create indexes for better performance
  async createIndexes(): Promise<void> {
    const collection = this.db.collection(this.collectionName);
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ updatedAt: -1 });
  }
}