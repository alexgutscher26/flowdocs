import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelType, ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/dm - Get or Create DM channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot create DM with yourself" }, { status: 400 });
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

    // Check if DM already exists
    const existingDm = await prisma.channel.findFirst({
      where: {
        workspaceId,
        type: ChannelType.DM,
        AND: [
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
          {
            members: {
              some: {
                userId: targetUserId,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        members: {
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

    if (existingDm) {
      return NextResponse.json(existingDm);
    }

    // Create new DM channel
    // We'll use a generated name, but frontend will display other user's name
    const sortedIds = [session.user.id, targetUserId].sort();
    const channelName = `dm-${sortedIds.join("-")}`;

    const newDm = await prisma.channel.create({
      data: {
        name: channelName,
        type: ChannelType.DM,
        workspaceId,
        members: {
          create: [
            {
              userId: session.user.id,
              role: ChannelRole.MEMBER, // DMs don't really have owners/admins in the same way
            },
            {
              userId: targetUserId,
              role: ChannelRole.MEMBER,
            },
          ],
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        members: {
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

    return NextResponse.json(newDm, { status: 201 });
  } catch (error) {
    console.error("Error creating DM:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
