import { ConversationNode, ConversationTree } from '@/lib/types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Convert frontend ConversationNode to backend format
export function convertNodeToDB(node: ConversationNode): any {
  return {
    id: node.id,
    type: node.type,
    content: node.content,
    model: node.model,
    parentId: node.parentId,
    children: node.children,
    metadata: {
      timestamp: node.metadata.timestamp,
      tokens: node.metadata.tokens,
      cost: node.metadata.cost
    },
    position: node.position
  };
}

// Convert backend format to frontend ConversationNode
export function convertDBNodeToFrontend(node: any): ConversationNode {
  return {
    id: node.id,
    type: node.type,
    content: node.content,
    model: node.model,
    parentId: node.parentId,
    children: node.children,
    metadata: node.metadata,
    position: node.position
  };
}

// Convert frontend ConversationTree to backend format
export function convertTreeToDB(tree: ConversationTree): any {
  const nodesObj: Record<string, any> = {};
  tree.nodes.forEach((node, key) => {
    nodesObj[key] = convertNodeToDB(node);
  });

  return {
    id: tree.id,
    title: tree.title,
    rootNode: tree.rootNode,
    nodes: nodesObj,
    layout: tree.layout,
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt
  };
}

// Convert backend format to frontend ConversationTree
export function convertDBTreeToFrontend(tree: any): ConversationTree {
  const nodes = new Map<string, ConversationNode>();
  Object.entries(tree.nodes).forEach(([key, value]: [string, any]) => {
    nodes.set(key, convertDBNodeToFrontend(value));
  });

  return {
    id: tree.id,
    title: tree.title,
    rootNode: tree.rootNode,
    nodes: nodes,
    layout: tree.layout,
    createdAt: new Date(tree.createdAt),
    updatedAt: new Date(tree.updatedAt)
  };
}

// API functions
export async function saveConversation(tree: ConversationTree): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(convertTreeToDB(tree)),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save conversation'
    };
  }
}

export async function updateConversation(tree: ConversationTree): Promise<ApiResponse<null>> {
  try {
    const response = await fetch('/api/conversations', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: tree.id,
        ...convertTreeToDB(tree)
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update conversation'
    };
  }
}

export async function getConversation(id: string): Promise<ApiResponse<ConversationTree>> {
  try {
    const response = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`);
    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        data: convertDBTreeToFrontend(data.data)
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch conversation'
    };
  }
}

export async function getAllConversations(): Promise<ApiResponse<ConversationTree[]>> {
  try {
    const response = await fetch('/api/conversations');
    const data = await response.json();

    if (data.success && data.data) {
      return {
        success: true,
        data: data.data.map((tree: any) => convertDBTreeToFrontend(tree))
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch conversations'
    };
  }
}

export async function deleteConversation(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete conversation'
    };
  }
}