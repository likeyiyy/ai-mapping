// 对话树节点结构
export interface ConversationNode {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  model?: string; // AI模型名称
  parentId: string | null;
  children: string[]; // 子节点ID数组
  metadata: {
    timestamp: Date;
    tokens?: number;
    cost?: number;
  };
  position?: { x: number; y: number }; // 思维导图中的位置
}

// 对话树结构
export interface ConversationTree {
  id: string;
  title: string;
  rootNode: string;
  nodes: Map<string, ConversationNode>;
  layout: 'tree' | 'radial' | 'force';
  createdAt: Date;
  updatedAt: Date;
}

// AI模型配置
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken: number;
}

// 对话消息
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}