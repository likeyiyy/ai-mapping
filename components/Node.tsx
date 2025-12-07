'use client';

import { ConversationNode } from '@/lib/types';
import { useState } from 'react';
import { MessageCirclePlus, GitBranch, ChevronDown, ChevronRight, Bot, User, Copy, Edit, Trash2 } from 'lucide-react';

interface NodeProps {
  node: ConversationNode;
  onExpand: () => void;
  onAddChild: (nodeId: string) => void;
  onCreateBranch: (nodeId: string) => void;
  onEdit: (nodeId: string, newContent: string) => void;
  onDelete: (nodeId: string) => void;
  onModelChange: (nodeId: string, newModel: string) => void;
  isExpanded: boolean;
  hasChildren: boolean;
  level: number;
}

export default function Node({
  node,
  onExpand,
  onAddChild,
  onCreateBranch,
  onEdit,
  onDelete,
  onModelChange,
  isExpanded,
  hasChildren,
  level,
}: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [showActions, setShowActions] = useState(false);

  const handleSaveEdit = () => {
    onEdit(node.id, editContent);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(node.content);
  };

  return (
    <div className="relative pl-8">
      {/* 连接线 */}
      {level > 0 && (
        <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-gray-300" />
      )}

      {/* 节点容器 */}
      <div
        className={`
          relative bg-white rounded-lg shadow-md border-2 border-gray-200
          hover:border-blue-400 transition-all duration-200 p-4 min-w-[300px]
          ${level === 0 ? 'border-blue-500' : ''}
          ${node.type === 'user' ? 'bg-blue-50' : 'bg-gray-50'}
        `}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 节点头部 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {node.type === 'user' ? (
              <User className="w-5 h-5 text-blue-600" />
            ) : (
              <Bot className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold text-sm">
              {node.type === 'user' ? '用户' : 'AI'}
            </span>
            {node.model && (
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {node.model}
              </span>
            )}
          </div>

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-1">
              {node.type === 'assistant' && (
                <button
                  onClick={() => onModelChange(node.id, '')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="切换模型"
                >
                  <GitBranch className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-200 rounded"
                title="复制"
              >
                <Copy className="w-4 h-4" />
              </button>
              {node.type === 'user' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(node.id)}
                className="p-1 hover:bg-red-200 rounded text-red-600"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-800 line-clamp-3">
              {node.content}
            </p>
            {hasChildren && (
              <button
                onClick={onExpand}
                className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {node.children.length} 个回复
              </button>
            )}
          </div>
        )}

        {/* 添加按钮 */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          <button
            onClick={() => onAddChild(node.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-lg"
            title="添加追问"
          >
            <MessageCirclePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCreateBranch(node.id)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-1 shadow-lg"
            title="创建分支"
          >
            <GitBranch className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}