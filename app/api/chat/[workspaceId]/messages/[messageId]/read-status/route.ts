import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; messageId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, messageId } = await params;
    const body = await req.json();
    const { markUnread } = body; // true to mark as unread, false to mark as read

    // Verify user has access to the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify message exists and belongs to workspace
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channel: {
          workspaceId,
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Update or create read status
    const readStatus = await prisma.messageReadStatus.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id,
        },
      },
      update: {
        markedUnread: markUnread,
        readAt: markUnread ? new Date(0) : new Date(), // Set to epoch if marking unread
      },
      create: {
        messageId,
        userId: session.user.id,
        markedUnread: markUnread,
        readAt: markUnread ? new Date(0) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      readStatus,
    });
  } catch (error) {
    console.error("Error updating read status:", error);
    return NextResponse.json({ error: "Failed to update read status" }, { status: 500 });
  }
}
