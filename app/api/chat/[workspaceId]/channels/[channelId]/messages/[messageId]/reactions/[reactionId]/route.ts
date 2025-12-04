import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { broadcastToChannel } from "@/lib/websocket";
import { WebSocketEvent } from "@/types/chat";

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions/[reactionId] - Remove reaction
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
        // We use deleteMany to ensure we only delete if it belongs to the user
        // But deleteMany doesn't return the deleted record, so we might want to check first if we need strict 404
        // For now, standard delete with where clause on ID is fine, but prisma.messageReaction.delete requires unique ID.
        // So we should findFirst then delete, or just delete and catch error if not found/owned.

        // Better approach: find unique and check owner
        const reaction = await prisma.messageReaction.findUnique({
            where: { id: reactionId },
        });

        if (!reaction) {
            return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
        }

        if (reaction.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.messageReaction.delete({
            where: { id: reactionId },
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
