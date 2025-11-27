import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
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
            return NextResponse.json(
                { error: "You must be a member of this channel" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { content, threadId, type } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Message content is required" },
                { status: 400 }
            );
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                content,
                type: type || MessageType.TEXT,
                channelId,
                userId: session.user.id,
                threadId: threadId || null,
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

        // TODO: Broadcast via WebSocket
        // getIO().to(channelId).emit('message', message)

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
