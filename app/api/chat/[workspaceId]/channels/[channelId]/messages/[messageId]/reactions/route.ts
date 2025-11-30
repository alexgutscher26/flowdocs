import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { broadcastToChannel } from "@/lib/websocket";
import { WebSocketEvent } from "@/types/chat";

// POST /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    // Verify user has access to channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create reaction in database
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji,
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

    // Broadcast reaction added via WebSocket
    try {
      broadcastToChannel(channelId, WebSocketEvent.REACTION_ADDED, {
        messageId,
        reaction,
      });
    } catch (error) {
      console.error("Error broadcasting reaction:", error);
    }

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions/[reactionId] - Remove reaction
/**
 * Deletes a reaction from a message in a channel.
 *
 * The function first retrieves the session to ensure the user is authorized. It then deletes the reaction from the database, verifying that the user owns the reaction. After deletion, it attempts to broadcast the removal of the reaction via WebSocket. If any errors occur during these processes, they are logged, and an appropriate response is returned.
 *
 * @param request - The HTTP request object.
 * @param params - An object containing a promise that resolves to the parameters needed for deletion, including workspaceId, channelId, messageId, and reactionId.
 * @returns A JSON response indicating success or error status.
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
      reactionId: string;
    }>;
  }
) {
  try {
    const { reactionId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete reaction from database
    // Verify user owns the reaction before deleting
    await prisma.messageReaction.delete({
      where: {
        id: reactionId,
        userId: session.user.id,
      },
    });

    // Broadcast reaction removed via WebSocket
    try {
      broadcastToChannel(channelId, WebSocketEvent.REACTION_REMOVED, {
        messageId,
        reactionId,
      });
    } catch (error) {
      console.error("Error broadcasting reaction removal:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
