'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { Controls } from '@reactflow/controls';
import { Background } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import 'reactflow/dist/style.css';
import AIDrawer from './AIDrawer';
import MessageNode from './MessageNode';
import { DEFAULT_AI_MODEL } from '@/lib/constants';

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
  streamingNodeId,
}: {
  conversationTree: any;
  onAddChild: (parentId: string, message: string, model: string) => Promise<void>;
  selectedModel: string;
  isLoading?: boolean;
  streamingNodeId?: string | null;
}) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingModel, setEditingModel] = useState(selectedModel);
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string | null>(null);
  const [drawerOpenNodeId, setDrawerOpenNodeId] = useState<string | null>(null);

  // Get zoom level from ReactFlow instance
  const { getZoom } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(100);

  // Drawer state management
  const toggleDrawer = useCallback((nodeId: string) => {
    setDrawerOpenNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  // Get current drawer content
  const currentDrawerContent = useMemo(() => {
    if (!drawerOpenNodeId || !conversationTree) return null;

    const userNode = conversationTree.nodes.get(drawerOpenNodeId);
    if (!userNode || userNode.type !== 'user') return null;

    // Find AI response
    const aiNodeId = userNode.children.find((id: string) => {
      const n = conversationTree.nodes.get(id);
      return n?.type === 'assistant';
    });

    const aiNode = aiNodeId ? conversationTree.nodes.get(aiNodeId) : null;

    return {
      nodeId: drawerOpenNodeId,
      content: aiNode?.content || '',
      model: aiNode?.model || '',
      userQuestion: userNode?.content || '',
    };
  }, [drawerOpenNodeId, conversationTree]);

  // Track last active node
  const handleNodeClick = useCallback((nodeId: string) => {
    setLastActiveNodeId(nodeId);
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
        node.children.forEach((childId: string, index: number) => {
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
      conversationTree.nodes.forEach((node: any, nodeId: string) => {
        if (node.type === 'user') {
          const pos = positions.get(nodeId);
          if (pos) {
            const aiNodeId = node.children.find((id: string) => {
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
                isStreaming: aiNodeId === streamingNodeId,
                onToggleDrawer: toggleDrawer,
                onNodeClick: handleNodeClick,
                isDrawerOpen: drawerOpenNodeId === nodeId,
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
  }, [conversationTree, drawerOpenNodeId]);

  // Convert edges - only connect user nodes
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    if (conversationTree) {
      conversationTree.nodes.forEach((node: any, nodeId: string) => {
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
              markerEnd: 'arrow',
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
    // Preserve selection state when updating nodes
    setNodes(prevNodes => {
      // Calculate new nodes from conversation tree
      const newNodes: Node[] = [];
      const positions = new Map<string, { x: number; y: number }>();

      // Position nodes horizontally (left to right)
      const positionNode = (nodeId: string, x: number, y: number, level: number = 0) => {
        if (positions.has(nodeId)) return positions.get(nodeId)!;

        positions.set(nodeId, { x, y });
        const node = conversationTree.nodes.get(nodeId);

        if (node && node.type === 'user') {
          let childY = y;
          node.children.forEach((childId: string, index: number) => {
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
        conversationTree.nodes.forEach((node: any, nodeId: string) => {
          if (node.type === 'user') {
            const pos = positions.get(nodeId);
            if (pos) {
              const aiNodeId = node.children.find((id: string) => {
                const n = conversationTree.nodes.get(id);
                return n?.type === 'assistant';
              });

              const aiNode = aiNodeId ? conversationTree.nodes.get(aiNodeId) : null;

              // Find matching node in previous nodes to preserve selection
              const prevNode = prevNodes.find(n => n.id === nodeId);

              newNodes.push({
                id: nodeId,
                type: 'message',
                position: pos,
                data: {
                  ...node,
                  hasAIResponse: !!aiNode,
                  aiResponse: aiNode?.content || null,
                  model: aiNode?.model || null,
                  isStreaming: aiNodeId === streamingNodeId,
                  onToggleDrawer: toggleDrawer,
                  onNodeClick: handleNodeClick,
                  isDrawerOpen: drawerOpenNodeId === nodeId,
                  selectedModel: selectedModel,
                  editingModel: editingModel,
                  onModelChange: setEditingModel,
                },
                selected: prevNode?.selected || false, // Preserve selection state
              });
            }
          }
        });
      }

      return newNodes;
    });
    setEdges(initialEdges);
  }, [conversationTree, initialEdges, toggleDrawer, handleNodeClick, drawerOpenNodeId, selectedModel, editingModel, setEditingModel]);

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

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpenNodeId) {
        e.preventDefault();
        setDrawerOpenNodeId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpenNodeId]);

  // Handle Enter and Escape keys for editing nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Enter key for submitting
      if (editingNodeId && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (editingText.trim()) {
          // Find the actual parent node of this temp node
          const tempNode = nodes.find(n => n.id === editingNodeId);
          if (tempNode) {
            // Find the edge connected to this temp node
            const connectedEdge = edges.find(e => e.target === editingNodeId);
            if (connectedEdge) {
              // The source of the edge is the parent node
              onAddChild(connectedEdge.source, editingText.trim(), editingModel || selectedModel);
            }
          }
        }

        // Remove temp node and its edge
        setNodes(prev => {
          const filtered = prev.filter(n => n.id !== editingNodeId);
          return filtered;
        });
        setEdges(prev => prev.filter(e => e.target !== editingNodeId && e.source !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
        setEditingModel('');
      }

      // Handle Escape key for editing
      if (editingNodeId && e.key === 'Escape' && !drawerOpenNodeId) {
        e.preventDefault();
        e.stopPropagation();
        setNodes(prev => {
          const filtered = prev.filter(n => n.id !== editingNodeId);
          return filtered;
        });
        setEdges(prev => prev.filter(e => e.target !== editingNodeId && e.source !== editingNodeId));
        setEditingNodeId(null);
        setEditingText('');
      }
    };

    // Use capture to ensure we catch these keys
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editingNodeId, editingText, editingModel, nodes, edges, conversationTree, onAddChild, selectedModel, drawerOpenNodeId]);

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
    <>
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
          onWheel={(event) => {
            // Zoom only with Ctrl+Wheel
            if (event.ctrlKey) {
              event.preventDefault();
              // React Flow will handle zoom when ctrl is pressed
            } else {
              // Allow normal container scrolling
              return;
            }
          }}
          zoomOnScroll={false}
          panOnScroll={false}
          onKeyDown={(event) => {
            // Handle Tab key at ReactFlow level
            if (event.key === 'Tab') {
              event.preventDefault();
              event.stopPropagation();

              // Always use the last active node if set, otherwise use the last user node
              let parentNode: Node | undefined;

              if (lastActiveNodeId) {
                // Check if the last active node is a permanent user node (not temp)
                // Don't use temp nodes as parents
                if (!lastActiveNodeId.startsWith('temp-')) {
                  const nodeData = conversationTree?.nodes.get(lastActiveNodeId);
                  if (nodeData?.type === 'user') {
                    parentNode = nodes.find(n => n.id === lastActiveNodeId);
                  }
                }
              }

              // If no valid last active node, find the last user node
              if (!parentNode) {
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

                // Get all existing children of this parent node and sort them by Y position
                const existingChildrenIds = edges
                  .filter(e => e.source === parentNode.id)
                  .map(e => e.target);

                const existingChildren = existingChildrenIds
                  .map(childId => nodes.find(n => n.id === childId))
                  .filter((n): n is Node => n !== undefined) // Filter out undefined
                  .sort((a, b) => a.position.y - b.position.y);

                // Calculate the next Y position based on the last child or parent position
                let newY;
                if (existingChildren.length > 0) {
                  // Position below the last child
                  const lastChild = existingChildren[existingChildren.length - 1];
                  newY = lastChild.position.y + 150;
                } else {
                  // First child, position relative to parent
                  newY = parentNode.position.y;
                }

                // Create new node position
                const newX = parentNode.position.x + 500;

                // Add new node
                const newNode: Node = {
                  id: newNodeId,
                  type: 'message',
                  position: { x: newX, y: newY },
                  data: {
                    type: 'user',
                    content: '',
                    isNew: true,
                    onToggleDrawer: toggleDrawer,
                    onNodeClick: handleNodeClick,
                    selectedModel: selectedModel,
                    editingModel: editingModel || selectedModel,
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
                setLastActiveNodeId(newNodeId);
              }
            }
          }}
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
            <p className="text-sm text-gray-600">Ctrl + 滚轮 - 缩放</p>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                缩放: <span className="font-mono font-medium">{zoomLevel}%</span>
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* AI Reply Drawer */}
      {currentDrawerContent && (
        <AIDrawer
          isOpen={!!drawerOpenNodeId}
          onClose={() => setDrawerOpenNodeId(null)}
          content={currentDrawerContent.content}
          model={currentDrawerContent.model}
          userQuestion={currentDrawerContent.userQuestion}
        />
      )}
    </>
  );
}

// Export wrapper component
export default function MindMapFlow({
  conversationTree,
  onAddChild,
  selectedModel,
  isLoading,
  streamingNodeId,
}: {
  conversationTree: any;
  onAddChild: (parentId: string, message: string, model: string) => Promise<void>;
  selectedModel: string;
  isLoading?: boolean;
  streamingNodeId?: string | null;
}) {
  return (
    <ReactFlowProvider>
      <MindMapFlowContent
        conversationTree={conversationTree}
        onAddChild={onAddChild}
        selectedModel={selectedModel}
        isLoading={isLoading}
        streamingNodeId={streamingNodeId}
      />
    </ReactFlowProvider>
  );
}