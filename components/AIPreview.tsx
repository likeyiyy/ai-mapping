'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import 'highlight.js/styles/github.css';
import '@/styles/markdown.css';

interface AIPreviewProps {
  content: string;
  isVisible: boolean;
  style: React.CSSProperties;
}

export default function AIPreview({ content, isVisible, style }: AIPreviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) return null;

  // react-markdown handles most formatting automatically
  const processedContent = useMemo(() => {
    return content || '';
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
      // 可以添加一个简单的提示
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M20 6L9 17l-5-5"></path></svg>';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={{
        ...style,
        width: Math.max(600, typeof style.width === 'number' ? style.width : 600),
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <div
        className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-600">AI 回复</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="copy-button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="复制原始Markdown"
            >
              <Copy className="w-4 h-4" />
            </button>
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 markdown-preview" style={{ minHeight: '100px' }}>
          <div className="markdown-body prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </div>
      )}

      </div>
  );
}