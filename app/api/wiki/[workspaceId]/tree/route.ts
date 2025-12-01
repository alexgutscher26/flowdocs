import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Handles the GET request to fetch the wiki tree for a specific workspace.
 *
 * This function retrieves the workspace ID from the request parameters, checks the user's session for authorization,
 * and verifies if the user is a member of the specified workspace. It then fetches all published pages for the workspace,
 * constructs a tree structure of the pages, and returns the root nodes. If any errors occur during the process,
 * appropriate error responses are returned.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @param params - An object containing a promise that resolves to the workspace ID.
 * @returns A JSON response containing the root nodes of the wiki tree.
 * @throws Error If there is an issue fetching the wiki tree.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workspace access
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspaceMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Fetch all pages for the workspace
    // We fetch all pages and build the tree in memory to avoid N+1 queries
    // For very large wikis, we might want to switch to lazy loading children
    const pages = await prisma.wikiPage.findMany({
      where: {
        workspaceId,
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    // Build tree structure
    const pageMap = new Map();
    const rootNodes: any[] = [];

    // Initialize map
    pages.forEach((page) => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Connect parents and children
    pages.forEach((page) => {
      const node = pageMap.get(page.id);
      if (page.parentId && pageMap.has(page.parentId)) {
        const parent = pageMap.get(page.parentId);
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return NextResponse.json(rootNodes);
  } catch (error) {
    console.error("Error fetching wiki tree:", error);
    return NextResponse.json({ error: "Failed to fetch wiki tree" }, { status: 500 });
  }
}
