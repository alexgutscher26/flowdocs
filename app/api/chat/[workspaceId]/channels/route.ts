import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelType, ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/chat/[workspaceId]/channels - List channels
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
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

    // Workspace admins can see all channels, others see public channels + channels they're members of
    const isWorkspaceAdmin = membership.role === "ADMIN" || membership.role === "OWNER";

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        ...(isWorkspaceAdmin
          ? {
              OR: [
                { type: { not: ChannelType.DM } }, // Admins see all non-DM channels (Public & Private)
                {
                  members: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
              ],
            }
          : {
              OR: [
                { type: ChannelType.PUBLIC },
                {
                  members: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
              ],
            }),
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
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chat/[workspaceId]/channels - Create channel
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

    const body = await request.json();
    const { name, description, type, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    // Create channel with creator as owner
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        category,
        type: type || ChannelType.PUBLIC,
        workspaceId,
        members: {
          create: {
            userId: session.user.id,
            role: ChannelRole.OWNER,
          },
        },
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

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
