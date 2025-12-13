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
  initialMessage?: string; // 初始消息（用于首次创建会话）
  initialModel?: string; // 初始模型（用于首次创建会话）
}

// Convert Map to object for MongoDB storage
export function serializeMap(map: Map<string, any> | Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};

  // Check if it's already a plain object
  if (map && typeof map === 'object' && !(map instanceof Map)) {
    return map as Record<string, any>;
  }

  // Handle Map case
  if (map instanceof Map) {
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
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

    // Convert nodes object back to Map and ensure all required fields are present
    // Handle case where nodes might be empty object or Map
    let nodesMap: Map<string, ConversationNodeDB>;
    if (!doc.nodes || (typeof doc.nodes === 'object' && Object.keys(doc.nodes).length === 0)) {
      nodesMap = new Map();
    } else {
      nodesMap = deserializeMap(doc.nodes);
    }

    return {
      id: doc.id,
      title: doc.title,
      rootNode: doc.rootNode,
      nodes: nodesMap,
      layout: doc.layout || 'tree',
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      userId: doc.userId,
      initialMessage: doc.initialMessage,
      initialModel: doc.initialModel,
      _id: doc._id
    };
  }

  // Get all conversations (for a user, if userId is provided)
  async getAllConversations(userId?: string): Promise<ConversationTreeDB[]> {
    const collection = this.db.collection(this.collectionName);
    const filter = userId ? { userId } : {};

    const docs = await collection.find(filter).sort({ updatedAt: -1 }).toArray();

    return docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      rootNode: doc.rootNode,
      nodes: deserializeMap(doc.nodes),
      layout: doc.layout || 'tree',
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      userId: doc.userId,
      initialMessage: doc.initialMessage,
      initialModel: doc.initialModel,
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