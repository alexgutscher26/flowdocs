import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelType, ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/chat/[workspaceId]/channels/[channelId] - Get channel details
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

    // Check if user has access (public channel, member, or workspace admin)
    const isMember = channel.members.some((m) => m.userId === session.user.id);
    const isWorkspaceAdmin = membership.role === "ADMIN" || membership.role === "OWNER";

    if (channel.type !== ChannelType.PUBLIC && !isMember && !isWorkspaceAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/chat/[workspaceId]/channels/[channelId] - Update channel
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

    // If changing type, require owner permission
    if (type !== undefined) {
      // Get channel to check current type
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }

      // Only allow type changes by owner, and not for DM channels
      if (type !== channel.type) {
        if (channelMember.role !== ChannelRole.OWNER) {
          return NextResponse.json(
            { error: "Only channel owner can change channel type" },
            { status: 403 }
          );
        }

        if (channel.type === ChannelType.DM || type === ChannelType.DM) {
          return NextResponse.json(
            { error: "Cannot change type of Direct Message channels" },
            { status: 400 }
          );
        }

        if (type !== ChannelType.PUBLIC && type !== ChannelType.PRIVATE) {
          return NextResponse.json({ error: "Invalid channel type" }, { status: 400 });
        }
      }
    }

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channelId,
        workspaceId,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(type !== undefined && { type }),
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

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId] - Delete channel
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
