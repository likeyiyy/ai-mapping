'use client';

import { useState } from 'react';
import { Save, FolderOpen, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { ConversationTree } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';

interface ConversationActionsProps {
  conversationTree: ConversationTree | null;
  onLoadConversation: (conversation: ConversationTree) => void;
  onNewConversation: () => void;
  className?: string;
}

export default function ConversationActions({
  conversationTree,
  onLoadConversation,
  onNewConversation,
  className = ''
}: ConversationActionsProps) {
  const [savedConversations, setSavedConversations] = useState<ConversationTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!conversationTree) return;

    setIsLoading(true);
    try {
      const { saveConversation } = await import('@/lib/api/conversations');
      const result = await saveConversation(conversationTree);

      if (result.success) {
        toast.success('Conversation saved successfully!', {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
      } else {
        toast.error(result.error || 'Failed to save conversation', {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        });
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation', {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadConversations = async () => {
    setIsLoading(true);
    try {
      const { getAllConversations } = await import('@/lib/api/conversations');
      const result = await getAllConversations();

      if (result.success && result.data) {
        setSavedConversations(result.data);
      } else {
        toast.error(result.error || 'Failed to load conversations', {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations', {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const { deleteConversation } = await import('@/lib/api/conversations');
      const result = await deleteConversation(id);

      if (result.success) {
        setSavedConversations(prev => prev.filter(conv => conv.id !== id));
        toast.success('Conversation deleted successfully!', {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
      } else {
        toast.error(result.error || 'Failed to delete conversation', {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation', {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!conversationTree || conversationTree.nodes.size === 0 || isLoading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="w-4 h-4" />
        Save
      </button>

      {/* Load/New Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Options
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-md shadow-lg">
          <DropdownMenuItem
            onClick={onNewConversation}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLoadConversations}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            Load Conversations
          </DropdownMenuItem>

          {savedConversations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2 text-xs font-medium text-gray-500">
                Saved Conversations
              </div>
              {savedConversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between group hover:bg-gray-100"
                >
                  <button
                    onClick={() => onLoadConversation(conv)}
                    className="flex-1 px-3 py-2 text-sm text-left text-gray-700 truncate"
                    title={conv.title}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id, conv.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {savedConversations.length > 5 && (
                <div className="px-3 py-2 text-xs text-gray-500">
                  And {savedConversations.length - 5} more...
                </div>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}