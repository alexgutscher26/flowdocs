import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/invite - Invite user to channel
/**
 * Handles the POST request to invite a user to a channel.
 *
 * This function first retrieves the workspace and channel IDs from the request parameters, then checks the user's session for authorization.
 * It validates the invited user's membership in the workspace and ensures they are not already a member of the channel before adding them.
 * Finally, it returns the updated channel information, including all members, or appropriate error responses based on the checks performed.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and channelId.
 * @returns The updated channel information with all members.
 * @throws Error If an internal server error occurs during the process.
 */
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

        // Get request body
        const body = await request.json();
        const { userId: invitedUserId } = body;

        if (!invitedUserId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if requester is admin/owner of the channel
        const requesterMembership = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: session.user.id,
                role: {
                    in: [ChannelRole.OWNER, ChannelRole.ADMIN],
                },
            },
        });

        if (!requesterMembership) {
            return NextResponse.json(
                { error: "Only channel admins and owners can invite members" },
                { status: 403 }
            );
        }

        // Verify invited user is a member of the workspace
        const workspaceMember = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: invitedUserId,
                    workspaceId,
                },
            },
        });

        if (!workspaceMember) {
            return NextResponse.json(
                { error: "User is not a member of this workspace" },
                { status: 400 }
            );
        }

        // Check if user is already a member
        const existingMember = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: invitedUserId,
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "User is already a member of this channel" },
                { status: 400 }
            );
        }

        // Add user as member
        await prisma.channelMember.create({
            data: {
                channelId,
                userId: invitedUserId,
                role: ChannelRole.MEMBER,
            },
        });

        // Return updated channel with all members
        const updatedChannel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: {
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
                },
                _count: {
                    select: {
                        members: true,
                        messages: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedChannel);
    } catch (error) {
        console.error("Error inviting member:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
