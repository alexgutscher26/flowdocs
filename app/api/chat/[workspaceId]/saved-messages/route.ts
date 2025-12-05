import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Handles the GET request to fetch saved messages for a user in a specific workspace.
 *
 * The function first retrieves the user session and checks for authorization. It then verifies the user's membership in the specified workspace. If the user has access, it fetches the saved messages associated with the user and the workspace, including relevant message and user details. In case of any errors during the process, it returns appropriate error responses.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with the workspaceId.
 * @returns A JSON response containing the saved messages or an error message.
 * @throws Error If there is an issue fetching saved messages.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

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

    // Fetch saved messages for this user in this workspace
    const savedMessages = await prisma.savedMessage.findMany({
      where: {
        userId: session.user.id,
        message: {
          channel: {
            workspaceId,
          },
        },
      },
      include: {
        message: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            channel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(savedMessages);
  } catch (error) {
    console.error("Error fetching saved messages:", error);
    return NextResponse.json({ error: "Failed to fetch saved messages" }, { status: 500 });
  }
}
