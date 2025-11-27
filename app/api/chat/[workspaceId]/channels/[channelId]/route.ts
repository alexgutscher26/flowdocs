import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelType, ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/chat/[workspaceId]/channels/[channelId] - Get channel details
/**
 * Handles the GET request to retrieve channel information based on workspace and channel IDs.
 *
 * The function first authenticates the user session and checks if the user is a member of the specified workspace.
 * It then retrieves the channel details, including its members and message count, and verifies the user's access rights
 * based on the channel type. If any checks fail, appropriate error responses are returned.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and channelId.
 * @returns A JSON response containing the channel information or an error message.
 * @throws Error If an error occurs during the fetching process.
 */
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

        // Get channel
        const channel = await prisma.channel.findFirst({
            where: {
                id: channelId,
                workspaceId,
            },
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
                        messages: true,
                    },
                },
            },
        });

        if (!channel) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        // Check if user has access (public channel or member)
        const isMember = channel.members.some((m) => m.userId === session.user.id);
        if (channel.type !== ChannelType.PUBLIC && !isMember) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(channel);
    } catch (error) {
        console.error("Error fetching channel:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/chat/[workspaceId]/channels/[channelId] - Update channel
/**
 * Handles the PUT request to update a channel's details.
 *
 * This function first retrieves the workspaceId and channelId from the request parameters, then checks the user's session for authorization.
 * It verifies if the user is either the owner or an admin of the channel before proceeding to update the channel's name, description, and type.
 * Finally, it returns the updated channel information or an error response if any issues occur during the process.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a promise that resolves to an object with workspaceId and channelId.
 * @returns A JSON response with the updated channel information or an error message.
 * @throws Error If an internal server error occurs during the update process.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; channelId: string }> }
) {
    try {
        const { workspaceId, channelId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is owner or admin of the channel
        const channelMember = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: session.user.id,
                role: {
                    in: [ChannelRole.OWNER, ChannelRole.ADMIN],
                },
            },
        });

        if (!channelMember) {
            return NextResponse.json(
                { error: "Only channel owners/admins can update channels" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, type } = body;

        const channel = await prisma.channel.update({
            where: {
                id: channelId,
                workspaceId,
            },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(type && { type }),
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        messages: true,
                    },
                },
            },
        });

        return NextResponse.json(channel);
    } catch (error) {
        console.error("Error updating channel:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId] - Delete channel
/**
 * Deletes a channel if the user is the owner.
 *
 * The function first retrieves the workspaceId and channelId from the request parameters. It then checks the user's session for authentication. If the user is not authenticated or is not the owner of the channel, appropriate error responses are returned. If the user is authorized, the channel is deleted, and a success response is returned.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a promise that resolves to an object with workspaceId and channelId.
 * @returns A JSON response indicating success or an error message.
 * @throws Error If an internal server error occurs during the process.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; channelId: string }> }
) {
    try {
        const { workspaceId, channelId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is owner of the channel
        const channelMember = await prisma.channelMember.findFirst({
            where: {
                channelId,
                userId: session.user.id,
                role: ChannelRole.OWNER,
            },
        });

        if (!channelMember) {
            return NextResponse.json(
                { error: "Only channel owners can delete channels" },
                { status: 403 }
            );
        }

        // Delete channel (cascade will handle members and messages)
        await prisma.channel.delete({
            where: {
                id: channelId,
                workspaceId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting channel:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
