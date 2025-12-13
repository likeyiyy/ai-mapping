'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationNode, ConversationTree } from '@/lib/types';
import { AI_MODELS, DEFAULT_AI_MODEL } from '@/lib/constants';
import ChatInput from '@/components/ChatInput';
import MindMapFlow from '@/components/MindMapFlow';
import ConversationActions from '@/components/ConversationActions';
import { generateId } from 'ai';
import { GitBranch } from 'lucide-react';
import { useConversationPersistence } from '@/hooks/useConversationPersistence';
import toast from 'react-hot-toast';

// Function to call our API route with streaming support
async function callChatAPI(
  message: string,
  model: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch('/api/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, model, stream: !!onChunk }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API error: ${response.status} - ${error.error || 'Unknown error'}`);
  }

  if (onChunk) {
    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }

    return fullResponse;
  } else {
    // Non-streaming response
    const data = await response.json();
    return data.response;
  }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversationTree, setConversationTree] = useState<ConversationTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);
  const [streamingNodeId, setStreamingNodeId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  // Initialize persistence hook
  const {
    saveConversationManual,
    loadAllConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
  } = useConversationPersistence({
    conversationTree,
    setConversationTree,
    onSaveSuccess: (message) => {
      // Success messages are shown in ConversationActions component
    },
    onSaveError: (error) => {
      toast.error(error);
    },
  });

  // Load conversation on mount
  useEffect(() => {
    const loadConversationData = async () => {
      if (conversationId) {
        try {
          const result = await loadConversation(conversationId);
          if (!result) {
            toast.error('对话未找到');
            router.push('/');
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          toast.error('加载对话失败');
          router.push('/');
        } finally {
          setIsLoadingConversation(false);
        }
      }
    };

    loadConversationData();
  }, [conversationId, loadConversation, router]);

  // Add child node to existing node
  const addChildNode = useCallback(async (parentId: string, message: string, model: string) => {
    if (!conversationTree) return;

    setIsLoading(true);

    const childId = generateId();
    const modelDisplayName = AI_MODELS.find(m => m.id === model)?.name || model;

    // Create user node
    const newNode: ConversationNode = {
      id: childId,
      type: 'user',
      content: message,
      parentId,
      children: [],
      metadata: {
        timestamp: new Date(),
      },
      position: { x: 0, y: 0 },
    };

    try {
      // Get AI response
      const aiId = generateId();

      // Create AI node with empty content initially
      const aiNode: ConversationNode = {
        id: aiId,
        type: 'assistant',
        content: '',
        model: modelDisplayName,
        parentId: childId,
        children: [],
        metadata: {
          timestamp: new Date(),
        },
        position: { x: 400, y: 0 },
      };

      newNode.children.push(aiId);

      // Track which AI node is streaming
      setStreamingNodeId(aiId);

      const updatedNodes = new Map(conversationTree.nodes);
      updatedNodes.set(childId, newNode);
      updatedNodes.set(aiId, aiNode);

      // Update parent node
      const parentNode = updatedNodes.get(parentId);
      if (parentNode) {
        parentNode.children.push(childId);
        updatedNodes.set(parentId, parentNode);
      }

      // Show the tree immediately with empty AI response
      setConversationTree({
        ...conversationTree,
        nodes: updatedNodes,
        updatedAt: new Date(),
      });

      // Call OpenRouter API with streaming
      const aiResponse = await callChatAPI(message, model, (chunk) => {
        // Update the AI node content as chunks arrive
        setConversationTree(prev => {
          if (!prev) return prev;
          const newNodes = new Map(prev.nodes);
          const currentAINode = newNodes.get(aiId);
          if (currentAINode) {
            newNodes.set(aiId, {
              ...currentAINode,
              content: currentAINode.content + chunk
            });
          }
          return {
            ...prev,
            nodes: newNodes
          };
        });
      });

      // Final update to ensure full content is set
      setConversationTree(prev => {
        if (!prev) return prev;
        const newNodes = new Map(prev.nodes);
        const currentAINode = newNodes.get(aiId);
        if (currentAINode) {
          newNodes.set(aiId, {
            ...currentAINode,
            content: aiResponse
          });
        }
        return {
          ...prev,
          nodes: newNodes
        };
      });
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
      setStreamingNodeId(null);
    }
  }, [conversationTree]);

  // Handle new message (when user clicks on a node to continue conversation)
  const handleMessage = useCallback(async (message: string, model?: string) => {
    const actualModel = model || selectedModel;
    if (conversationTree) {
      // This should not happen in chat page, but just in case
      console.warn('Unexpected message in chat page without parent node');
    }
  }, [conversationTree, selectedModel]);

  // Show loading state while loading conversation
  if (isLoadingConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载对话中...</h2>
          <p className="text-gray-600">请稍等，正在加载您的对话内容</p>
        </div>
      </div>
    );
  }

  // If no conversation tree loaded, show error
  if (!conversationTree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">对话未找到</h2>
          <p className="text-gray-600 mb-4">无法找到您要查看的对话，可能已被删除或链接错误</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:bg-gray-100/50 rounded-lg px-3 py-2 -ml-3 transition-colors"
                title="返回首页"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">AI 对话思维导图</h1>
              </button>
              <div className="text-sm text-gray-600">
                {conversationTree.title}
              </div>
            </div>
            <ConversationActions
              conversationTree={conversationTree}
              onLoadConversation={(conv) => {
                setConversationTree(conv);
                router.push(`/chat/${conv.id}`);
              }}
              onNewConversation={() => router.push('/')}
              className="flex items-center gap-2"
            />
          </div>
        </div>
      </header>

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