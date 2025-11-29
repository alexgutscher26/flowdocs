import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WikiHomeProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

async function getWikiPages(workspaceId: string) {
  const pages = await prisma.wikiPage.findMany({
    where: {
      workspaceId,
      published: true,
    },
    include: {
      author: {
        select: {
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
      _count: {
        select: {
          versions: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });

  return pages;
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

  const pages = await getWikiPages(workspaceId);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wiki</h1>
          <p className="text-muted-foreground mt-1">Knowledge base and documentation</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/wiki/${workspaceId}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="pb-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <BookOpen className="text-primary h-12 w-12" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">No Wiki Pages Yet</h2>
            <p className="text-muted-foreground mt-2 text-base">
              Start building your team's knowledge base by creating your first wiki page.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground mb-3 text-sm font-medium">
                Ways to create pages:
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Create a new page from scratch with the button below</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Convert important chat threads to documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Organize pages with tags and nested structures</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link href={`/dashboard/wiki/${workspaceId}/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Page
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link key={page.id} href={`/dashboard/wiki/${workspaceId}/${page.slug}`}>
              <Card className="hover:bg-muted/50 h-full cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{page.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {page.excerpt || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {page.tags.slice(0, 3).map((pt) => (
                      <Badge key={pt.id} variant="secondary">
                        {pt.tag.name}
                      </Badge>
                    ))}
                    {page.tags.length > 3 && (
                      <Badge variant="outline">+{page.tags.length - 3}</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>By {page.author.name || page.author.email}</span>
                    <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
