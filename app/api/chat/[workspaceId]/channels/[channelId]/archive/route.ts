import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/archive
/**
 * Handles the POST request to archive or unarchive a channel.
 *
 * This function retrieves the workspaceId and channelId from the request parameters, checks the user's session for authorization,
 * and validates the 'archived' boolean from the request body. It ensures that only channel owners can perform the action,
 * updates the channel's archived status in the database, and returns the updated channel information.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and channelId.
 * @returns The updated channel information in JSON format.
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

    const body = await request.json();
    const { archived } = body;

    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "archived must be a boolean" }, { status: 400 });
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
        { error: "Only channel owners can archive/unarchive channels" },
        { status: 403 }
      );
    }

    // Update channel
    const channel = await prisma.channel.update({
      where: {
        id: channelId,
        workspaceId,
      },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        members: {
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error archiving channel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
