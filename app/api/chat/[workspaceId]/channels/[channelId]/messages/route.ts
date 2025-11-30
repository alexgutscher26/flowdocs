import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { indexMessage } from "@/lib/search";
import { MessageType } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/chat/[workspaceId]/channels/[channelId]/messages - List messages with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> }
) {
  try {
    const { workspaceId, channelId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        workspaceId,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check access (public channel or member)
    if (channel.type !== "PUBLIC" && !channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pagination params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");
    const threadId = searchParams.get("threadId");

    // Build query
    const where: any = {
      channelId,
      ...(threadId ? { threadId } : { threadId: null }), // Only root messages or specific thread
    };

    const messages = await prisma.message.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor
      }),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, -1) : messages;

    return NextResponse.json({
      messages: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chat/[workspaceId]/channels/[channelId]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> }
) {
  try {
    const { workspaceId, channelId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      console.error("[Messages API] Unauthorized: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is member of channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    if (!channelMember) {
      console.error(`[Messages API] Forbidden: User ${session.user.id} is not a member of channel ${channelId}`);
      return NextResponse.json({ error: "You must be a member of this channel" }, { status: 403 });
    }

    const body = await request.json();
    const { content, threadId, type, attachments } = body;

    // Validate: require either content or attachments
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      console.error("[Messages API] Bad request: Neither content nor attachments provided");
      return NextResponse.json({ error: "Message must have either content or attachments" }, { status: 400 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content?.trim() || "",
        type: attachments && attachments.length > 0
          ? (attachments[0].type?.startsWith('image/') ? MessageType.IMAGE : MessageType.FILE)
          : (type || MessageType.TEXT),
        channelId,
        userId: session.user.id,
        threadId: threadId || null,
        ...(attachments && attachments.length > 0 && { attachments }),
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    console.log(`[Messages API] Message created: ${message.id} in channel ${channelId}`);

    // TODO: Broadcast via WebSocket
    // getIO().to(channelId).emit('message', message)

    // Index message in Typesense
    try {
      await indexMessage(message);
    } catch (indexError) {
      console.error("[Messages API] Error indexing message:", indexError);
      // Don't fail the request if indexing fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[Messages API] Error creating message:", error);
    if (error instanceof Error) {
      console.error("[Messages API] Error details:", error.message);
      console.error("[Messages API] Stack trace:", error.stack);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
