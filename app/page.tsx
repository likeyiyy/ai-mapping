'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationTree } from '@/lib/types';
import { DEFAULT_AI_MODEL } from '@/lib/constants';
import HomePage from '@/components/HomePage';
import MindMapFlow from '@/components/MindMapFlow';
import ConversationHeader from '@/components/ConversationHeader';
import { useConversationPersistence } from '@/hooks/useConversationPersistence';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useConversationActions } from '@/hooks/useConversationActions';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [conversationTree, setConversationTree] = useState<ConversationTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel] = useState(DEFAULT_AI_MODEL);
  const [streamingNodeId, setStreamingNodeId] = useState<string | null>(null);

  // Initialize persistence hook
  const { createNewConversation } = useConversationPersistence({
    conversationTree,
    setConversationTree,
    onSaveSuccess: () => {
      // Success messages are shown in ConversationActions component
    },
    onSaveError: (error) => {
      toast.error(error);
    },
  });

  // Initialize streaming chat hook
  const { executeStreamingChat } = useStreamingChat({
    conversationTree,
    setConversationTree,
    setIsLoading,
    setStreamingNodeId,
  });

  // Initialize conversation actions hook
  const { startConversation, addChildNode } = useConversationActions({
    conversationTree,
    setConversationTree,
    executeStreamingChat,
  });

  // Handle new message
  const handleMessage = useCallback(
    async (message: string, model?: string) => {
      const actualModel = model || selectedModel;
      if (!conversationTree) {
        // 先创建初始对话，获取 UUID（message 和 model 会保存到数据库）
        const { createInitialConversation } = await import('@/lib/api/conversations');
        const result = await createInitialConversation(message, actualModel);
        
        if (result.success && result.data?.id) {
          // 路由到新创建的对话页面（不暴露 message 和 model）
          router.push(`/chat/${result.data.id}`);
        } else {
          toast.error(result.error || 'Failed to create conversation');
        }
      }
    },
    [conversationTree, selectedModel, router]
  );

  // If no conversation tree, show home page
  if (!conversationTree) {
    return <HomePage onStartChat={handleMessage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ConversationHeader
        conversationTree={conversationTree}
        onNewConversation={createNewConversation}
        onLoadConversation={(conv) => {
          setConversationTree(conv);
          router.push(`/chat/${conv.id}`);
        }}
      />

      {/* MindMap Container */}
      <div className="pt-16">
        <MindMapFlow
          conversationTree={conversationTree}
          onAddChild={addChildNode}
          selectedModel={selectedModel}
          isLoading={isLoading}
          streamingNodeId={streamingNodeId}
        />
      </div>
    </div>
  );
}