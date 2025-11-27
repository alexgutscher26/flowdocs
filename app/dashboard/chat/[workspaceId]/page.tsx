import { ChatLayout } from "@/components/chat";
import { getCurrentUser } from "@/app/actions/user";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

interface ChatPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await getCurrentUser();
  const { workspaceId } = await params;

  if (!user) {
    redirect("/sign-in");
  }

  // Resolve workspace ID from slug or ID
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [{ id: workspaceId }, { slug: workspaceId }],
    },
    select: {
      id: true,
    },
  });

  if (!workspace) {
    // Handle case where workspace is not found
    // For now, redirect to dashboard or show error
    // If "default" was passed and no workspace found, maybe redirect to create workspace?
    if (workspaceId === "default") {
      return (
        <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No Workspace Found</h3>
            <p className="text-muted-foreground">Please create a workspace to start chatting.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Workspace Not Found</h3>
          <p className="text-muted-foreground">The workspace you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-var(--header-height))]">
      <ChatLayout
        workspaceId={workspace.id}
        userId={user.id}
        userName={user.name || user.email}
        className="h-full"
      />
    </div>
  );
}
