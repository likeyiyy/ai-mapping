'use client';

import { useRouter } from 'next/navigation';
import { ConversationTree } from '@/lib/types';
import { GitBranch } from 'lucide-react';
import ConversationActions from './ConversationActions';

interface ConversationHeaderProps {
  conversationTree: ConversationTree;
  onNewConversation: () => void;
  onLoadConversation: (conv: ConversationTree) => void;
}

export default function ConversationHeader({
  conversationTree,
  onNewConversation,
  onLoadConversation,
}: ConversationHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onNewConversation}
              className="flex items-center gap-3 hover:bg-gray-100/50 rounded-lg px-3 py-2 -ml-3 transition-colors"
              title="返回首页"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI 对话思维导图</h1>
            </button>
            <div className="text-sm text-gray-600">
              {conversationTree.title}
            </div>
          </div>
          <ConversationActions
            conversationTree={conversationTree}
            onLoadConversation={(conv) => {
              onLoadConversation(conv);
              router.push(`/chat/${conv.id}`);
            }}
            onNewConversation={onNewConversation}
            className="flex items-center gap-2"
          />
        </div>
      </div>
    </header>
  );
}
