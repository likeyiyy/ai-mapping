'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AI_MODELS } from '@/lib/constants';

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ChatInput({
  onSendMessage,
  isLoading,
  placeholder,
  selectedModel,
  onModelChange
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    const trimmedMessage = message.trim();
    setMessage('');

    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(trimmedMessage, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-white border rounded-lg shadow-lg p-4">
      <div className="flex gap-3">
        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "输入你的问题..."}
            className="w-full px-4 py-2 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
        </div>

        {/* 发送按钮 */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 底部信息栏 */}
      <div className="flex justify-start items-center mt-2">
        {/* 模型选择器 */}
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>

        </div>
    </form>
  );
}