"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WikiPageNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  children: WikiPageNode[];
  _count?: {
    children: number;
  };
}

interface WikiTreeItemProps {
  node: WikiPageNode;
  workspaceId: string;
  level?: number;
}

export function WikiTreeItem({ node, workspaceId, level = 0 }: WikiTreeItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/dashboard/wiki/${workspaceId}/${node.slug}`;
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Auto-expand if active page is a child (this would require checking children recursively)
  // For now, we'll just expand if the current node is active or if we've manually opened it

  // Simple persistence for folder state
  React.useEffect(() => {
    const savedState = localStorage.getItem(`wiki-folder-${node.id}`);
    if (savedState) {
      setIsOpen(savedState === "true");
    }
  }, [node.id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem(`wiki-folder-${node.id}`, String(newState));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild onClick={handleToggle}>
            <button className="h-4 w-4 shrink-0 hover:text-foreground/80">
              <ChevronRight
                className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")}
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="w-4" />
        )}

        <Link
          href={`/dashboard/wiki/${workspaceId}/${node.slug}`}
          className="flex flex-1 items-center gap-2 truncate"
        >
          {hasChildren ? (
            isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.title}</span>
        </Link>
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="mt-1">
            {node.children.map((child) => (
              <WikiTreeItem
                key={child.id}
                node={child}
                workspaceId={workspaceId}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
