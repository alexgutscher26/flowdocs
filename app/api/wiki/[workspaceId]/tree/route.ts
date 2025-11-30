import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

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
