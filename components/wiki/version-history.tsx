"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, User, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface WikiVersion {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  version: number;
  changeNote?: string;
  author: {
    name?: string;
    email: string;
    image?: string;
  };
  createdAt: Date;
}

interface VersionHistoryProps {
  versions: WikiVersion[];
  currentVersion?: number;
  onRestore?: (versionId: string) => void;
  onClose?: () => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<WikiVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const handleRestore = (versionId: string) => {
    if (onRestore && confirm("Are you sure you want to restore this version?")) {
      onRestore(versionId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version History</h3>
        {selectedVersion && (
          <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? "View Single" : "Compare"}
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Version List */}
        <ScrollArea className="w-64 rounded-lg border">
          <div className="space-y-2 p-2">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedVersion?.id === version.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                } ${version.version === currentVersion ? "ring-primary ring-2" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">Version {version.version}</span>
                  {version.version === currentVersion && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>

                <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {new Date(version.createdAt).toLocaleString()}
                </div>

                <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                  <User className="h-3 w-3" />
                  {version.author.name || version.author.email}
                </div>

                {version.changeNote && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">{version.changeNote}</p>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Version Content */}
        <div className="flex-1 overflow-hidden rounded-lg border p-4">
          {selectedVersion ? (
            <div className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold">{selectedVersion.title}</h4>
                  <p className="text-muted-foreground text-sm">
                    Version {selectedVersion.version} •{" "}
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedVersion.version !== currentVersion && onRestore && (
                  <Button size="sm" onClick={() => handleRestore(selectedVersion.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedVersion.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p>Select a version to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Version History Dialog Wrapper
 */
interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: WikiVersion[];
  currentVersion?: number;
  onRestore?: (versionId: string) => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  currentVersion,
  onRestore,
}: VersionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] max-w-6xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this wiki page
          </DialogDescription>
        </DialogHeader>
        <VersionHistory
          versions={versions}
          currentVersion={currentVersion}
          onRestore={onRestore}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
