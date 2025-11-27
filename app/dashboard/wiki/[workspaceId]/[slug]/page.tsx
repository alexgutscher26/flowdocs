import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WikiPageView } from "@/components/wiki";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface WikiPageProps {
  params: Promise<{
    workspaceId: string;
    slug: string;
  }>;
}

async function getWikiPage(workspaceId: string, slug: string, userId: string) {
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
    },
  });

  if (!page) {
    return null;
  }

  // Get related pages
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

  // Increment view count
  await prisma.wikiPage.update({
    where: { id: page.id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  // Format for component
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    excerpt: page.excerpt || undefined,
    published: page.published,
    viewCount: page.viewCount,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt || undefined,
    author: page.author,
    tags: page.tags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
      color: pt.tag.color || undefined,
    })),
    sourceMessage: page.message
      ? {
          id: page.message.id,
          channelId: page.message.channelId,
          channelName: page.message.channel.name,
          messageCount: page.message._count.replies + 1,
        }
      : undefined,
    relatedPages,
    versions: page.versions.map((v) => ({
      id: v.id,
      title: v.title,
      content: v.content,
      excerpt: v.excerpt || undefined,
      version: v.version,
      changeNote: v.changeNote || undefined,
      author: v.author,
      createdAt: v.createdAt,
    })),
    currentVersion: page.versions[0]?.version,
  };
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { workspaceId, slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Verify workspace access
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
    },
  });

  if (!workspaceMember) {
    redirect("/dashboard");
  }

  const page = await getWikiPage(workspaceId, slug, session.user.id);

  if (!page) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">
          This wiki page doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href={`/dashboard/wiki/${workspaceId}`}>Back to Wiki</Link>
        </Button>
      </div>
    );
  }

  const handleVersionRestore = async (versionId: string) => {
    "use server";
    // This would restore a version - implement as needed
    console.log("Restore version:", versionId);
  };

  return (
    <div className="container max-w-7xl py-8">
      <WikiPageView
        page={page}
        currentUserId={session.user.id}
        onVersionRestore={handleVersionRestore}
      />
    </div>
  );
}
