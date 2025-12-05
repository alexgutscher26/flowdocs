import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { broadcastToChannel } from "@/lib/websocket";
import { WebSocketEvent } from "@/types/chat";

// POST /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions - Add reaction
/**
 * Handles the POST request to add a reaction to a message.
 *
 * This function retrieves the workspace, channel, and message IDs from the request parameters, checks the user's session for authorization, and validates the presence of an emoji. It then verifies the user's membership based on the channel type (PUBLIC or PRIVATE) before creating a reaction in the database. Finally, it broadcasts the reaction via WebSocket and handles any potential errors that may arise during the process.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with workspaceId, channelId, and messageId.
 * @returns A JSON response containing the created reaction or an error message with the appropriate status code.
 */
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

    // Get channel to check type
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { type: true, workspaceId: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // For PUBLIC channels, verify user is a workspace member
    // For PRIVATE channels, verify user is a channel member
    if (channel.type === "PUBLIC") {
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: channel.workspaceId,
          userId: session.user.id,
        },
      });

      if (!workspaceMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // For PRIVATE/DM channels, require explicit channel membership
      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId,
          userId: session.user.id,
        },
      });

      if (!channelMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
  } catch (error: any) {
    console.error("Error adding reaction:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Reaction already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
