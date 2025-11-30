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
    author: {
      id: page.author.id,
      name: page.author.name || undefined,
      email: page.author.email,
      image: page.author.image || undefined,
    },
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
    relatedPages: relatedPages.map((rp) => ({
      id: rp.id,
      title: rp.title,
      slug: rp.slug,
      excerpt: rp.excerpt || undefined,
    })),
    versions: page.versions.map((v) => ({
      id: v.id,
      title: v.title,
      content: v.content,
      excerpt: v.excerpt || undefined,
      version: v.version,
      changeNote: v.changeNote || undefined,
      author: {
        id: v.author.id,
        name: v.author.name || undefined,
        email: v.author.email,
        image: v.author.image || undefined,
      },
      createdAt: v.createdAt,
    })),
    currentVersion: page.versions[0]?.version,
  };
}

/**
 * Renders a wiki page and handles version restoration.
 *
 * This function retrieves the workspace ID and slug from the parameters, checks the user's session,
 * verifies workspace access, and fetches the corresponding wiki page. If the page is found, it
 * provides functionality to restore a previous version of the page. The restoration process includes
 * permission checks, updating the page content, and creating a new version entry. If the page is not
 * found, a "Page Not Found" message is displayed.
 *
 * @param {WikiPageProps} params - The parameters containing workspaceId and slug.
 * @returns {JSX.Element} The rendered wiki page or a "Page Not Found" message.
 */
export default async function WikiPage({ params }: WikiPageProps) {
  const { workspaceId, slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Verify workspace access and get workspace info
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
    },
    include: {
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!workspaceMember) {
    redirect("/dashboard");
  }

  // Check edit permissions (OWNER, ADMIN, MEMBER can edit; VIEWER cannot)
  const canEdit = ["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role);

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

    try {
      // Get the version to restore
      const versionToRestore = await prisma.wikiVersion.findUnique({
        where: { id: versionId },
        include: {
          page: true,
        },
      });

      if (!versionToRestore) {
        throw new Error("Version not found");
      }

      // Verify user has permission to edit this page
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: versionToRestore.page.workspaceId,
          userId: session!.user.id,
        },
      });

      if (!workspaceMember || !["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role)) {
        throw new Error("Unauthorized");
      }

      // Get the current highest version number
      const latestVersion = await prisma.wikiVersion.findFirst({
        where: { pageId: versionToRestore.pageId },
        orderBy: { version: "desc" },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Update the page with the restored content
      await prisma.wikiPage.update({
        where: { id: versionToRestore.pageId },
        data: {
          title: versionToRestore.title,
          content: versionToRestore.content,
          excerpt: versionToRestore.excerpt,
          updatedAt: new Date(),
        },
      });

      // Create a new version entry for the restore
      await prisma.wikiVersion.create({
        data: {
          pageId: versionToRestore.pageId,
          title: versionToRestore.title,
          content: versionToRestore.content,
          excerpt: versionToRestore.excerpt,
          version: newVersionNumber,
          changeNote: `Restored from version ${versionToRestore.version}`,
          authorId: session!.user.id,
        },
      });

      // Revalidate the page
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/dashboard/wiki/${workspaceId}/${slug}`);
    } catch (error) {
      console.error("Error restoring version:", error);
      throw error;
    }
  };

  return (
    <WikiPageView
      page={page}
      workspaceName={workspaceMember.workspace.name}
      workspaceId={workspaceId}
      canEdit={canEdit}
      currentUserId={session.user.id}
      onVersionRestore={handleVersionRestore}
    />
  );
}
