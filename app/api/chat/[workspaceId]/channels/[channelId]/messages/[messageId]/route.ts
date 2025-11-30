import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { broadcastToChannel } from "@/lib/websocket";
import { WebSocketEvent } from "@/types/chat";

// PUT /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId] - Edit message
/**
 * Handles the PUT request to update a message in a specific channel.
 *
 * This function retrieves the session of the user, verifies their authorization, and checks if the message belongs to the user.
 * If valid, it updates the message content and broadcasts the update via WebSocket.
 * It handles various error scenarios, returning appropriate responses for unauthorized access, missing messages, and invalid content.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a promise that resolves to the workspaceId, channelId, and messageId.
 * @returns A JSON response containing the updated message or an error message.
 */
export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
      channelId: string;
      messageId: string;
    }>;
  }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify message belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
        userId: session.user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Broadcast via WebSocket
    try {
      broadcastToChannel(channelId, WebSocketEvent.MESSAGE_UPDATED, updatedMessage);
    } catch (error) {
      console.error("Error broadcasting message update:", error);
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId] - Delete message
/**
 * Deletes a message from a specified channel in a workspace.
 *
 * The function first retrieves the session to ensure the user is authenticated. It then verifies that the message belongs to the user before proceeding to delete it from the database. After deletion, it attempts to broadcast the deletion event via WebSocket. If any errors occur during these processes, appropriate error responses are returned.
 *
 * @param request - The HTTP request object containing the request details.
 * @param params - An object containing a promise that resolves to the workspaceId, channelId, and messageId.
 * @returns A JSON response indicating the success of the deletion or an error message.
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
      channelId: string;
      messageId: string;
    }>;
  }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify message belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
        userId: session.user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete message
    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    // Broadcast via WebSocket
    try {
      broadcastToChannel(channelId, WebSocketEvent.MESSAGE_DELETED, { messageId });
    } catch (error) {
      console.error("Error broadcasting message deletion:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
