'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationTree } from '@/lib/types';
import { DEFAULT_AI_MODEL } from '@/lib/constants';
import MindMapFlow from '@/components/MindMapFlow';
import ConversationActions from '@/components/ConversationActions';
import { GitBranch } from 'lucide-react';
import { useConversationPersistence } from '@/hooks/useConversationPersistence';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useConversationActions } from '@/hooks/useConversationActions';
import {
  createUserNode,
  createAINode,
  createConversationTree,
} from '@/lib/utils/conversation';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversationTree, setConversationTree] = useState<ConversationTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel] = useState(DEFAULT_AI_MODEL);
  const [streamingNodeId, setStreamingNodeId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  
  // 使用 ref 跟踪是否已经初始化，防止无限循环
  const hasInitialized = useRef(false);

  // Initialize persistence hook
  const { loadConversation } = useConversationPersistence({
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
  const { addChildNode } = useConversationActions({
    conversationTree,
    setConversationTree,
    executeStreamingChat,
  });

  // 使用 ref 存储函数引用，避免依赖项变化导致循环
  const executeStreamingChatRef = useRef(executeStreamingChat);
  const loadConversationRef = useRef(loadConversation);
  
  useEffect(() => {
    executeStreamingChatRef.current = executeStreamingChat;
  }, [executeStreamingChat]);
  
  useEffect(() => {
    loadConversationRef.current = loadConversation;
  }, [loadConversation]);

  // Load conversation on mount and handle initial message if needed
  useEffect(() => {
    // 防止重复初始化
    if (hasInitialized.current) return;
    
    const initializeConversation = async () => {
      if (!conversationId) return;

      hasInitialized.current = true;

      try {
        // 加载对话
        const result = await loadConversationRef.current(conversationId);
        if (!result) {
          console.error('Conversation not found:', conversationId);
          toast.error('对话未找到');
          router.push('/');
          return;
        }

        console.log('Loaded conversation:', {
          id: result.id,
          nodesCount: result.nodes.size,
          hasInitialMessage: !!result.initialMessage,
          rootNode: result.rootNode
        });

        // 检查是否有初始消息但还没有节点（首次创建会话）
        if (result.initialMessage && result.nodes.size === 0) {
          console.log('Creating initial nodes for conversation:', conversationId);
          const message = result.initialMessage;
          const model = result.initialModel || DEFAULT_AI_MODEL;

          // 创建节点
          const userNode = createUserNode(message, null);
          const aiNode = createAINode(model, userNode.id, '');
          userNode.children.push(aiNode.id);

          // 创建对话树（使用后端返回的 UUID）
          const newTree = createConversationTree(message, userNode.id, aiNode.id, conversationId);
          newTree.nodes.set(userNode.id, userNode);
          newTree.nodes.set(aiNode.id, aiNode);

          // 设置对话树 - 立即显示界面（显示"回复中"状态）
          setConversationTree(newTree);
          
          // 立即停止加载状态，显示界面
          setIsLoadingConversation(false);

          // 先保存节点到数据库（异步，不阻塞）
          (async () => {
            try {
              const { saveConversation } = await import('@/lib/api/conversations');
              const saveResult = await saveConversation(newTree);
              if (!saveResult.success) {
                console.error('Failed to save initial nodes:', saveResult.error);
                toast.error('保存节点失败: ' + saveResult.error);
              } else {
                console.log('Initial nodes saved successfully');
              }
            } catch (saveError) {
              console.error('Error saving initial nodes:', saveError);
              toast.error('保存节点时出错');
            }
          })();

          // 执行流式聊天（异步，不阻塞界面显示）
          executeStreamingChatRef.current(message, model, aiNode.id).catch((error) => {
            console.error('Error in streaming chat:', error);
            toast.error('AI 回复失败: ' + (error instanceof Error ? error.message : String(error)));
          });
        } else {
          // 正常加载已有对话
          console.log('Conversation loaded with', result.nodes.size, 'nodes');
          setIsLoadingConversation(false);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('加载对话失败: ' + (error instanceof Error ? error.message : String(error)));
        setIsLoadingConversation(false);
        router.push('/');
      }
    };

    initializeConversation();
    
    // 当 conversationId 改变时重置初始化标志
    return () => {
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // 只依赖 conversationId，使用 ref 避免循环依赖



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