import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions - Add reaction
/**
 * Handles the POST request to add a reaction to a message.
 *
 * This function retrieves the workspaceId, channelId, and messageId from the request parameters,
 * checks the user's session for authorization, and validates the presence of an emoji.
 * It also verifies that the user is a member of the specified channel before creating a reaction object
 * and returning it as a JSON response. If any checks fail, appropriate error responses are returned.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with workspaceId, channelId, and messageId.
 * @returns A JSON response containing the created reaction or an error message.
 * @throws Error If an internal server error occurs during processing.
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

        // For now, store reactions in a simple way
        // In production, you'd want a MessageReaction model in your schema
        // This is a placeholder implementation
        const reaction = {
            id: `reaction_${Date.now()}`,
            messageId,
            userId: session.user.id,
            emoji,
            userName: session.user.name,
            userImage: session.user.image,
            createdAt: new Date(),
        };

        // TODO: Store in database when MessageReaction model is added
        // await prisma.messageReaction.create({ data: reaction });

        return NextResponse.json(reaction, { status: 201 });
    } catch (error) {
        console.error("Error adding reaction:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions/[reactionId] - Remove reaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string; reactionId: string }> }
) {
    try {
        const { reactionId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Delete from database when MessageReaction model is added
        // await prisma.messageReaction.delete({ where: { id: reactionId, userId: session.user.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing reaction:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
