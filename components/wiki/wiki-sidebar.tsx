"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { WikiTreeItem } from "./wiki-tree-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WikiSidebarProps {
    workspaceId: string;
}

interface WikiPageNode {
    id: string;
    title: string;
    slug: string;
    parentId: string | null;
    children: WikiPageNode[];
}

export function WikiSidebar({ workspaceId }: WikiSidebarProps) {
    const { data: tree, isLoading, error } = useQuery<WikiPageNode[]>({
        queryKey: ["wiki-tree", workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/wiki/${workspaceId}/tree`);
            if (!res.ok) {
                throw new Error("Failed to fetch wiki tree");
            }
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Failed to load wiki navigation</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!tree || tree.length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No pages found. Create one to get started.
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-2">
                {tree.map((node) => (
                    <WikiTreeItem key={node.id} node={node} workspaceId={workspaceId} />
                ))}
            </div>
        </ScrollArea>
    );
}
