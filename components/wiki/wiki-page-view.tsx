"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug"; // Plugin for heading IDs
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  History,
  Printer,
  Download,
  MessageSquare,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Share2,
  Calendar,
  Hash,
  BookOpen,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VersionHistoryDialog, WikiVersion } from "./version-history";
import "highlight.js/styles/github-dark.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WikiBreadcrumbs } from "./wiki-breadcrumbs";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export interface WikiPageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // Author info
  author: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };

  // Relations
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
  }>;

  // Source thread if converted from chat
  sourceMessage?: {
    id: string;
    channelId: string;
    channelName: string;
    messageCount: number;
  };

  // Related pages
  relatedPages?: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
  }>;

  // Version history
  versions?: WikiVersion[];
  currentVersion?: number;
}

interface WikiPageViewProps {
  page: WikiPageData;
  workspaceName?: string;
  workspaceId?: string;
  canEdit?: boolean;
  currentUserId?: string;
  onEdit?: () => void;
  onVersionRestore?: (versionId: string) => void;
  className?: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Generate a consistent gradient based on string
function generateGradient(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  return `linear-gradient(135deg, hsl(${hue1}, 70%, 85%) 0%, hsl(${hue2}, 70%, 95%) 100%)`;
}

export function WikiPageView({
  page,
  workspaceName,
  workspaceId,
  canEdit = false,
  currentUserId,
  onEdit,
  onVersionRestore,
  className,
}: WikiPageViewProps) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Check if user can delete (author, admin, or owner)
  const canDelete = canEdit && currentUserId && workspaceId;

