import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelType, ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/join - Join a public channel
/**
 * Handles the POST request to join a channel within a workspace.
 *
 * This function verifies the user's session, checks if the user is a member of the workspace,
 * retrieves the specified channel, and ensures that the channel is public. It also checks if
 * the user is already a member of the channel before adding them as a member. Finally, it
 * returns the updated channel information, including membership details.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and channelId.
 * @returns The updated channel information with membership details.
 * @throws Error If there is an internal server error during the process.
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
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Only allow joining public channels
    if (channel.type !== ChannelType.PUBLIC) {
      return NextResponse.json(
        { error: "Can only join public channels. Private channels require an invitation." },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Already a member of this channel" }, { status: 400 });
    }

    // Add user as member
    await prisma.channelMember.create({
      data: {
        channelId,
        userId: session.user.id,
        role: ChannelRole.MEMBER,
      },
    });

    // Return updated channel with membership info
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
    console.error("Error joining channel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
