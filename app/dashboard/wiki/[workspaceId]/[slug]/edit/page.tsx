import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EditWikiClient } from "./edit-wiki-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditWikiPageProps {
  params: Promise<{
    workspaceId: string;
    slug: string;
  }>;
}

export default async function EditWikiPage({ params }: EditWikiPageProps) {
  const { workspaceId, slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Verify workspace access and permissions
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
    },
  });

  if (!workspaceMember || !["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role)) {
    // Redirect to view page if not authorized
    redirect(`/dashboard/wiki/${workspaceId}/${slug}`);
  }

  // Fetch page
  const page = await prisma.wikiPage.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId,
        slug,
      },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!page) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <Button asChild>
          <Link href={`/dashboard/wiki/${workspaceId}`}>Back to Wiki</Link>
        </Button>
      </div>
    );
  }

  return <EditWikiClient workspaceId={workspaceId} slug={slug} page={page} />;
}
