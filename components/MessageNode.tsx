'use client';

import { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, User } from 'lucide-react';
import { AI_MODELS } from '@/lib/constants';

interface MessageNodeProps {
  id: string;
  data: any;
  selected?: boolean;
}

export default function MessageNode({ id, data, selected }: MessageNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editText, setEditText] = useState(data.content || '');
  const [localEditingModel, setLocalEditingModel] = useState(data.editingModel || data.selectedModel);

  // Update edit text when data.content changes
  useEffect(() => {
    setEditText(data.content || '');
  }, [data.content]);

  // Update editing model when parent changes it
  useEffect(() => {
    setLocalEditingModel(data.editingModel || data.selectedModel);
  }, [data.editingModel, data.selectedModel]);

  // Toggle drawer
  const handleToggleDrawer = () => {
    if (data.onToggleDrawer) {
      data.onToggleDrawer(id);
    }
  };

  // Handle node click to set as active
  const handleNodeClick = (e: React.MouseEvent) => {
    // Prevent propagation when clicking on buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    if (data.onNodeClick) {
      data.onNodeClick(id);
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
          className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[350px] max-w-[450px] animate-pulse ${
            selected ? 'bg-blue-50 border-blue-600' : 'bg-blue-50 border-blue-400'
          }`}
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
            value={localEditingModel}
            onChange={(e) => {
              const newModel = e.target.value;
              setLocalEditingModel(newModel);
              if (data.onModelChange) {
                data.onModelChange(newModel);
              }
            }}
            className="w-full max-w-[280px] px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:border-blue-500 focus:outline-none"
            style={{ width: '280px' }}
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
        className={`relative px-4 py-3 rounded-lg border-2 shadow-lg min-w-[350px] max-w-[450px] transition-all hover:shadow-xl cursor-pointer ${
          selected
            ? 'bg-blue-50 border-blue-600 shadow-blue-200 shadow-lg'
            : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-md'
        }`}
        style={{ minWidth: '350px' }}
        onClick={handleNodeClick}
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
              onClick={handleToggleDrawer}
              className={`flex items-center gap-1 text-xs transition-colors ${
                data.isDrawerOpen
                  ? 'text-indigo-600 hover:text-indigo-800'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {data.isDrawerOpen ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {data.isDrawerOpen ? '关闭' : '查看'}回复
            </button>
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
}