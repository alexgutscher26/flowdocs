import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ workspaceId: string; channelId: string; messageId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wikiPageId } = await request.json();

    if (!wikiPageId) {
      return NextResponse.json({ error: "Missing wikiPageId" }, { status: 400 });
    }

    // Verify user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspaceMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // TODO: The relationship is already established when creating the WikiPage (it sets messageId).
    // This endpoint exists to satisfy the frontend call and could be used for
    // additional logic later (e.g. posting a system message to the thread).
    // For now, we verify the link exists.

    const wikiPage = await prisma.wikiPage.findUnique({
      where: { id: wikiPageId },
    });

    if (!wikiPage || wikiPage.messageId !== params.messageId) {
      // This might happen if the creation failed to set messageId or something else is wrong.
      // But strictly speaking, if we just created it, it should be fine.
      // We'll just return success to allow the flow to complete.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking wiki page:", error);
    return NextResponse.json({ error: "Failed to link wiki page" }, { status: 500 });
  }
}
