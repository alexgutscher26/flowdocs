import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/pin
/**
 * Handles the POST request to pin a message in a channel.
 *
 * This function retrieves the workspaceId, channelId, and messageId from the request parameters. It then checks the user's session for authentication and verifies if the user is a member of the specified channel. If the user is authorized, it updates the message to set it as pinned. In case of errors, appropriate responses are returned based on the failure point.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId, channelId, and messageId.
 * @returns A JSON response containing the updated message or an error message.
 * @throws Error If there is an issue during the execution of the function.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is member of channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update message
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: true },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error pinning message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/pin
/**
 * Deletes a pinned message from a channel.
 *
 * The function first retrieves the session to ensure the user is authenticated. It then checks if the user is a member of the specified channel. If the user is authorized, it proceeds to unpin the message by updating its status in the database. If any errors occur during this process, an appropriate error response is returned.
 *
 * @param request - The NextRequest object containing the request details.
 * @param params - An object containing a Promise that resolves to an object with workspaceId, channelId, and messageId.
 * @returns A JSON response containing the updated message or an error message.
 * @throws Error If an internal server error occurs during the operation.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  try {
    const { workspaceId, channelId, messageId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is member of channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
      },
    });

    if (!channelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update message
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: false },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error unpinning message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
