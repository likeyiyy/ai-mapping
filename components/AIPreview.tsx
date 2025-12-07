'use client';

import { useMemo } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Bot } from 'lucide-react';

interface AIPreviewProps {
  content: string;
  isVisible: boolean;
  style: React.CSSProperties;
}

export default function AIPreview({ content, isVisible, style }: AIPreviewProps) {
  if (!isVisible) return null;

  // 预处理内容，确保Markdown格式正确
  const processedContent = useMemo(() => {
    if (!content) return '';

    // 确保代码块有正确的语言标识
    let processed = content;

    // 修复常见的格式问题
    processed = processed.replace(/```(\w+)?\n/g, (match, lang) => {
      return `\`\`\`${lang || 'text'}\n`;
    });

    // 确保列表格式正确
    processed = processed.replace(/^\s*[-*+]/gm, '-');
    processed = processed.replace(/^\s*\d+\./gm, '1.');

    return processed;
  }, [content]);

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={{
        ...style,
        width: Math.max(400, style.width || 0),
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
        <MarkdownPreview
          value={processedContent}
          style={{
            backgroundColor: 'transparent',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          className="custom-markdown"
        />
      </div>

      <style jsx>{`
        :global(.custom-markdown) {
          color: #333;
        }

        :global(.custom-markdown h1),
        :global(.custom-markdown h2),
        :global(.custom-markdown h3),
        :global(.custom-markdown h4),
        :global(.custom-markdown h5),
        :global(.custom-markdown h6) {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }

        :global(.custom-markdown h1) {
          font-size: 1.5em;
        }

        :global(.custom-markdown h2) {
          font-size: 1.3em;
        }

        :global(.custom-markdown h3) {
          font-size: 1.1em;
        }

        :global(.custom-markdown p) {
          margin: 0.5em 0;
        }

        :global(.custom-markdown ul),
        :global(.custom-markdown ol) {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }

        :global(.custom-markdown li) {
          margin: 0.25em 0;
        }

        :global(.custom-markdown code) {
          background-color: #f1f3f4;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.85em;
        }

        :global(.custom-markdown pre) {
          background-color: #f6f8fa;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 1em;
          overflow-x: auto;
        }

        :global(.custom-markdown pre code) {
          background-color: transparent;
          padding: 0;
          font-size: 0.9em;
        }

        :global(.custom-markdown blockquote) {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin: 1em 0;
          color: #666;
        }

        :global(.custom-markdown table) {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        :global(.custom-markdown th),
        :global(.custom-markdown td) {
          border: 1px solid #ddd;
          padding: 0.5em 1em;
          text-align: left;
        }

        :global(.custom-markdown th) {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        :global(.custom-markdown strong),
        :global(.custom-markdown b) {
          font-weight: 600;
        }

        :global(.custom-markdown em),
        :global(.custom-markdown i) {
          font-style: italic;
        }

        :global(.custom-markdown a) {
          color: #0366d6;
          text-decoration: none;
        }

        :global(.custom-markdown a:hover) {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}