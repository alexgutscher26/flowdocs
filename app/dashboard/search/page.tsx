import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { SearchResultsPage } from '@/components/search/search-results-page';

export default async function SearchPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Get user's first workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: true,
    },
  });

  if (!workspaceMember) {
    redirect('/dashboard');
  }

  return <SearchResultsPage workspaceId={workspaceMember.workspaceId} />;
}
