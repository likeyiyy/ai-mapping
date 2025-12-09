import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ConversationService } from '@/lib/models/conversation';
import { ConversationTreeDB } from '@/lib/models/conversation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const service = new ConversationService(db);

    // Create conversation object with current timestamp
    const conversation: Omit<ConversationTreeDB, '_id'> = {
      id: body.id,
      title: body.title || 'Untitled Conversation',
      rootNode: body.rootNode,
      nodes: body.nodes,
      layout: body.layout || 'tree',
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: new Date(),
      userId: body.userId // Optional, for future multi-user support
    };

    const result = await service.saveConversation(conversation);

    return NextResponse.json({
      success: true,
      id: result.toString(),
      message: 'Conversation saved successfully'
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save conversation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    const db = await getDatabase();
    const service = new ConversationService(db);

    if (id) {
      // Get specific conversation
      const conversation = await service.getConversation(id);
      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: conversation });
    } else {
      // Get all conversations
      const conversations = await service.getAllConversations(userId || undefined);
      return NextResponse.json({ success: true, data: conversations });
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const service = new ConversationService(db);

    // For PUT, we treat it as save (create or update)
    const conversation: Omit<ConversationTreeDB, '_id'> = {
      id,
      title: updateData.title || 'Untitled Conversation',
      rootNode: updateData.rootNode,
      nodes: updateData.nodes,
      layout: updateData.layout || 'tree',
      createdAt: updateData.createdAt ? new Date(updateData.createdAt) : new Date(),
      updatedAt: new Date(),
      userId: updateData.userId
    };

    await service.saveConversation(conversation);

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}