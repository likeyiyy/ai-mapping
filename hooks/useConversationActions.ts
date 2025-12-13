/**
 * 对话操作 Hook
 * 封装对话的创建、添加子节点等操作
 */
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationTree } from '@/lib/types';
import {
  createUserNode,
  createAINode,
  createConversationTree,
  addChildNodeToTree,
} from '@/lib/utils/conversation';
import { saveConversation } from '@/lib/api/conversations';

interface UseConversationActionsOptions {
  conversationTree: ConversationTree | null;
  setConversationTree: (tree: ConversationTree | null) => void;
  executeStreamingChat: (message: string, model: string, aiNodeId: string) => Promise<void>;
}

export function useConversationActions({
  conversationTree,
  setConversationTree,
  executeStreamingChat,
}: UseConversationActionsOptions) {
  const router = useRouter();

  /**
   * 创建新对话
   */
  const startConversation = useCallback(
    async (message: string, model: string) => {
      // 创建节点
      const userNode = createUserNode(message, null);
      const aiNode = createAINode(model, userNode.id, '');
      userNode.children.push(aiNode.id);

      // 创建对话树
      const newTree = createConversationTree(message, userNode.id, aiNode.id);
      newTree.nodes.set(userNode.id, userNode);
      newTree.nodes.set(aiNode.id, aiNode);

      // 立即显示树（AI 回复为空）
      setConversationTree(newTree);

      // 先保存对话到数据库，确保可以加载
      try {
        await saveConversation(newTree);
      } catch (error) {
        console.error('Failed to save conversation before navigation:', error);
        // 继续执行，即使保存失败
      }

      // 执行流式聊天
      await executeStreamingChat(message, model, aiNode.id);

      // 流式聊天完成后导航到新页面
      router.push(`/chat/${newTree.id}`);
    },
    [executeStreamingChat, setConversationTree, router]
  );

  /**
   * 添加子节点到现有节点
   */
  const addChildNode = useCallback(
    async (parentId: string, message: string, model: string) => {
      if (!conversationTree) return;

      // 创建节点
      const childNode = createUserNode(message, parentId);
      const aiNode = createAINode(model, childNode.id, '');
      childNode.children.push(aiNode.id);

      // 更新对话树
      const updatedTree = addChildNodeToTree(
        conversationTree,
        childNode,
        aiNode,
        parentId
      );

      // 立即显示树（AI 回复为空）
      setConversationTree(updatedTree);

      // 执行流式聊天
      await executeStreamingChat(message, model, aiNode.id);
    },
    [conversationTree, executeStreamingChat, setConversationTree]
  );

  return {
    startConversation,
    addChildNode,
  };
}
