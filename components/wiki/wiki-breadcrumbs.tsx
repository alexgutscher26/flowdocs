"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface WikiBreadcrumbsProps {
  workspaceId: string;
  currentPageId?: string;
  currentPageTitle?: string;
  currentPageSlug?: string;
}

interface WikiPageNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  children: WikiPageNode[];
}

export function WikiBreadcrumbs({
  workspaceId,
  currentPageId,
  currentPageTitle,
  currentPageSlug,
}: WikiBreadcrumbsProps) {
  // We fetch the tree to calculate breadcrumbs
  // In a real app with many pages, we might want a dedicated API for this
  // or return parent info in the page details API
  const { data: tree } = useQuery<WikiPageNode[]>({
    queryKey: ["wiki-tree", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/wiki/${workspaceId}/tree`);
      if (!res.ok) {
        throw new Error("Failed to fetch wiki tree");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper to find path to node
  const findPath = (
    nodes: WikiPageNode[],
    targetId: string,
    path: WikiPageNode[] = []
  ): WikiPageNode[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return [...path, node];
      }
      if (node.children.length > 0) {
        const found = findPath(node.children, targetId, [...path, node]);
        if (found) return found;
      }
    }
    return null;
  };

  const breadcrumbs = tree && currentPageId ? findPath(tree, currentPageId) : [];

  // If we have the current page details but tree isn't loaded or page not found in tree yet
  // we can at least show the current page
  const displayBreadcrumbs =
    breadcrumbs ||
    (currentPageTitle
      ? [
          {
            id: currentPageId!,
            title: currentPageTitle,
            slug: currentPageSlug!,
            parentId: null,
            children: [],
          },
        ]
      : []);

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link
        href={`/dashboard/wiki/${workspaceId}`}
        className="flex items-center hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>

      {displayBreadcrumbs.length > 0 && (
        <>
          <ChevronRight className="mx-2 h-4 w-4" />
          {displayBreadcrumbs.map((item, index) => {
            const isLast = index === displayBreadcrumbs.length - 1;
            return (
              <div key={item.id} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-4 w-4" />}
                {isLast ? (
                  <span className="font-medium text-foreground">{item.title}</span>
                ) : (
                  <Link
                    href={`/dashboard/wiki/${workspaceId}/${item.slug}`}
                    className="hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            );
          })}
        </>
      )}
    </nav>
  );
}
