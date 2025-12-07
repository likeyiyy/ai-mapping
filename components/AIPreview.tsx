'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot } from 'lucide-react';
import 'highlight.js/styles/github.css';
import '@/styles/markdown.css';

interface AIPreviewProps {
  content: string;
  isVisible: boolean;
  style: React.CSSProperties;
}

export default function AIPreview({ content, isVisible, style }: AIPreviewProps) {
  if (!isVisible) return null;

  // react-markdown handles most formatting automatically
  const processedContent = useMemo(() => {
    return content || '';
  }, [content]);

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
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-start gap-2">
          <Bot className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span className="text-xs font-medium text-emerald-600">AI 回复</span>
        </div>
      </div>

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

      </div>
  );
}