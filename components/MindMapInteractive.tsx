'use client';

import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { ConversationTree, ConversationNode } from '@/lib/types';
import { Bot, User, MessageCirclePlus, ChevronDown, ChevronRight } from 'lucide-react';
import AIPreview from './AIPreview';

interface MindMapInteractiveProps {
  conversationTree: ConversationTree;
  onAddChild: (parentId: string, message: string, model: string) => Promise<void>;
  selectedModel: string;
  isLoading?: boolean;
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MindMapInteractive({
  conversationTree,
  onAddChild,
  selectedModel,
  isLoading
}: MindMapInteractiveProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [tempMessage, setTempMessage] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  // 初始化节点位置和自动展开根节点的AI回复
  useEffect(() => {
    const horizontalSpacing = 300;
    const verticalSpacing = 100;
    const nodeWidth = 280;
    const nodeHeight = 80;

    // 检查是否有需要展开的长文本
    const checkNodeNeedsExpansion = (nodeId: string): boolean => {
      const node = conversationTree.nodes.get(nodeId);
      return node ? node.content.length > 30 : false;
    };
    const positions = new Map<string, NodePosition>();
    const initialExpanded = new Set<string>();

    const positionNode = (nodeId: string, x: number, y: number, level: number = 0): number => {
      const node = conversationTree.nodes.get(nodeId);
      if (!node) return 0;

      // 只显示用户节点（AI回复作为内容隐藏在节点内）
      if (node.type === 'user') {
        // 根据内容动态调整高度
        const contentLines = Math.ceil(node.content.length / 30);
        const hasAINode = node.children.length > 0;
        const baseHeight = hasAINode ? 130 : 80;
        const dynamicHeight = Math.max(baseHeight, 40 + contentLines * 20);

        positions.set(nodeId, { x, y, width: nodeWidth, height: dynamicHeight });

        // 如果是根节点且有AI回复，自动展开
        if (nodeId === conversationTree.rootNode && node.children.length > 0) {
          initialExpanded.add(nodeId);
        }

        // 计算子节点位置（只计算用户节点的子节点）
        let currentY = y;
        node.children.forEach(childId => {
          const childNode = conversationTree.nodes.get(childId);
          if (childNode && childNode.type === 'user') {
            currentY += positionNode(childId, x + horizontalSpacing, currentY, level + 1);
          }
        });

        return node.children.filter(id => {
          const child = conversationTree.nodes.get(id);
          return child?.type === 'user';
        }).length * verticalSpacing;
      }

      return 0;
    };

    positionNode(conversationTree.rootNode, 100, 300);
    setNodePositions(positions);
    setExpandedNodes(initialExpanded);
  }, [conversationTree]);

  const toggleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleAddChild = useCallback(async (parentId: string) => {
    if (tempMessage.trim()) {
      await onAddChild(parentId, tempMessage.trim(), selectedModel);
      setAddingChildTo(null);
      setTempMessage('');
    }
  }, [tempMessage, onAddChild, selectedModel]);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = nodePositions.get(nodeId);
    if (!pos) return;

    // 记录鼠标相对于节点的位置
    const offsetX = e.clientX - rect.left - pos.x;
    const offsetY = e.clientY - rect.top - pos.y;

    setDragState({
      isDragging: true,
      nodeId,
      startX: offsetX,
      startY: offsetY,
      currentX: pos.x,
      currentY: pos.y
    });
  }, [nodePositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.nodeId) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = e.clientX - rect.left - dragState.startX;
    const newY = e.clientY - rect.top - dragState.startY;

    setNodePositions(prev => {
      const newMap = new Map(prev);
      const pos = newMap.get(dragState.nodeId!);
      if (pos) {
        newMap.set(dragState.nodeId!, { ...pos, x: newX, y: newY });
      }
      return newMap;
    });

