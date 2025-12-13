/**
 * 流式聊天 Hook
 * 处理 AI 对话的流式响应和状态更新
 */
import { useCallback } from 'react';
import { ConversationTree, ConversationNode } from '@/lib/types';
import { callChatAPI } from '@/lib/api/chat';
import { updateAINodeContent } from '@/lib/utils/conversation';
import toast from 'react-hot-toast';

interface UseStreamingChatOptions {
  conversationTree: ConversationTree | null;
  setConversationTree: (tree: ConversationTree | null) => void;
  setIsLoading: (loading: boolean) => void;
  setStreamingNodeId: (id: string | null) => void;
}

export function useStreamingChat({
  conversationTree,
  setConversationTree,
  setIsLoading,
  setStreamingNodeId,
}: UseStreamingChatOptions) {
  /**
   * 处理流式 AI 响应
   */
  const handleStreamingResponse = useCallback(
    async (
      message: string,
      model: string,
      aiNodeId: string
    ): Promise<string> => {
      return await callChatAPI(message, model, (chunk) => {
        // 实时更新 AI 节点内容
        setConversationTree((prev) => {
          if (!prev) return prev;
          const currentAINode = prev.nodes.get(aiNodeId);
          if (currentAINode) {
            const updatedNodes = updateAINodeContent(
              prev.nodes,
              aiNodeId,
              currentAINode.content + chunk
            );
            return {
              ...prev,
              nodes: updatedNodes,
            };
          }
          return prev;
        });
      });
    },
    [setConversationTree]
  );

  /**
   * 最终更新 AI 节点内容
   */
  const finalizeAIResponse = useCallback(
    (aiNodeId: string, fullResponse: string) => {
      setConversationTree((prev) => {
        if (!prev) return prev;
        const updatedNodes = updateAINodeContent(
          prev.nodes,
          aiNodeId,
          fullResponse
        );
        return {
          ...prev,
          nodes: updatedNodes,
          updatedAt: new Date(),
        };
      });
    },
    [setConversationTree]
  );

  /**
   * 执行流式聊天请求
   */
  const executeStreamingChat = useCallback(
    async (
      message: string,
      model: string,
      aiNodeId: string
    ): Promise<void> => {
      setIsLoading(true);
      setStreamingNodeId(aiNodeId);

      try {
        const fullResponse = await handleStreamingResponse(
          message,
          model,
          aiNodeId
        );
        console.log('Streaming chat completed, finalizing response...');
        finalizeAIResponse(aiNodeId, fullResponse);
        
        // 流式聊天完成后，确保保存到数据库
        // 注意：这里依赖 useConversationPersistence 的自动保存机制
        // 如果自动保存失败，会在 3 秒后触发
        console.log('AI response finalized, waiting for auto-save...');
      } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        toast.error('AI 响应失败: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsLoading(false);
        setStreamingNodeId(null);
      }
    },
    [handleStreamingResponse, finalizeAIResponse, setIsLoading, setStreamingNodeId]
  );

  return {
    executeStreamingChat,
  };
}
