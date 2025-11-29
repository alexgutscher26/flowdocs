import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ChannelRole } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// PATCH /api/chat/[workspaceId]/channels/[channelId]/members/[memberId]/role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string; memberId: string }> }
) {
  try {
    const { workspaceId, channelId, memberId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || (role !== ChannelRole.ADMIN && role !== ChannelRole.MEMBER)) {
      return NextResponse.json({ error: "Invalid role. Must be ADMIN or MEMBER" }, { status: 400 });
    }

    // Check if requester is admin or owner of the channel
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
        { error: "Only channel admins and owners can change roles" },
        { status: 403 }
      );
    }

    // Get the member being modified
    const targetMember = await prisma.channelMember.findUnique({
      where: { id: memberId },
      include: { channel: true },
    });

    if (!targetMember || targetMember.channelId !== channelId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot change OWNER role
    if (targetMember.role === ChannelRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot change the role of the channel owner" },
        { status: 403 }
      );
    }

    // Cannot demote yourself if you're the only admin (besides owner)
    if (targetMember.userId === session.user.id && targetMember.role === ChannelRole.ADMIN) {
      const adminCount = await prisma.channelMember.count({
        where: {
          channelId,
          role: {
            in: [ChannelRole.ADMIN, ChannelRole.OWNER],
          },
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote yourself as the only admin" },
          { status: 403 }
        );
      }
    }

    // Update the role
    const updatedMember = await prisma.channelMember.update({
      where: { id: memberId },
      data: { role },
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
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