    setDragState(prev => ({ ...prev, currentX: newX, currentY: newY }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    });
  }, []);

  // 获取AI回复
  const getAIResponse = (userNodeId: string): string | null => {
    const userNode = conversationTree.nodes.get(userNodeId);
    if (!userNode || userNode.children.length === 0) return null;

    const aiNodeId = userNode.children[0];
    const aiNode = conversationTree.nodes.get(aiNodeId);

    // 即使内容为空字符串，也要显示AI节点，因为流式响应正在加载
    if (aiNode) {
      return aiNode.content || null;
    }

    return null;
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        setDragState({
          isDragging: false,
          nodeId: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0
        });
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.nodeId) return;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = e.clientX - rect.left - dragState.startX;
      const newY = e.clientY - rect.top - dragState.startY;

      setNodePositions(prev => {
        const newMap = new Map(prev);
        const pos = newMap.get(dragState.nodeId!);
        if (pos) {
          newMap.set(dragState.nodeId!, { ...pos, x: newX, y: newY });
        }
        return newMap;
      });

      setDragState(prev => ({ ...prev, currentX: newX, currentY: newY }));
    };

    if (dragState.isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [dragState]);

  return (
    <div className="w-full h-screen overflow-auto bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ minHeight: '100vh', cursor: dragState.isDragging ? 'grabbing' : 'default' }}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill="#9CA3AF"
            />
          </marker>
        </defs>

        {/* 连接线 */}
        <g className="connections">
          {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
            const node = conversationTree.nodes.get(nodeId);
            if (!node || node.type !== 'user') return null;

            // 查找父节点
            const parentNodeId = node.parentId;
            if (!parentNodeId) return null;

            const parentPos = nodePositions.get(parentNodeId);
            if (!parentPos) return null;

            const startX = parentPos.x + parentPos.width;
            const startY = parentPos.y + parentPos.height / 2;
            const endX = pos.x;
            const endY = pos.y + pos.height / 2;

            return (
              <path
                key={`connection-${nodeId}`}
                d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                stroke="#9CA3AF"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </g>

        {/* 节点 */}
        <g className="nodes">
          {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
            const node = conversationTree.nodes.get(nodeId);
            if (!node || node.type !== 'user') return null;

            const isHovered = hoveredNode === nodeId;
            const isExpanded = expandedNodes.has(nodeId);
            const hasAINode = node.children.length > 0;
            const aiResponse = getAIResponse(nodeId);

            // 获取AI模型信息
            const aiNode = conversationTree.nodes.get(node.children[0]);
            const aiModel = aiNode?.model || '';

            // 判断文本是否需要截断
            const textLength = node.content.length;
            const needsTruncation = textLength > 30;
            const displayText = needsTruncation && !isExpanded ? node.content.slice(0, 30) + '...' : node.content;

            // 使用存储的高度，但确保最小高度
            const dynamicHeight = Math.max(pos.height, 80);

            return (
              <g key={nodeId}>
                {/* 节点背景 */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={pos.width}
                  height={dynamicHeight}
                  rx="8"
                  fill="#EFF6FF"
                  stroke="#3B82F6"
                  strokeWidth={isHovered ? 3 : 2}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredNode(nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleMouseDown(e, nodeId)}
                />

                {/* 节点内容 */}
                <foreignObject
                  x={pos.x + 10}
                  y={pos.y + 10}
                  width={pos.width - 20}
                  height={dynamicHeight - 20}
                >
                  <div className="h-full flex flex-col">
                    {/* 上部分：用户文本内容 */}
                    <div
                      className="flex items-start gap-2 pb-2 cursor-pointer"
                      onClick={() => needsTruncation && toggleNodeExpand(nodeId)}
                    >
                      <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                          {displayText}
                          {needsTruncation && (
                            <span className="text-blue-600 ml-1">
                              {isExpanded ? '收起' : '展开'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 下部分：AI模型和按钮 */}
                    {hasAINode && (
                      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-blue-100">
                        <div className="flex items-center gap-2">
                          {aiModel && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                              {aiModel}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNodeExpand(nodeId);
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          {isExpanded ? '隐藏' : '查看'} AI回复
                        </button>
                      </div>
                    )}
                  </div>
                </foreignObject>

                {/* 添加按钮 */}
                {isHovered && (
                  <g
                    className="cursor-pointer"
                    onClick={() => setAddingChildTo(nodeId)}
                  >
                    <circle
                      cx={pos.x + pos.width - 15}
                      cy={pos.y + dynamicHeight - 15}
                      r="12"
                      fill="#3B82F6"
                      className="hover:opacity-80 transition-opacity"
                    />
                    <MessageCirclePlus
                      x={pos.x + pos.width - 21}
                      y={pos.y + dynamicHeight - 21}
                      width={12}
                      height={12}
                      color="white"
                    />
                  </g>
                )}

                {/* 添加子节点输入框 */}
                {addingChildTo === nodeId && (
                  <foreignObject
                    x={pos.x + pos.width + 20}
                    y={pos.y}
                    width={280}
                    height={100}
                  >
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3">
                      <input
                        type="text"
                        value={tempMessage}
                        onChange={(e) => setTempMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            // Tab键创建新节点
                            if (tempMessage.trim()) {
                              handleAddChild(nodeId);
                            }
                          } else if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && e.metaKey)) {
                            // Ctrl+Enter 或 Cmd+Enter 提交
                            e.preventDefault();
                            handleAddChild(nodeId);
                          } else if (e.key === 'Escape') {
                            setAddingChildTo(null);
                            setTempMessage('');
                          }
                        }}
                        placeholder="输入追问内容..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAddChild(nodeId)}
                          disabled={!tempMessage.trim() || isLoading}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                          发送
                        </button>
                        <button
                          onClick={() => {
                            setAddingChildTo(null);
                            setTempMessage('');
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-xs"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* AI回复预览 - 渲染在SVG外部 */}
      {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
        const node = conversationTree.nodes.get(nodeId);
        if (!node || node.type !== 'user') return null;

        const isExpanded = expandedNodes.has(nodeId);
        const aiResponse = getAIResponse(nodeId);

        if (!isExpanded || !aiResponse) return null;

        // 使用存储的高度
        const dynamicHeight = pos.height;

        return (
          <div
            key={`ai-preview-${nodeId}`}
            className="absolute z-50"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y + dynamicHeight + 10}px`,
            }}
          >
            <AIPreview
              content={aiResponse}
              isVisible={true}
              style={{}}
            />
          </div>
        );
      })}
    </div>
  );
}