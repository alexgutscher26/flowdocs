import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { SearchResultsPage } from "@/components/search/search-results-page";

export default async function SearchPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/signin");
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

  return <SearchResultsPage workspaceId={workspaceId} />;
}
