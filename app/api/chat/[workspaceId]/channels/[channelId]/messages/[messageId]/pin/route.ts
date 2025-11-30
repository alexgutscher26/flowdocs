import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/pin
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

        // Verify user is member of channel
        const channelMember = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: session.user.id,
            },
        });

        if (!channelMember) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update message
        const message = await prisma.message.update({
            where: { id: messageId },
            data: { isPinned: true },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Error pinning message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/pin
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
    try {
        const { workspaceId, channelId, messageId } = await params;
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update message
        const message = await prisma.message.update({
            where: { id: messageId },
            data: { isPinned: false },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Error unpinning message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
