"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

export interface WikiEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialIsTemplate?: boolean;
  onSave?: (data: {
    title: string;
    content: string;
    tags: string[];
    published: boolean;
    isTemplate: boolean;
  }) => void;
  onCancel?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  className?: string;
}

/**
 * A component for editing and managing wiki content with auto-save functionality.
 *
 * The WikiEditor allows users to input a title, content, and tags, while providing a toolbar for markdown formatting.
 * It supports auto-saving drafts at specified intervals and handles saving and publishing content through the provided onSave callback.
 * The component also manages tag addition and removal, and provides a preview of the content in markdown format.
 *
 * @param {Object} props - The properties for the WikiEditor component.
 * @param {string} [props.initialTitle=""] - The initial title of the wiki page.
 * @param {string} [props.initialContent=""] - The initial content of the wiki page.
 * @param {string[]} [props.initialTags=[]] - The initial tags associated with the wiki page.
 * @param {function} props.onSave - The callback function to save the wiki content.
 * @param {function} props.onCancel - The callback function to handle cancellation.
 * @param {boolean} [props.autoSave=true] - Flag to enable or disable auto-saving.
 * @param {number} [props.autoSaveInterval=30000] - The interval for auto-saving in milliseconds.
 * @param {string} [props.className] - Additional class names for styling the component.
 * @returns {JSX.Element} The rendered WikiEditor component.
 */
export function WikiEditor({
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  initialIsTemplate = false,
  onSave,
  onCancel,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  className,
}: WikiEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isTemplate, setIsTemplate] = useState(initialIsTemplate);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true, false); // Auto-save as draft
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, tags, isTemplate, autoSave, autoSaveInterval]);

  const handleSave = useCallback(
    async (isAutoSave = false, published = false) => {
      if (!onSave) return;

      if (!title.trim()) {
        if (!isAutoSave) {
          // Show error or shake input? For now just return
          return;
        }
        return;
      }

      setIsSaving(true);
      try {
        await onSave({ title, content, tags, published, isTemplate });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error saving:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [title, content, tags, isTemplate, onSave]
  );

  // Insert markdown formatting at cursor position
  const insertMarkdown = useCallback(
    (before: string, after = "", defaultText = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const text = selectedText || defaultText;

      const newContent =
        content.substring(0, start) + before + text + after + content.substring(end);

      setContent(newContent);

      // Set cursor position after insertion
      setTimeout(() => {
        const newCursorPos = start + before.length + text.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content]
  );

  // Toolbar actions
  const toolbarActions = [
    {
      label: "H1",
      icon: Heading1,
      action: () => insertMarkdown("# ", "", "Heading 1"),
    },
    {
      label: "H2",
      icon: Heading2,
      action: () => insertMarkdown("## ", "", "Heading 2"),
    },
    {
      label: "H3",
      icon: Heading3,
      action: () => insertMarkdown("### ", "", "Heading 3"),
    },
    {
      label: "Bold",
      icon: Bold,
      action: () => insertMarkdown("**", "**", "bold text"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => insertMarkdown("*", "*", "italic text"),
    },
    {
      label: "Code",
      icon: Code,
      action: () => insertMarkdown("`", "`", "code"),
    },
    {
      label: "Link",
      icon: Link,
      action: () => insertMarkdown("[", "](https://example.com)", "link text"),
    },
    {
      label: "Image",
      icon: Image,
      action: () => insertMarkdown("![", "](https://example.com/image.png)", "alt text"),
    },
    {
      label: "Bullet List",
      icon: List,
      action: () => insertMarkdown("- ", "", "list item"),
    },
    {
      label: "Numbered List",
      icon: ListOrdered,
      action: () => insertMarkdown("1. ", "", "list item"),
    },
    {
      label: "Quote",
      icon: Quote,
      action: () => insertMarkdown("> ", "", "quote"),
    },
  ];

  // Tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter wiki page title..."
          className="text-2xl font-bold"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-1 rounded-lg p-2">
        {toolbarActions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            onClick={action.action}
            title={action.label}
            className="h-8 w-8 p-0"
          >
            <action.icon className="h-4 w-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex-1" />

        {/* Auto-save indicator */}
        {lastSaved && (
          <span className="text-muted-foreground text-xs">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}

        {isSaving && <span className="text-muted-foreground text-xs">Saving...</span>}
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content in markdown..."
            className="min-h-[500px] font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="bg-background prose prose-slate dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:text-muted-foreground/90 prose-li:text-muted-foreground/90 prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-img:rounded-lg prose-img:border prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic min-h-[500px] max-w-none rounded-lg border p-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
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
              }}
            >
              {content || "*No content yet. Start writing in the Edit tab.*"}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tags Management */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            className="flex-1"
          />
          <Button onClick={addTag} variant="outline">
            Add Tag
          </Button>
        </div>
      </div>

      {/* Template Option */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isTemplate"
          checked={isTemplate}
          onChange={(e) => setIsTemplate(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="isTemplate">Save as Template</Label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false, false)}
            disabled={isSaving || !title.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(false, true)} disabled={isSaving || !title.trim()}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
