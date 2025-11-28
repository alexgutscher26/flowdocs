import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * GET /api/wiki/[workspaceId]/[slug]
 * Get a specific wiki page by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; slug: string }> }
) {
  try {
    const { workspaceId, slug } = await params;

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

    // Fetch page with all relations
    const page = await prisma.wikiPage.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        versions: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        message: {
          select: {
            id: true,
            channelId: true,
            channel: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Wiki page not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.wikiPage.update({
      where: { id: page.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Find related pages (same tags)
    const relatedPages = await prisma.wikiPage.findMany({
      where: {
        workspaceId,
        id: {
          not: page.id,
        },
        tags: {
          some: {
            tagId: {
              in: page.tags.map((t) => t.tagId),
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
      },
      take: 5,
    });

    return NextResponse.json({
      ...page,
      relatedPages,
    });
  } catch (error) {
    console.error("Error fetching wiki page:", error);
    return NextResponse.json({ error: "Failed to fetch wiki page" }, { status: 500 });
  }
}

/**
 * PUT /api/wiki/[workspaceId]/[slug]
 * Update a wiki page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; slug: string }> }
) {
  try {
    const { workspaceId, slug } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing page
    const existingPage = await prisma.wikiPage.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
      include: {
        versions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
        },
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Wiki page not found" }, { status: 404 });
    }

    // Verify workspace access and permissions
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspaceMember || !["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this page" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, tags, published, changeNote } = body;

    // Update page
    const updatedPage = await prisma.wikiPage.update({
      where: { id: existingPage.id },
      data: {
        title: title || existingPage.title,
        content: content || existingPage.content,
        excerpt: excerpt || existingPage.excerpt,
        published: published ?? existingPage.published,
        publishedAt: published && !existingPage.published ? new Date() : existingPage.publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create new version
    const latestVersion = existingPage.versions[0];
    await prisma.wikiVersion.create({
      data: {
        pageId: updatedPage.id,
        title: updatedPage.title,
        content: updatedPage.content,
        excerpt: updatedPage.excerpt,
        version: (latestVersion?.version || 0) + 1,
        changeNote: changeNote || "Updated content",
        authorId: session.user.id,
      },
    });

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await prisma.wikiPageTag.deleteMany({
        where: {
          pageId: updatedPage.id,
        },
      });

      // Add new tags
      for (const tagName of tags) {
        const tagSlug = tagName
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        const tag = await prisma.wikiTag.upsert({
          where: {
            workspaceId_slug: {
              workspaceId,
              slug: tagSlug,
            },
          },
          create: {
            name: tagName,
            slug: tagSlug,
            workspaceId,
          },
          update: {},
        });

        await prisma.wikiPageTag.create({
          data: {
            pageId: updatedPage.id,
            tagId: tag.id,
          },
        });
      }
    }

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error("Error updating wiki page:", error);
    return NextResponse.json({ error: "Failed to update wiki page" }, { status: 500 });
  }
}

/**
 * DELETE /api/wiki/[workspaceId]/[slug]
 * Delete a wiki page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; slug: string }> }
) {
  try {
    const { workspaceId, slug } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch page
    const page = await prisma.wikiPage.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Wiki page not found" }, { status: 404 });
    }

    // Check if user is the author or workspace admin
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (
      page.authorId !== session.user.id &&
      workspaceMember?.role !== "OWNER" &&
      workspaceMember?.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Only the author or workspace admins can delete this page" },
        { status: 403 }
      );
    }

    // Delete page (cascade will handle versions and tags)
    await prisma.wikiPage.delete({
      where: { id: page.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wiki page:", error);
    return NextResponse.json({ error: "Failed to delete wiki page" }, { status: 500 });
  }
}
