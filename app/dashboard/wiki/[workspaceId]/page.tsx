import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WikiDashboard } from "@/components/wiki/wiki-dashboard";

interface WikiHomeProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function WikiHomePage({ params }: WikiHomeProps) {
  const { workspaceId } = await params;

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

  return <WikiDashboard workspaceId={workspaceId} />;
}
