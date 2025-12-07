'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import { Controls } from '@reactflow/controls';
import { Background } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import 'reactflow/dist/style.css';
import { Bot, User } from 'lucide-react';
import AIPreview from './AIPreview';
import { AI_MODELS, DEFAULT_AI_MODEL } from '@/lib/constants';

// Custom Node Component
const MessageNode = ({ id, data, selected }: { id: string; data: any; selected?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editText, setEditText] = useState(data.content || '');

  // Update edit text when data.content changes
  useEffect(() => {
    setEditText(data.content || '');
  }, [data.content]);

  // Handle editing state
  if (data.isNew) {
    return (
      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#9CA3AF', width: 10, height: 10 }}
        />
        <div
          className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? 'border-blue-600' : 'border-blue-500'} shadow-lg min-w-[300px] max-w-[400px] animate-pulse`}
          style={{ minWidth: '300px' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">新问题</span>
          </div>
          <input
            type="text"
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              // Direct dispatch for immediate update
              const event = new CustomEvent('node-edit', { detail: { id, text: e.target.value } });
              window.dispatchEvent(event);
            }}
            placeholder="输入问题..."
            className="w-full text-sm text-gray-800 bg-transparent outline-none"
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                window.dispatchEvent(event);
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                const event = new KeyboardEvent('keydown', { key: 'Escape' });
                window.dispatchEvent(event);
              }
            }}
          />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#9CA3AF', width: 10, height: 10 }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#9CA3AF', width: 10, height: 10 }}
      />
      <div
        className={`px-4 py-3 bg-white rounded-lg border-2 shadow-lg min-w-[300px] max-w-[400px] transition-all hover:shadow-xl ${
          selected ? 'border-blue-600' : 'border-blue-500'
        }`}
        style={{ minWidth: '300px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {data.type === 'user' ? (
              <User className="w-4 h-4 text-blue-600" />
            ) : (
              <Bot className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {data.type === 'user' ? '用户' : data.model || 'AI'}
            </span>
          </div>
          {data.type === 'user' && data.hasAIResponse && (
            <button
              onClick={() => setPreviewVisible(!previewVisible)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {previewVisible ? '隐藏' : '查看'}回复
            </button>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-gray-800">
          {data.content || (
            <span className="text-gray-400 italic">加载中...</span>
          )}
        </div>

        {/* AI Preview */}
        {data.type === 'user' && data.aiResponse && previewVisible && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <AIPreview
              content={data.aiResponse}
              isVisible={true}
              style={{ position: 'static', width: '100%' }}
            />
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#9CA3AF', width: 10, height: 10 }}
      />
    </div>
  );
};

// Node types
const nodeTypes = {
  message: MessageNode,
};

export default function MindMapFlow({
  conversationTree,
  onAddChild,
  selectedModel,
  isLoading,
}: {
  conversationTree: any;
  onAddChild: (parentId: string, message: string, model: string) => Promise<void>;
  selectedModel: string;
  isLoading?: boolean;
}) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Convert conversation tree to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    const positions = new Map<string, { x: number; y: number }>();

    // Position nodes horizontally (left to right)
    const positionNode = (nodeId: string, x: number, y: number, level: number = 0) => {
      if (positions.has(nodeId)) return positions.get(nodeId)!;

      positions.set(nodeId, { x, y });
      const node = conversationTree.nodes.get(nodeId);

      if (node && node.type === 'user') {
        let childY = y;
        node.children.forEach((childId, index) => {
          const childNode = conversationTree.nodes.get(childId);
          if (childNode && childNode.type === 'user') {
            positionNode(childId, x + 500, childY, level + 1);
            childY += 150;
          }
        });
      }

      return positions.get(nodeId)!;
    };

    if (conversationTree) {
      positionNode(conversationTree.rootNode, 50, 300);

      // Create nodes only for user messages
      conversationTree.nodes.forEach((node, nodeId) => {
        if (node.type === 'user') {
          const pos = positions.get(nodeId);
          if (pos) {
            const aiNode = node.children.find(id => {
              const n = conversationTree.nodes.get(id);
              return n?.type === 'assistant';
            });

            nodes.push({
              id: nodeId,
              type: 'message',
              position: pos,
              data: {
                ...node,
                hasAIResponse: !!aiNode,
                aiResponse: aiNode ? conversationTree.nodes.get(aiNode)?.content : null,
              },
            });
          }
        }
      });
    }

    return nodes;
  }, [conversationTree]);

  // Convert edges - only connect user nodes
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    if (conversationTree) {
      conversationTree.nodes.forEach((node, nodeId) => {
        // Only create edges for user nodes
        if (node.type === 'user' && node.parentId) {
          // Check if parent is also a user node
          const parentNode = conversationTree.nodes.get(node.parentId);
          if (parentNode && parentNode.type === 'user') {
            edges.push({
              id: `${node.parentId}-${nodeId}`,
              source: node.parentId,
              target: nodeId,
              type: 'smoothstep',
              style: { stroke: '#9CA3AF', strokeWidth: 2 },
              animated: false,
              markerEnd: {
                type: 'arrow',
                color: '#9CA3AF',
              },
            });
          }
        }
      });
    }

    return edges;
  }, [conversationTree]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle Tab key for creating new nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !editingNodeId) {
        e.preventDefault();

        // Find the last user node
        const userNodes = nodes.filter(node => {
          const nodeData = conversationTree?.nodes.get(node.id);
          return nodeData?.type === 'user';
        });

        if (userNodes.length > 0) {
          const lastNode = userNodes[userNodes.length - 1];
          const newNodeId = `temp-${Date.now()}`;

          // Create new node position
          const newX = lastNode.position.x + 500;
          const newY = lastNode.position.y;

          // Add new node
          const newNode: Node = {
            id: newNodeId,
            type: 'message',
            position: { x: newX, y: newY },
            data: {
              type: 'user',
              content: '',
              isNew: true,
            },
          };

          setNodes(prev => [...prev, newNode]);
          setEditingNodeId(newNodeId);
          setEditingText('');
        }
      }

      // Handle Enter key for submitting
      if (editingNodeId && e.key === 'Enter') {
        e.preventDefault();
        if (editingText.trim()) {
          // Find parent node (the last user node before this temp node)
          const userNodes = nodes.filter(node => {
            const nodeData = conversationTree?.nodes.get(node.id);
            return nodeData?.type === 'user' && node.id !== editingNodeId;
          });

          if (userNodes.length > 0) {
            const parentNode = userNodes[userNodes.length - 1];
            onAddChild(parentNode.id, editingText.trim(), selectedModel);
          }
        }

        // Remove temp node
        setNodes(prev => prev.filter(n => n.id !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
      }

      // Handle Escape key
      if (editingNodeId && e.key === 'Escape') {
        e.preventDefault();
        setNodes(prev => prev.filter(n => n.id !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, editingText, nodes, conversationTree, onAddChild, selectedModel]);

  // Handle custom event for node editing
  useEffect(() => {
    const handleNodeEdit = (e: any) => {
      if (e.detail.id === editingNodeId) {
        setEditingText(e.detail.text);
      }
    };

    window.addEventListener('node-edit', handleNodeEdit);
    return () => window.removeEventListener('node-edit', handleNodeEdit);
  }, [editingNodeId]);

  // Update editing node text
  useEffect(() => {
    if (editingNodeId) {
      setNodes(prev => prev.map(node =>
        node.id === editingNodeId
          ? { ...node, data: { ...node.data, content: editingText } }
          : node
      ));
    }
  }, [editingNodeId, editingText, setNodes]);

  return (
    <div className="w-full h-screen" style={{ background: 'linear-gradient(to br, #f8fafc, #e0e7ff)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeStrokeColor="#9CA3AF"
          nodeColor="#EFF6FF"
          nodeBorderRadius={8}
        />

        <Panel position="top-left" className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-2">快捷键</h3>
          <p className="text-sm text-gray-600">Tab - 添加新节点</p>
          <p className="text-sm text-gray-600">拖拽 - 移动节点</p>
          <p className="text-sm text-gray-600">滚轮 - 缩放</p>
        </Panel>
      </ReactFlow>
    </div>
  );
}