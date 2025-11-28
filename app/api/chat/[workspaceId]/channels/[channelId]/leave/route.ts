import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/leave - Leave a channel
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

        // Verify user is member of workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: session.user.id,
                    workspaceId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get channel membership
        const channelMember = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: session.user.id,
            },
        });

        if (!channelMember) {
            return NextResponse.json({ error: "Not a member of this channel" }, { status: 400 });
        }

        // Prevent owner from leaving
        if (channelMember.role === ChannelRole.OWNER) {
            return NextResponse.json(
                { error: "Channel owner cannot leave. Delete the channel or transfer ownership first." },
                { status: 403 }
            );
        }

        // Remove membership
        await prisma.channelMember.delete({
            where: {
                id: channelMember.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error leaving channel:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
