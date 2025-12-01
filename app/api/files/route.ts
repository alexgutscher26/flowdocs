import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { uploadFile, scanFileForViruses, updateStorageUsage } from "@/lib/file-storage";
import { fileListQuerySchema } from "@/lib/validations/file";

// POST /api/files - Upload a new file
/**
 * Handles the POST request for file uploads and processing.
 *
 * This function authenticates the user session, validates the input data, and checks user access to the specified workspace.
 * It processes the uploaded file, scans it for viruses asynchronously, and creates a record in the database.
 * If the file is found to be infected, it deletes the file and updates the storage usage accordingly.
 *
 * @param req - The NextRequest object containing the request data.
 * @returns A JSON response containing the file record or an error message.
 * @throws Error If an error occurs during file upload or processing.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const generateThumbnail = formData.get("generateThumbnail") === "true";
    const optimize = formData.get("optimize") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file with processing
    const result = await uploadFile(buffer, file.name, workspaceId, session.user.id, {
      generateThumbnail,
      imageProcessing: { optimize },
    });

    // Scan for viruses asynchronously (don't block response)
    scanFileForViruses(buffer, file.name).then(async (scanResult) => {
      await prisma.file.update({
        where: { key: result.key },
        data: {
          virusScanned: true,
          virusScanResult: scanResult.clean ? "CLEAN" : "INFECTED",
          virusScanProvider: scanResult.provider,
        },
      });

      // If infected, delete the file
      if (!scanResult.clean) {
        const { deleteFromStorage } = await import("@/lib/file-storage");
        await deleteFromStorage(result.key);
        await prisma.file.delete({ where: { key: result.key } });
        // Update storage usage
        await updateStorageUsage(workspaceId, -result.size);
      }
    });

    // Create database record
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        sanitizedName: result.key.split("/").pop() || file.name,
        key: result.key,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        mimeType: result.mimeType,
        size: result.size,
        width: result.width,
        height: result.height,
        workspaceId,
        uploadedById: session.user.id,
        virusScanned: false,
        virusScanResult: "PENDING",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "File upload failed",
      },
      { status: 500 }
    );
  }
}

// GET /api/files - List files for workspace
/**
 * Handles the GET request to retrieve a list of files based on query parameters.
 *
 * This function first checks the user's session for authorization. It then validates the query parameters for pagination, filtering, and sorting.
 * After verifying the user's access to the specified workspace, it constructs a query to fetch the total count and the files, returning them in a paginated format.
 *
 * @param req - The NextRequest object containing the request details.
 * @returns A JSON response containing the list of files and pagination information.
 * @throws Error If an error occurs during the file retrieval process.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryParams = {
      workspaceId: searchParams.get("workspaceId") || "",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      type: (searchParams.get("type") || "all") as "image" | "document" | "video" | "all",
      sortBy: (searchParams.get("sortBy") || "createdAt") as "createdAt" | "size" | "name",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
      uploadedBy: searchParams.get("uploadedBy") || undefined,
    };

    const validated = fileListQuerySchema.parse(queryParams);

    // Verify user has access to workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: validated.workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied to workspace" }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      workspaceId: validated.workspaceId,
    };

    if (validated.type !== "all") {
      const typeMap = {
        image: "image/",
        video: "video/",
        document: ["application/", "text/"],
      };

      const prefix = typeMap[validated.type];
      if (Array.isArray(prefix)) {
        where.OR = prefix.map((p) => ({ mimeType: { startsWith: p } }));
      } else {
        where.mimeType = { startsWith: prefix };
      }
    }

    if (validated.uploadedBy) {
      where.uploadedById = validated.uploadedBy;
    }

    // Get total count
    const total = await prisma.file.count({ where });

    // Get files
    const files = await prisma.file.findMany({
      where,
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      files,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        pages: Math.ceil(total / validated.limit),
      },
    });
  } catch (error) {
    console.error("File list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list files",
      },
      { status: 500 }
    );
  }
}
