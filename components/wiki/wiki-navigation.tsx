"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { WikiTreeItem } from "./wiki-tree-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Star, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface WikiNavigationProps {
    workspaceId: string;
}

interface WikiPageNode {
    id: string;
    title: string;
    slug: string;
    parentId: string | null;
    children: WikiPageNode[];
    isTemplate?: boolean;
}

interface WikiPageSimple {
    id: string;
    title: string;
    slug: string;
    isTemplate?: boolean;
}

export function WikiNavigation({ workspaceId }: WikiNavigationProps) {
    const pathname = usePathname();

    const {
        data: tree,
        isLoading: isTreeLoading,
        error: treeError,
    } = useQuery<WikiPageNode[]>({
        queryKey: ["wiki-tree", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/tree`);
            if (!res.ok) throw new Error("Failed to fetch wiki tree");
            return res.json();
        },
    });

    const { data: favorites, isLoading: isFavoritesLoading } = useQuery<WikiPageSimple[]>({
        queryKey: ["wiki-favorites", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/favorites`);
            if (!res.ok) throw new Error("Failed to fetch favorites");
            return res.json();
        },
    });

    const { data: recent, isLoading: isRecentLoading } = useQuery<WikiPageSimple[]>({
        queryKey: ["wiki-recent", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/recent`);
            if (!res.ok) throw new Error("Failed to fetch recent pages");
            return res.json();
        },
    });

    if (isTreeLoading) {
        return (
            <div className="space-y-4 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        );
    }

    if (treeError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Failed to load wiki navigation</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-6 p-2">
                {/* Favorites Section */}
                {favorites && favorites.length > 0 && (
                    <div>
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Favorites
                        </h3>
                        <div className="space-y-0.5">
                            {favorites.map((page) => (
                                <Link
                                    key={page.id}
                                    href={`/dashboard/wiki/${workspaceId}/${page.slug}`}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                        pathname === `/dashboard/wiki/${workspaceId}/${page.slug}` &&
                                        "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="truncate">{page.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Section */}
                {recent && recent.length > 0 && (
                    <div>
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Recently Viewed
                        </h3>
                        <div className="space-y-0.5">
                            {recent.map((page) => (
                                <Link
                                    key={page.id}
                                    href={`/dashboard/wiki/${workspaceId}/${page.slug}`}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                        pathname === `/dashboard/wiki/${workspaceId}/${page.slug}` &&
                                        "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{page.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Tree Section */}
                <div>
                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pages
                    </h3>
                    {tree && tree.length > 0 ? (
                        <div>
                            {tree.map((node) => (
                                <WikiTreeItem key={node.id} node={node} workspaceId={workspaceId} />
                            ))}
                        </div>
                    ) : (
                        <div className="px-2 text-sm text-muted-foreground">
                            No pages found.
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}
