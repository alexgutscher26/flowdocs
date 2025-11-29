import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import prisma from "@/lib/prisma";

export default async function WikiRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user's default workspace
  const defaultWorkspace = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      workspace: true,
    },
    orderBy: {
      joinedAt: "asc", // Use the first workspace they joined
    },
  });

  if (defaultWorkspace) {
    redirect(`/dashboard/wiki/${defaultWorkspace.workspaceId}`);
  }

  // If no workspace found, redirect to dashboard
  redirect("/dashboard");
}
