import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET /api/workspaces/[id]/storage - Get storage usage and quota
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // Verify user has access to workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied to workspace" }, { status: 403 });
    }

    // Get workspace storage info
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        storageUsed: true,
        storageQuota: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get file count and breakdown by type
    const files = await prisma.file.groupBy({
      by: ["mimeType"],
      where: { workspaceId },
      _count: true,
      _sum: {
        size: true,
      },
    });

    // Categorize files
    const breakdown = {
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      documents: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    files.forEach((file) => {
      const count = file._count;
      const size = file._sum.size || 0;

      if (file.mimeType.startsWith("image/")) {
        breakdown.images.count += count;
        breakdown.images.size += size;
      } else if (file.mimeType.startsWith("video/")) {
        breakdown.videos.count += count;
        breakdown.videos.size += size;
      } else if (file.mimeType.startsWith("application/") || file.mimeType.startsWith("text/")) {
        breakdown.documents.count += count;
        breakdown.documents.size += size;
      } else {
        breakdown.other.count += count;
        breakdown.other.size += size;
      }
    });

    // Get largest files
    const largestFiles = await prisma.file.findMany({
      where: { workspaceId },
      orderBy: { size: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const storageUsed = Number(workspace.storageUsed);
    const storageQuota = Number(workspace.storageQuota);
    const percentageUsed = (storageUsed / storageQuota) * 100;

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      storage: {
        used: storageUsed,
        quota: storageQuota,
        available: storageQuota - storageUsed,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
      },
      breakdown,
      largestFiles,
    });
  } catch (error) {
    console.error("Storage info error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get storage info",
      },
      { status: 500 }
    );
  }
}
