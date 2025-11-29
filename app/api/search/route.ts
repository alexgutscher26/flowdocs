import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

type ContentType = "message" | "wiki" | "file" | "user" | "all";

/**
 * GET /api/search
 * Database-based search endpoint (fallback when Typesense is not available)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = (searchParams.get("type") || "all") as ContentType;
    const workspaceId = searchParams.get("workspaceId");
    const channelId = searchParams.get("channelId");
    const authorId = searchParams.get("authorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tags = searchParams.get("tags");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Query parameter "workspaceId" is required' },
        { status: 400 }
      );
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

    const results: any = {
      messages: [],
      wikiPages: [],
      files: [],
      users: [],
    };

    const facets: any = {
      byType: { messages: 0, wikiPages: 0, files: 0, users: 0 },
      byChannel: {},
      byAuthor: {},
    };

    // Search messages
    if (type === "all" || type === "message") {
      const whereClause: any = {
        content: { contains: query, mode: "insensitive" },
        channel: { workspaceId },
      };

      if (channelId) whereClause.channelId = channelId;
      if (authorId) whereClause.userId = authorId;
      if (startDate) whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(startDate) };
      if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };

      const messages = await prisma.message.findMany({
        where: whereClause,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      results.messages = messages.map((msg) => ({
        document: {
          id: msg.id,
          content: msg.content,
          channelId: msg.channelId,
          userId: msg.userId,
          createdAt: msg.createdAt.getTime(),
        },
        highlight: {
          content: { snippet: msg.content },
        },
      }));

      facets.byType.messages = messages.length;
    }

    // Search wiki pages
    if (type === "all" || type === "wiki") {
      const whereClause: any = {
        workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      };

      if (authorId) whereClause.authorId = authorId;
      if (startDate) whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(startDate) };
      if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };

      const wikiPages = await prisma.wikiPage.findMany({
        where: whereClause,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          tags: {
            include: { tag: true },
          },
        },
      });

      results.wikiPages = wikiPages.map((page) => ({
        document: {
          id: page.id,
          title: page.title,
          content: page.content,
          slug: page.slug,
          workspaceId: page.workspaceId,
          authorId: page.authorId,
          createdAt: page.createdAt.getTime(),
        },
        highlight: {
          title: { snippet: page.title },
          content: { snippet: page.content?.substring(0, 200) },
        },
      }));

      facets.byType.wikiPages = wikiPages.length;
    }

    // Search users (with workspace role)
    if (type === "all" || type === "user") {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        },
        take: limit,
        include: {
          user: true,
        },
      });

      results.users = workspaceMembers.map((member) => ({
        document: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          createdAt: member.user.createdAt.getTime(),
        },
        highlight: {
          name: { snippet: member.user.name },
          email: { snippet: member.user.email },
        },
      }));

      facets.byType.users = workspaceMembers.length;
    }

    const total =
      facets.byType.messages + facets.byType.wikiPages + facets.byType.files + facets.byType.users;

    return NextResponse.json({
      results,
      facets,
      total,
      query,
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
