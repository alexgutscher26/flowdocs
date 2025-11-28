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

    // Get channels where user is a member or public channels
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
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
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
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
/**
 * Handles the creation of a new channel within a specified workspace.
 *
 * This function first retrieves the workspaceId from the request parameters and checks the user's session for authentication.
 * It verifies that the user is a member of the workspace before proceeding to create a channel with the provided details.
 * If any validation fails, appropriate error responses are returned.
 * Finally, it creates the channel and returns the channel data upon success.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a promise that resolves to the workspaceId.
 * @returns A JSON response containing the created channel data or an error message.
 * @throws Error If an internal error occurs during channel creation.
 */
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
