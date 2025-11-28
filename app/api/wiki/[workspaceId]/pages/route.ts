import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { indexWikiPage } from "@/lib/search";

/**
 * GET /api/wiki/[workspaceId]/pages
 * List all wiki pages in a workspace
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      workspaceId,
    };

    if (published !== null) {
      where.published = published === "true";
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch pages
    const [pages, total] = await Promise.all([
      prisma.wikiPage.findMany({
        where,
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
          _count: {
            select: {
              versions: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.wikiPage.count({ where }),
    ]);

    return NextResponse.json({
      pages,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching wiki pages:", error);
    return NextResponse.json({ error: "Failed to fetch wiki pages" }, { status: 500 });
  }
}

/**
 * POST /api/wiki/[workspaceId]/pages
 * Create a new wiki page
 */
export async function POST(
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

    // Verify workspace access and permissions
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspaceMember || !["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role)) {
      return NextResponse.json(
        { error: "You do not have permission to create pages in this workspace" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, tags, published, parentId } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
    }

    if (published && !content) {
      return NextResponse.json(
        { error: "Content is required for published pages" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check for existing slug
    const existing = await prisma.wikiPage.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A page with this title already exists" }, { status: 409 });
    }

    // Create page
    const page = await prisma.wikiPage.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        workspaceId,
        authorId: session.user.id,
        published: published ?? true,
        publishedAt: published ? new Date() : null,
        parentId: parentId || null,
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

    // Create initial version
    await prisma.wikiVersion.create({
      data: {
        pageId: page.id,
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        version: 1,
        changeNote: "Initial version",
        authorId: session.user.id,
      },
    });

    // Handle tags
    if (tags && Array.isArray(tags)) {
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
            pageId: page.id,
            tagId: tag.id,
          },
        });
      }
    }



    // Index wiki page in Typesense
    // Fetch complete page with tags for indexing
    const completePage = await prisma.wikiPage.findUnique({
      where: { id: page.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (completePage) {
      await indexWikiPage(completePage);
    }

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating wiki page:", error);
    return NextResponse.json({ error: "Failed to create wiki page" }, { status: 500 });
  }
}
