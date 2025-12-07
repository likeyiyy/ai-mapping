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
  useReactFlow,
  ReactFlowProvider,
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
  const [editText, setEditText] = useState(data.content || '');
  const [previewVisible, setPreviewVisible] = useState(false);

  // Update edit text when data.content changes
  useEffect(() => {
    setEditText(data.content || '');
  }, [data.content]);

  // Toggle preview
  const handleTogglePreview = () => {
    const newState = !previewVisible;
    setPreviewVisible(newState);
    if (data.onTogglePreview) {
      data.onTogglePreview(id);
    }
  };

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
          className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? 'border-blue-600' : 'border-blue-500'} shadow-lg min-w-[350px] max-w-[450px] animate-pulse`}
          style={{ minWidth: '350px' }}
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
            className="w-full text-sm text-gray-800 bg-transparent outline-none mb-2"
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
          {/* Model selector for new question */}
          <select
            value={data.editingModel || data.selectedModel}
            onChange={(e) => {
              const newModel = e.target.value;
              if (data.onModelChange) {
                data.onModelChange(newModel);
              }
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
          >
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
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
        className={`relative px-4 py-3 bg-white rounded-lg border-2 shadow-lg min-w-[350px] max-w-[450px] transition-all hover:shadow-xl ${
          selected ? 'border-blue-600' : 'border-blue-500'
        }`}
        style={{ minWidth: '350px' }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#9CA3AF', width: 10, height: 10 }}
        />
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
          {data.type === 'user' ? (
            <User className="w-4 h-4 text-blue-600" />
          ) : (
            <Bot className="w-4 h-4 text-emerald-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {data.type === 'user' ? '用户' : data.model || 'AI'}
          </span>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-800 min-h-[20px]">
          {data.content || (
            <span className="text-gray-400 italic">加载中...</span>
          )}
        </div>

        {/* Bottom section with model and button */}
        {data.type === 'user' && data.hasAIResponse && (
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-blue-100">
            {data.model && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                {data.model}
              </span>
            )}
            <button
              onClick={handleTogglePreview}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {previewVisible ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {previewVisible ? '隐藏' : '查看'}回复
            </button>
          </div>
        )}

        {/* AI Preview - positioned absolutely like SVG version */}
        {data.type === 'user' && data.aiResponse && previewVisible && (
          <div className="absolute z-50" style={{ top: '100%', left: 0, marginTop: '8px' }}>
            <AIPreview
              content={data.aiResponse}
              isVisible={true}
              style={{ width: '100%' }}
            />
          </div>
        )}
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#9CA3AF', width: 10, height: 10 }}
        />
      </div>
    </div>
  );
};

// Node types
const nodeTypes = {
  message: MessageNode,
};

// Inner component that can use ReactFlow hooks
function MindMapFlowContent({
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
  const [editingModel, setEditingModel] = useState(selectedModel);
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string | null>(null);
  const [previewStates, setPreviewStates] = useState<Record<string, boolean>>({});

  // Get zoom level from ReactFlow instance
  const { getZoom } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(100);

  // Preview state management
  const togglePreview = useCallback((nodeId: string) => {
    setPreviewStates(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

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
            const aiNodeId = node.children.find(id => {
              const n = conversationTree.nodes.get(id);
              return n?.type === 'assistant';
            });

            const aiNode = aiNodeId ? conversationTree.nodes.get(aiNodeId) : null;

            nodes.push({
              id: nodeId,
              type: 'message',
              position: pos,
              data: {
                ...node,
                hasAIResponse: !!aiNode,
                aiResponse: aiNode?.content || null,
                model: aiNode?.model || null, // 添加模型信息
                onTogglePreview: togglePreview,
                selectedModel: selectedModel,
                editingModel: editingModel,
                onModelChange: setEditingModel,
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

  // Update nodes and edges when conversationTree changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  // Update zoom level on viewport changes
  useEffect(() => {
    const interval = setInterval(() => {
      setZoomLevel(Math.round(getZoom() * 100));
    }, 100);

    return () => clearInterval(interval);
  }, [getZoom]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Track last active node
  const handleNodeClick = useCallback((nodeId: string) => {
    setLastActiveNodeId(nodeId);
  }, []);

  // Handle Tab key for creating new nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !editingNodeId) {
        e.preventDefault();

        // Use last active node if set, otherwise find the last user node
        let parentNode: Node | undefined;

        if (lastActiveNodeId) {
          parentNode = nodes.find(n => n.id === lastActiveNodeId);
        } else {
          const userNodes = nodes.filter(node => {
            const nodeData = conversationTree?.nodes.get(node.id);
            return nodeData?.type === 'user';
          });
          if (userNodes.length > 0) {
            parentNode = userNodes[userNodes.length - 1];
          }
        }

        if (parentNode) {
          const newNodeId = `temp-${Date.now()}`;

          // Create new node position
          const newX = parentNode.position.x + 500;
          const newY = parentNode.position.y;

          // Add new node
          const newNode: Node = {
            id: newNodeId,
            type: 'message',
            position: { x: newX, y: newY },
            data: {
              type: 'user',
              content: '',
              isNew: true,
              onTogglePreview: togglePreview,
              selectedModel: selectedModel,
              editingModel: editingModel,
              onModelChange: setEditingModel,
            },
          };

          // Create edge immediately when node is created
          const newEdge: Edge = {
            id: `${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
            type: 'smoothstep',
            style: { stroke: '#9CA3AF', strokeWidth: 2 },
            animated: false,
          };

          setNodes(prev => [...prev, newNode]);
          setEdges(prev => [...prev, newEdge]);
          setEditingNodeId(newNodeId);
          setEditingText('');
          setEditingModel(selectedModel);
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
            onAddChild(parentNode.id, editingText.trim(), editingModel || selectedModel);
          }
        }

        // Remove temp node and its edge
        setNodes(prev => {
          const filtered = prev.filter(n => n.id !== editingNodeId);
          // Find the node that would be created by API and update its position
          return filtered.map(node => {
            // This is a placeholder for when the API creates the actual node
            return node;
          });
        });
        setEdges(prev => prev.filter(e => e.target !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
        setEditingModel(null);
      }

      // Handle Escape key
      if (editingNodeId && e.key === 'Escape') {
        e.preventDefault();
        setNodes(prev => prev.filter(n => n.id !== editingNodeId));
        setEdges(prev => prev.filter(e => e.target !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, editingText, nodes, edges, conversationTree, onAddChild, selectedModel]);

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
        onNodeClick={(event, node) => handleNodeClick(node.id)}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              缩放: <span className="font-mono font-medium">{zoomLevel}%</span>
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Export wrapper component
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
  return (
    <ReactFlowProvider>
      <MindMapFlowContent
        conversationTree={conversationTree}
        onAddChild={onAddChild}
        selectedModel={selectedModel}
        isLoading={isLoading}
      />
    </ReactFlowProvider>
  );
}