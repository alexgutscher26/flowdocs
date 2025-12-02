import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { deleteFromStorage, generatePresignedUrl, updateStorageUsage } from "@/lib/file-storage";

// GET /api/files/[id] - Get file metadata and presigned URL
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify user has access to workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: file.workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied to workspace" }, { status: 403 });
    }

    // Generate presigned URL for secure download
    const presignedUrl = await generatePresignedUrl(file.key, 3600); // 1 hour

    return NextResponse.json({
      ...file,
      downloadUrl: presignedUrl,
    });
  } catch (error) {
    console.error("File get error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get file",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Delete file
/**
 * Deletes a file from the database and storage.
 *
 * This function checks the user's session for authorization and retrieves the file based on the provided ID. It verifies if the user has permission to delete the file, either as the uploader or as an admin/owner of the workspace. If authorized, it deletes the file and its thumbnail from storage, updates the storage usage, and removes the file from the database. In case of errors, appropriate responses are returned.
 *
 * @param req - The NextRequest object representing the HTTP request.
 * @param params - A promise that resolves to an object containing the file ID.
 * @returns A JSON response indicating success or error.
 * @throws Error If an error occurs during the deletion process.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permissions: uploader or workspace admin/owner
    const membership = file.workspace.members[0];
    const isUploader = file.uploadedById === session.user.id;
    const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

    if (!isUploader && !isAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete from storage
    await deleteFromStorage(file.key);

    // Delete thumbnail if exists
    if (file.thumbnailUrl) {
      const thumbnailKey = file.thumbnailUrl.split("/").slice(-2).join("/");
      await deleteFromStorage(thumbnailKey).catch((err) =>
        console.error("Failed to delete thumbnail:", err)
      );
    }

    // Update storage usage
    await updateStorageUsage(file.workspaceId, -file.size);

    // Delete from database
    await prisma.file.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