  // Load checkbox states from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`wiki-checkboxes-${page.id}`);
    if (saved) {
      try {
        setCheckboxStates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load checkbox states", e);
      }
    }
  }, [page.id]);

  // Save checkbox states to localStorage when they change
  useEffect(() => {
    if (Object.keys(checkboxStates).length > 0) {
      localStorage.setItem(`wiki-checkboxes-${page.id}`, JSON.stringify(checkboxStates));
    }
  }, [checkboxStates, page.id]);

  const handleCheckboxChange = (index: string) => {
    setCheckboxStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDelete = async () => {
    if (!workspaceId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wiki/${workspaceId}/${page.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete page");
      }

      toast({
        title: "Success",
        description: "Wiki page deleted successfully",
      });

      // Navigate to wiki home
      router.push(`/dashboard/wiki/${workspaceId}`);
    } catch (error) {
      console.error("Error deleting wiki page:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete wiki page",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const coverGradient = useMemo(() => generateGradient(page.id), [page.id]);

  // Generate table of contents from markdown headings
  const tableOfContents = useMemo(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(page.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, "-");

      toc.push({ id, text, level });
    }

    return toc;
  }, [page.content]);

  // Scroll spy for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    // Observe all headings
    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  // Transform markdown to add IDs to headings
  // const contentWithIds = useMemo(() => {
  //   return page.content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
  //     const id = text.toLowerCase().replace(/[^\w]+/g, "-");
  //     return `<h${hashes.length} id="${id}">${text}</h${hashes.length}>`;
  //   });
  // }, [page.content]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const blob = new Blob([page.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("relative min-h-screen p-6 pb-20", className)}>
      {/* Cover Banner */}
      <div
        className="absolute top-0 right-0 left-0 -z-10 h-48 w-full opacity-30 dark:opacity-10"
        style={{ background: coverGradient }}
      />

      <div className="flex gap-12 pt-12">
        {/* Main Content */}
        <div className="max-w-4xl min-w-0 flex-1">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <WikiBreadcrumbs
              workspaceId={workspaceId || ""}
              currentPageId={page.id}
              currentPageTitle={page.title}
              currentPageSlug={page.slug}
            />
          </div>

          {/* Header */}
          <div className="group mb-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h1 className="text-foreground text-4xl font-bold tracking-tight">{page.title}</h1>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {canEdit && (onEdit || workspaceId) && (
                  <Button
                    onClick={onEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    asChild={!onEdit && !!workspaceId}
                  >
                    {onEdit ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </>
                    ) : (
                      <a href={`/dashboard/wiki/${workspaceId}/${page.slug}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </a>
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {page.versions && page.versions.length > 0 && (
                      <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                        <History className="mr-2 h-4 w-4" />
                        Version History
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Markdown
                    </DropdownMenuItem>
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Page
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Metadata Row */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-6 border-b pb-6 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={page.author.image} />
                  <AvatarFallback>{page.author.name?.[0] || page.author.email[0]}</AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">
                  {page.author.name || page.author.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{page.viewCount} views</span>
              </div>

              {/* Tags as Pills */}
              {page.tags.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  {page.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="bg-muted hover:bg-muted/80 font-normal"
                    >
                      <Hash className="mr-1 h-3 w-3 opacity-50" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Backlink to Chat Thread - Redesigned */}
          {page.sourceMessage && (
            <div className="group from-muted/50 to-muted/10 hover:border-primary/20 relative mb-8 overflow-hidden rounded-lg border bg-gradient-to-br p-4 transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground mb-1 font-semibold">Source Conversation</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    This page was compiled from a discussion in{" "}
                    <span className="text-foreground font-medium">
                      #{page.sourceMessage.channelName}
                    </span>{" "}
                    containing {page.sourceMessage.messageCount} messages.
                  </p>
                  <Button variant="link" size="sm" className="text-primary h-auto p-0" asChild>
                    <a
                      href={`/dashboard/chat/${page.sourceMessage.channelId}?messageId=${page.sourceMessage.id}`}
                    >
                      View original thread
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Markdown Content - Enhanced Typography */}
          <div className="prose prose-slate dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:text-muted-foreground/90 prose-li:text-muted-foreground/90 prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-img:rounded-lg prose-img:border prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug, rehypeHighlight]}
              components={{
                h1: ({ node, ...props }) => <h1 {...props} className="scroll-mt-24" />,
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="mt-12 mb-6 scroll-mt-24 border-b pb-2" />
                ),
                h3: ({ node, ...props }) => <h3 {...props} className="mt-8 mb-4 scroll-mt-24" />,
                h4: ({ node, ...props }) => <h4 {...props} className="scroll-mt-24" />,
                h5: ({ node, ...props }) => <h5 {...props} className="scroll-mt-24" />,
                h6: ({ node, ...props }) => <h6 {...props} className="scroll-mt-24" />,
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-primary font-medium hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                input: ({ node, ...props }) => {
                  if (props.type === "checkbox") {
                    // Use line number as stable ID
                    const index = `checkbox-${node?.position?.start.line || Math.random()}`;
                    const isChecked = checkboxStates[index] ?? (props.checked || false);
                    return (
                      <input
                        {...props}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(index)}
                        className="mr-2 h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                      />
                    );
                  }
                  return <input {...props} />;
                },
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Sidebar - Enhanced */}
        <aside className="hidden w-64 xl:block">
          <div className="sticky top-24 space-y-8">
            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div>
                <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  On This Page
                </h3>
                <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                  <nav className="space-y-1 border-l pl-4">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "-ml-[17px] block border-l-2 py-1.5 pl-4 text-sm transition-all",
                          activeSection === item.id
                            ? "border-primary text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 border-transparent",
                          item.level === 3 && "pl-8",
                          item.level > 3 && "pl-12"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(item.id)?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            )}

            {/* Related Pages */}
            {page.relatedPages && page.relatedPages.length > 0 && (
              <div>
                <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="h-4 w-4" />
                  Related Pages
                </h3>
                <div className="space-y-3">
                  {page.relatedPages.map((relatedPage) => (
                    <a
                      key={relatedPage.id}
                      href={`/dashboard/wiki/${page.id.split("-")[0]}/${relatedPage.slug}`} // Assuming workspaceId is part of URL structure, might need adjustment
                      className="group bg-card hover:bg-accent/50 block rounded-lg border p-3 transition-all hover:shadow-sm"
                    >
                      <p className="group-hover:text-primary text-sm font-medium transition-colors">
                        {relatedPage.title}
                      </p>
                      {relatedPage.excerpt && (
                        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
                          {relatedPage.excerpt}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Version History Dialog */}
        {page.versions && (
          <VersionHistoryDialog
            open={showVersionHistory}
            onOpenChange={setShowVersionHistory}
            versions={page.versions}
            currentVersion={page.currentVersion}
            onRestore={onVersionRestore}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wiki Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{page.title}"? This action cannot be undone. All
                versions and associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
