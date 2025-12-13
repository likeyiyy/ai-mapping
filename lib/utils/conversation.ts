/**
 * 对话树节点操作工具函数
 */
import { ConversationNode, ConversationTree } from '@/lib/types';
import { AI_MODELS } from '@/lib/constants';
import { generateId } from 'ai';

/**
 * 创建用户节点
 */
export function createUserNode(
  content: string,
  parentId: string | null = null
): ConversationNode {
  return {
    id: generateId(),
    type: 'user',
    content,
    parentId,
    children: [],
    metadata: {
      timestamp: new Date(),
    },
    position: { x: 0, y: 0 },
  };
}

/**
 * 创建 AI 节点
 */
export function createAINode(
  modelId: string,
  parentId: string,
  content: string = ''
): ConversationNode {
  const modelDisplayName = AI_MODELS.find(m => m.id === modelId)?.name || modelId;

  return {
    id: generateId(),
    type: 'assistant',
    content,
    model: modelDisplayName,
    parentId,
    children: [],
    metadata: {
      timestamp: new Date(),
    },
    position: { x: 400, y: 0 },
  };
}

/**
 * 创建新的对话树
 */
export function createConversationTree(
  userMessage: string,
  userId: string,
  aiId: string,
  conversationId?: string
): ConversationTree {
  return {
    id: conversationId || generateId(),
    title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
    rootNode: userId,
    nodes: new Map(),
    layout: 'tree',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 更新 AI 节点内容的辅助函数
 */
export function updateAINodeContent(
  nodes: Map<string, ConversationNode>,
  aiNodeId: string,
  content: string
): Map<string, ConversationNode> {
  const updatedNodes = new Map(nodes);
  const currentAINode = updatedNodes.get(aiNodeId);
  if (currentAINode) {
    updatedNodes.set(aiNodeId, {
      ...currentAINode,
      content,
    });
  }
  return updatedNodes;
}

/**
 * 添加子节点到对话树
 */
export function addChildNodeToTree(
  tree: ConversationTree,
  childNode: ConversationNode,
  aiNode: ConversationNode,
  parentId: string
): ConversationTree {
  const updatedNodes = new Map(tree.nodes);
  updatedNodes.set(childNode.id, childNode);
  updatedNodes.set(aiNode.id, aiNode);

  // 更新父节点
  const parentNode = updatedNodes.get(parentId);
  if (parentNode) {
    parentNode.children.push(childNode.id);
    updatedNodes.set(parentId, parentNode);
  }

  return {
    ...tree,
    nodes: updatedNodes,
    updatedAt: new Date(),
  };
}
