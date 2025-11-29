"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Check, X, AlertCircle } from "lucide-react";
import { ExtendedMessage } from "@/types/chat";
import { convertThreadToWiki, WikiConversionResult } from "@/lib/wiki-converter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ConvertToWikiButtonProps {
  messages: ExtendedMessage[];
  threadTitle?: string;
  channelId: string;
  channelName: string;
  workspaceId: string;
  currentUserId: string;
  threadStarterId?: string;
  isAdmin?: boolean;
  onConversionComplete?: (wikiPageId: string, wikiPageSlug: string) => void;
  className?: string;
}

type ConversionStep = "initial" | "preview" | "edit" | "converting" | "success" | "error";

/**
 * Convert a thread into a wiki page with customizable content and metadata.
 *
 * This function manages the conversion process through various steps, including opening a dialog for previewing the generated wiki content, allowing edits, and handling the conversion to a wiki page via an API call. It also manages state for the conversion process, including error handling and user notifications. The function ensures that only authorized users can initiate the conversion.
 *
 * @param messages - An array of messages from the thread to be converted.
 * @param threadTitle - The title of the thread being converted.
 * @param channelId - The ID of the channel where the thread resides.
 * @param channelName - The name of the channel where the thread resides.
 * @param workspaceId - The ID of the workspace containing the channel.
 * @param currentUserId - The ID of the current user attempting the conversion.
 * @param threadStarterId - The ID of the user who started the thread.
 * @param isAdmin - A boolean indicating if the current user has admin privileges (default is false).
 * @param onConversionComplete - A callback function to be executed upon successful conversion.
 * @param className - An optional class name for styling the button.
 */
