import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NewWikiClient } from "./new-wiki-client";

interface NewWikiPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function NewWikiPage({ params }: NewWikiPageProps) {
  const { workspaceId } = await params;

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
    // Redirect to wiki home if not authorized
    redirect(`/dashboard/wiki/${workspaceId}`);
  }

  return <NewWikiClient workspaceId={workspaceId} />;
}
