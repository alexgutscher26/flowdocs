import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// DELETE /api/chat/[workspaceId]/channels/[channelId]/members/[memberId] - Remove member from channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; memberId: string }> }
) {
  try {
    const { workspaceId, channelId, memberId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requester is admin/owner of the channel
    const requesterMembership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id,
        role: {
          in: [ChannelRole.OWNER, ChannelRole.ADMIN],
        },
      },
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: "Only channel admins and owners can remove members" },
        { status: 403 }
      );
    }

    // Get the member to be removed
    const memberToRemove = await prisma.channelMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.channelId !== channelId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the owner
    if (memberToRemove.role === ChannelRole.OWNER) {
      return NextResponse.json({ error: "Cannot remove channel owner" }, { status: 403 });
    }

    // Remove the member
    await prisma.channelMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
