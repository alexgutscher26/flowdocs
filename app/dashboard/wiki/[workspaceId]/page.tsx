import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="container max-w-7xl py-8">
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
        <Card>
          <CardHeader>
            <CardTitle>No Wiki Pages Yet</CardTitle>
            <CardDescription>
              Create your first wiki page or convert a chat thread to documentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/dashboard/wiki/${workspaceId}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Page
              </Link>
            </Button>
          </CardContent>
        </Card>
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
