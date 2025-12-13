import { useCallback, useEffect } from 'react';
import { ConversationTree } from '@/lib/types';
import { saveConversation, updateConversation, getAllConversations, getConversation } from '@/lib/api/conversations';

interface UseConversationPersistenceProps {
  conversationTree: ConversationTree | null;
  setConversationTree: (tree: ConversationTree | null) => void;
  onSaveSuccess?: (message: string) => void;
  onSaveError?: (error: string) => void;
}

export function useConversationPersistence({
  conversationTree,
  setConversationTree,
  onSaveSuccess,
  onSaveError
}: UseConversationPersistenceProps) {
  // Auto-save conversation when it changes
  const saveConversationChanges = useCallback(async () => {
    if (!conversationTree || conversationTree.nodes.size === 0) {
      console.log('Skipping save: no conversation tree or empty nodes');
      return;
    }

    try {
      // Check if this is a new conversation (no nodes with content from AI yet)
      const hasAIResponse = Array.from(conversationTree.nodes.values()).some(
        node => node.type === 'assistant' && node.content.length > 0
      );

      if (!hasAIResponse) {
        console.log('Skipping save: no AI response yet');
        return; // Don't save until we have an AI response
      }

      console.log('Auto-saving conversation:', conversationTree.id, 'with', conversationTree.nodes.size, 'nodes');
      const result = await saveConversation(conversationTree);

      if (result.success) {
        console.log('Conversation saved successfully');
        onSaveSuccess?.(result.message || 'Conversation saved successfully');
      } else {
        console.error('Failed to save conversation:', result.error);
        onSaveError?.(result.error || 'Failed to save conversation');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      onSaveError?.('Failed to save conversation: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [conversationTree, onSaveSuccess, onSaveError]);

  // Manual save function
  const saveConversationManual = useCallback(async () => {
    if (!conversationTree) return false;

    try {
      const result = await saveConversation(conversationTree);

      if (result.success) {
        onSaveSuccess?.(result.message || 'Conversation saved successfully');
        return true;
      } else {
        onSaveError?.(result.error || 'Failed to save conversation');
        return false;
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      onSaveError?.('Failed to save conversation');
      return false;
    }
  }, [conversationTree, onSaveSuccess, onSaveError]);

  // Load all conversations
  const loadAllConversations = useCallback(async () => {
    try {
      const result = await getAllConversations();

      if (result.success && result.data) {
        return result.data;
      } else {
        onSaveError?.(result.error || 'Failed to load conversations');
        return [];
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      onSaveError?.('Failed to load conversations');
      return [];
    }
  }, [onSaveError]);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    try {
      const result = await getConversation(id);

      if (result.success && result.data) {
        setConversationTree(result.data);
        return result.data;
      }

      onSaveError?.(result.error || 'Conversation not found');
      return null;
    } catch (error) {
      console.error('Error loading conversation:', error);
      onSaveError?.('Failed to load conversation');
      return null;
    }
  }, [setConversationTree, onSaveError]);

  // Create a new conversation (clear current)
  const createNewConversation = useCallback(() => {
    setConversationTree(null);
  }, [setConversationTree]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { deleteConversation: deleteFunc } = await import('@/lib/api/conversations');
      const result = await deleteFunc(id);

      if (result.success) {
        // If we deleted the current conversation, clear it
        if (conversationTree && conversationTree.id === id) {
          setConversationTree(null);
        }
        onSaveSuccess?.(result.message || 'Conversation deleted successfully');
        return true;
      } else {
        onSaveError?.(result.error || 'Failed to delete conversation');
        return false;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      onSaveError?.('Failed to delete conversation');
      return false;
    }
  }, [conversationTree, setConversationTree, onSaveSuccess, onSaveError]);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    if (!conversationTree) return;

    const timeoutId = setTimeout(() => {
      saveConversationChanges();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [conversationTree, saveConversationChanges]);

  return {
    saveConversationManual,
    loadAllConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    autoSave: saveConversationChanges
  };
}