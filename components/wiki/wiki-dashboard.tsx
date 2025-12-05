"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Star, FileText } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface WikiDashboardProps {
    workspaceId: string;
}

/**
 * Render the Wiki Dashboard component displaying recent and favorite pages.
 *
 * This component fetches recent and favorite wiki pages for a given workspaceId using the useQuery hook.
 * It handles loading states and displays the fetched data in a structured layout.
 * If the fetch fails, it throws an error indicating the failure reason.
 *
 * @param {WikiDashboardProps} props - The properties for the WikiDashboard component, including workspaceId.
 */
export function WikiDashboard({ workspaceId }: WikiDashboardProps) {
    const { data: recent, isLoading: isRecentLoading } = useQuery<any[]>({
        queryKey: ["wiki-recent", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/recent?limit=5`);
            if (!res.ok) throw new Error("Failed to fetch recent pages");
            return res.json();
        },
    });

    const { data: favorites, isLoading: isFavoritesLoading } = useQuery<any[]>({
        queryKey: ["wiki-favorites", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/favorites`);
            if (!res.ok) throw new Error("Failed to fetch favorites");
            return res.json();
        },
    });

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Wiki</h1>
                    <p className="text-muted-foreground mt-1">
                        Knowledge base and documentation for your team
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/dashboard/wiki/${workspaceId}/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Page
                    </Link>
                </Button>
            </div>



            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Pages */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Recently Viewed
                        </CardTitle>
                        <CardDescription>Pages you visited recently</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isRecentLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : recent && recent.length > 0 ? (
                            <div className="space-y-2">
                                {recent.map((page) => (
                                    <Link
                                        key={page.id}
                                        href={`/dashboard/wiki/${workspaceId}/${page.slug}`}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                            <span className="font-medium truncate">{page.title}</span>
                                        </div>
                                        {/* <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(page.lastVisitedAt), { addSuffix: true })}
                    </span> */}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center">
                                No recently viewed pages
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Favorites */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Favorites
                        </CardTitle>
                        <CardDescription>Pages you have starred</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isFavoritesLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : favorites && favorites.length > 0 ? (
                            <div className="space-y-2">
                                {favorites.map((page) => (
                                    <Link
                                        key={page.id}
                                        href={`/dashboard/wiki/${workspaceId}/${page.slug}`}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium truncate">{page.title}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center">
                                No favorite pages yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
