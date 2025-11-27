import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// PUT /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId] - Edit message
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
            return NextResponse.json(
                { error: "Message content is required" },
                { status: 400 }
            );
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

        // TODO: Broadcast via WebSocket
        // getIO().to(channelId).emit('message_updated', updatedMessage)

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error("Error updating message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId] - Delete message
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

        // TODO: Broadcast via WebSocket
        // getIO().to(channelId).emit('message_deleted', { messageId })

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
