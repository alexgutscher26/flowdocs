import db from "@/lib/prisma";

export async function getFavoritePages(workspaceId: string, userId: string) {
  const favorites = await db.wikiPageFavorite.findMany({
    where: {
      workspaceId,
      userId,
    },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          isTemplate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return favorites.map((f) => f.page);
}

export async function toggleFavoritePage(workspaceId: string, userId: string, pageId: string) {
  const existing = await db.wikiPageFavorite.findUnique({
    where: {
      userId_pageId: {
        userId,
        pageId,
      },
    },
  });

  if (existing) {
    await db.wikiPageFavorite.delete({
      where: {
        id: existing.id,
      },
    });
    return { isFavorite: false };
  } else {
    await db.wikiPageFavorite.create({
      data: {
        workspaceId,
        userId,
        pageId,
      },
    });
    return { isFavorite: true };
  }
}

export async function getRecentPages(workspaceId: string, userId: string, limit = 10) {
  const visits = await db.wikiPageVisit.findMany({
    where: {
      workspaceId,
      userId,
    },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          isTemplate: true,
        },
      },
    },
    orderBy: {
      lastVisitedAt: "desc",
    },
    take: limit,
  });

  return visits.map((v) => v.page);
}

export async function logPageVisit(workspaceId: string, userId: string, pageId: string) {
  const now = new Date();

  await db.wikiPageVisit.upsert({
    where: {
      userId_pageId: {
        userId,
        pageId,
      },
    },
    update: {
      lastVisitedAt: now,
    },
    create: {
      workspaceId,
      userId,
      pageId,
      lastVisitedAt: now,
    },
  });
}