export function ConvertToWikiButton({
  messages,
  threadTitle,
  channelId,
  channelName,
  workspaceId,
  currentUserId,
  threadStarterId,
  isAdmin = false,
  onConversionComplete,
  className,
}: ConvertToWikiButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ConversionStep>("initial");
  const [conversionResult, setConversionResult] = useState<WikiConversionResult | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedExcerpt, setEditedExcerpt] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [wikiPageUrl, setWikiPageUrl] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Check if user has permission to convert
  const canConvert = isAdmin || currentUserId === threadStarterId;

  if (!canConvert) {
    return null;
  }

  const handleOpenDialog = async () => {
    setOpen(true);
    setStep("preview");
    setError("");

    try {
      // Generate wiki preview
      const result = await convertThreadToWiki(messages, threadTitle);
      setConversionResult(result);
      setEditedTitle(result.title);
      setEditedContent(result.content);
      setEditedExcerpt(result.excerpt);
      setEditedTags(result.tags);
    } catch (err) {
      setError("Failed to generate wiki preview. Please try again.");
      setStep("error");
    }
  };

  const handleEditMode = () => {
    setStep("edit");
  };

  /**
   * Handles the conversion of a thread into a wiki page.
   *
   * This function sets the conversion step, clears any previous errors, and attempts to create a wiki page by calling an API.
   * If successful, it updates the original thread with the wiki link and triggers a callback if provided.
   * In case of an error, it sets an error message and updates the step to indicate failure.
   *
   * @param {string} editedTitle - The title of the wiki page to be created.
   * @param {string} editedContent - The content of the wiki page to be created.
   * @param {string} editedExcerpt - The excerpt for the wiki page.
   * @param {Array<string>} editedTags - The tags associated with the wiki page.
   * @param {Array<Object>} messages - The messages from the original thread.
   * @param {string} channelId - The ID of the channel where the original thread exists.
   * @param {string} workspaceId - The ID of the workspace.
   * @param {Object} conversionResult - The result of the conversion process.
   * @param {Function} onConversionComplete - A callback function to be called upon successful conversion.
   * @returns {Promise<void>} A promise that resolves when the conversion process is complete.
   * @throws Error If the API call fails or if the response is not ok.
   */
  const handleConvert = async () => {
    setStep("converting");
    setError("");

    try {
      // Call API to create wiki page
      const response = await fetch("/api/wiki/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          excerpt: editedExcerpt,
          tags: editedTags,
          sourceMessageId: messages[0]?.id,
          channelId,
          workspaceId,
          metadata: conversionResult?.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create wiki page");
      }

      const data = await response.json();
      setWikiPageUrl(`/dashboard/wiki/${workspaceId}/${data.slug}`);
      setStep("success");

      // Update the original thread with wiki link
      await fetch(
        `/api/chat/${workspaceId}/channels/${channelId}/messages/${messages[0]?.id}/link-wiki`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wikiPageId: data.id }),
        }
      );

      toast({
        title: "Wiki page created!",
        description: "The thread has been successfully converted to a wiki page.",
      });

      if (onConversionComplete) {
        onConversionComplete(data.id, data.slug);
      }
    } catch (err) {
      setError("Failed to create wiki page. Please try again.");
      setStep("error");

      toast({
        title: "Conversion failed",
        description: "There was an error creating the wiki page.",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("initial");
      setConversionResult(null);
      setError("");
    }, 200);
  };

  return (
    <>
      <Button onClick={handleOpenDialog} variant="outline" size="sm" className={className}>
        <FileText className="mr-2 h-4 w-4" />
        Convert to Wiki
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          {/* Preview Step */}
          {step === "preview" && conversionResult && (
            <>
              <DialogHeader>
                <DialogTitle>Preview Wiki Page</DialogTitle>
                <DialogDescription>
                  Review the auto-generated wiki page from this thread
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  {/* Metadata Summary */}
                  <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                    <h4 className="font-semibold">Thread Analysis</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Messages:</span>{" "}
                        {conversionResult.metadata.messageCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participants:</span>{" "}
                        {conversionResult.metadata.participantCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Has Code:</span>{" "}
                        {conversionResult.metadata.hasCode ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Has Links:</span>{" "}
                        {conversionResult.metadata.hasLinks ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="mb-2 text-2xl font-bold">{conversionResult.title}</h3>
                    <p className="text-muted-foreground text-sm">{conversionResult.excerpt}</p>
                  </div>

                  {/* Tags */}
                  {conversionResult.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {conversionResult.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Content Preview */}
                  <Tabs defaultValue="preview">
                    <TabsList>
                      <TabsTrigger value="preview">Rendered</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {conversionResult.content}
                        </ReactMarkdown>
                      </div>
                    </TabsContent>

                    <TabsContent value="markdown" className="mt-4">
                      <pre className="bg-muted overflow-auto rounded-lg p-4 text-xs">
                        {conversionResult.content}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleEditMode}>
                  Edit Before Converting
                </Button>
                <Button onClick={handleConvert}>Convert to Wiki Page</Button>
              </DialogFooter>
            </>
          )}

          {/* Edit Step */}
          {step === "edit" && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Wiki Page</DialogTitle>
                <DialogDescription>Customize the content before converting</DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-lg font-semibold"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Summary/Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={editedExcerpt}
                      onChange={(e) => setEditedExcerpt(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {editedTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add a tag..."
                      />
                      <Button onClick={addTag} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Content (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Back to Preview
                </Button>
                <Button onClick={handleConvert}>Convert to Wiki Page</Button>
              </DialogFooter>
            </>
          )}

          {/* Converting Step */}
          {step === "converting" && (
            <>
              <DialogHeader>
                <DialogTitle>Converting to Wiki Page</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="text-primary mb-4 h-12 w-12 animate-spin" />
                <p className="text-muted-foreground">Creating your wiki page...</p>
              </div>
            </>
          )}

          {/* Success Step */}
          {step === "success" && (
            <>
              <DialogHeader>
                <DialogTitle>Wiki Page Created!</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="mb-6 text-center">
                  Your thread has been successfully converted to a wiki page!
                </p>
                <Button asChild>
                  <a href={wikiPageUrl} target="_blank" rel="noopener noreferrer">
                    View Wiki Page
                  </a>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Error Step */}
          {step === "error" && (
            <>
              <DialogHeader>
                <DialogTitle>Conversion Failed</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="mb-2 text-center font-medium">Something went wrong</p>
                <p className="text-muted-foreground mb-6 text-center text-sm">{error}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleOpenDialog}>Try Again</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
