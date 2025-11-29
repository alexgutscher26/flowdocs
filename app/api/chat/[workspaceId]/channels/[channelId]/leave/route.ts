import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/leave - Leave a channel
/**
 * Handles the POST request to allow a user to leave a channel.
 *
 * This function first retrieves the workspaceId and channelId from the request parameters. It then checks the user's session for authentication. If the user is not authenticated or is not a member of the workspace or channel, appropriate error responses are returned. If the user is an owner of the channel, they are prevented from leaving. Finally, the user's membership in the channel is removed, and a success response is returned.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and channelId.
 * @returns A JSON response indicating success or an error message.
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
