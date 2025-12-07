'use client';

import { useState, useCallback } from 'react';
import { ConversationNode, ConversationTree } from '@/lib/types';
import { AI_MODELS } from '@/lib/constants';
import ChatInput from '@/components/ChatInput';
import NodeComponent from '@/components/Node';
import HomePage from '@/components/HomePage';
import { generateId } from 'ai';
import { GitBranch } from 'lucide-react';

// Mock OpenRouter API call (replace with actual implementation)
async function callOpenRouterAPI(message: string, model: string): Promise<string> {
  // This is a mock implementation
  // In production, you'll make an actual API call to OpenRouter
  await new Promise(resolve => setTimeout(resolve, 1000));

  const modelResponses: Record<string, string> = {
    'gpt-4-turbo': `[GPT-4 Turbo] Regarding "${message}": This is a comprehensive response that analyzes your question from multiple perspectives. The key points to consider are...`,
    'gpt-3.5-turbo': `[GPT-3.5] About "${message}": Here's a helpful response to your question.`,
    'claude-3-opus': `[Claude 3 Opus] Let me thoughtfully address "${message}". I'll explore the nuances and provide a detailed analysis...`,
    'claude-3-sonnet': `[Claude 3 Sonnet] Regarding "${message}": I'll provide a balanced and helpful response...`,
    'gemini-pro': `[Gemini Pro] For your question about "${message}", I'd like to share some insights...`,
  };

  return modelResponses[model] || `[AI] This is a response to: "${message}"`;
}

export default function Home() {
  const [conversationTree, setConversationTree] = useState<ConversationTree | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-pro');

  // Create a new conversation
  const startConversation = useCallback(async (message: string, model: string) => {
    const userId = generateId();
    const aiId = generateId();
    const modelDisplayName = AI_MODELS.find(m => m.id === model)?.name || model;

    // Create user node
    const userNode: ConversationNode = {
      id: userId,
      type: 'user',
      content: message,
      parentId: null,
      children: [aiId],
      metadata: {
        timestamp: new Date(),
      },
      position: { x: 0, y: 0 },
    };

    // Create AI response node
    const aiResponse = await callOpenRouterAPI(message, model);
    const aiNode: ConversationNode = {
      id: aiId,
      type: 'assistant',
      content: aiResponse,
      model: modelDisplayName,
      parentId: userId,
      children: [],
      metadata: {
        timestamp: new Date(),
      },
      position: { x: 400, y: 0 },
    };

    const newTree: ConversationTree = {
      id: generateId(),
      title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
      rootNode: userId,
      nodes: new Map([
        [userId, userNode],
        [aiId, aiNode],
      ]),
      layout: 'tree',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversationTree(newTree);
    setExpandedNodes(new Set([userId, aiId]));
  }, []);

  // Add child node to existing node
  const addChildNode = useCallback(async (parentId: string, message: string, model: string) => {
    if (!conversationTree) return;

    setIsLoading(true);

    const childId = generateId();
    const modelDisplayName = AI_MODELS.find(m => m.id === model)?.name || model;

    const newNode: ConversationNode = {
      id: childId,
      type: 'user',
      content: message,
      parentId,
      children: [],
      metadata: {
        timestamp: new Date(),
      },
    };

    // Get AI response
    const aiId = generateId();
    const aiResponse = await callOpenRouterAPI(message, model);
    const aiNode: ConversationNode = {
      id: aiId,
      type: 'assistant',
      content: aiResponse,
      model: modelDisplayName,
      parentId: childId,
      children: [],
      metadata: {
        timestamp: new Date(),
      },
    };

    newNode.children.push(aiId);

    const updatedNodes = new Map(conversationTree.nodes);
    updatedNodes.set(childId, newNode);
    updatedNodes.set(aiId, aiNode);

    // Update parent node
    const parentNode = updatedNodes.get(parentId);
    if (parentNode) {
      parentNode.children.push(childId);
      updatedNodes.set(parentId, parentNode);
    }

    setConversationTree({
      ...conversationTree,
      nodes: updatedNodes,
      updatedAt: new Date(),
    });

    setExpandedNodes(prev => new Set([...prev, childId, aiId]));
    setSelectedNodeId(null);
    setIsLoading(false);
  }, [conversationTree]);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Render nodes recursively
  const renderNode = useCallback((nodeId: string, level: number = 0): JSX.Element => {
    const node = conversationTree?.nodes.get(nodeId);
    if (!node) return <></>;

    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children.length > 0;

    return (
      <div key={nodeId} className="flex flex-col gap-4">
        <NodeComponent
          node={node}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          level={level}
          onExpand={() => toggleNodeExpansion(nodeId)}
          onAddChild={(parentId) => {
            setSelectedNodeId(parentId);
          }}
          onCreateBranch={(nodeId) => {
            // TODO: Implement branch creation
            setSelectedNodeId(nodeId);
          }}
          onEdit={(nodeId, newContent) => {
            // TODO: Implement node editing
          }}
          onDelete={(nodeId) => {
            // TODO: Implement node deletion
          }}
          onModelChange={(nodeId, newModel) => {
            // TODO: Implement model change
          }}
        />

        {isExpanded && hasChildren && (
          <div className="ml-8 flex flex-col gap-4">
            {node.children.map(childId => renderNode(childId, level + 1))}
          </div>
        )}
      </div>
    );
  }, [conversationTree, expandedNodes, toggleNodeExpansion]);

  // Handle new message
  const handleMessage = useCallback(async (message: string, model?: string) => {
    const actualModel = model || selectedModel;
    if (!conversationTree) {
      await startConversation(message, actualModel);
    } else if (selectedNodeId) {
      await addChildNode(selectedNodeId, message, actualModel);
    }
  }, [conversationTree, selectedNodeId, selectedModel, startConversation, addChildNode]);

  // If no conversation tree, show home page
  if (!conversationTree) {
    return <HomePage onStartChat={handleMessage} />;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI 对话思维导图</h1>
            </div>
            <button
              onClick={() => setConversationTree(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              新建对话
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar with conversation info */}
        <aside className="w-80 bg-white h-screen fixed left-0 top-16 border-r p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{conversationTree.title}</h2>
              <p className="text-sm text-gray-500">
                创建时间: {conversationTree.createdAt.toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">统计</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>节点总数: {conversationTree.nodes.size}</p>
                <p>用户消息: {Array.from(conversationTree.nodes.values()).filter(n => n.type === 'user').length}</p>
                <p>AI回复: {Array.from(conversationTree.nodes.values()).filter(n => n.type === 'assistant').length}</p>
              </div>
            </div>

            {selectedNodeId && (
              <div className="pt-4 border-t">
                <p className="text-sm text-blue-600">
                  已选择节点，可以添加追问
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 ml-80 p-8">
          <div className="overflow-auto">
            <div className="inline-block min-w-full p-8">
              {renderNode(conversationTree.rootNode)}
            </div>
          </div>
        </main>
      </div>

      {/* Floating chat input */}
      <div className="fixed bottom-8 right-8 w-full max-w-md">
        <ChatInput
          onSendMessage={handleMessage}
          isLoading={isLoading}
          placeholder={selectedNodeId ? "继续对话..." : "输入新问题..."}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </main>
  );
}