import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { convertThreadToWiki } from "@/lib/wiki-converter";

/**
 * POST /api/wiki/convert
 * Convert a chat thread to a wiki page
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, tags, sourceMessageId, channelId, workspaceId, metadata } =
      body;

    // Validate required fields
    if (!title || !content || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, workspaceId" },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspaceMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug already exists
    const existingPage = await prisma.wikiPage.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A wiki page with this title already exists" },
        { status: 409 }
      );
    }

    // Create wiki page
    const wikiPage = await prisma.wikiPage.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        workspaceId,
        authorId: session.user.id,
        messageId: sourceMessageId,
        published: true,
        publishedAt: new Date(),
      },
    });

    // Create initial version
    await prisma.wikiVersion.create({
      data: {
        pageId: wikiPage.id,
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        version: 1,
        changeNote: "Initial version created from chat thread",
        authorId: session.user.id,
      },
    });

    // Create tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const tagSlug = tagName
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        // Find or create tag
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

        // Link tag to page
        await prisma.wikiPageTag.create({
          data: {
            pageId: wikiPage.id,
            tagId: tag.id,
          },
        });
      }
    }

    // Fetch complete page with relations
    const completePage = await prisma.wikiPage.findUnique({
      where: { id: wikiPage.id },
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
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json(completePage, { status: 201 });
  } catch (error) {
    console.error("Error converting thread to wiki:", error);
    return NextResponse.json({ error: "Failed to convert thread to wiki page" }, { status: 500 });
  }
}
