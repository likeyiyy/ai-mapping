'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';

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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="prose prose-sm max-w-none"
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      </div>
  );
}