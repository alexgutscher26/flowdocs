"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Paperclip,
  X,
  Loader2,
  Bold,
  Italic,
  Code,
  Eye,
  Edit2,
  HardDrive,
} from "lucide-react";
import { GoogleDrivePicker } from "@/components/integrations/google-drive-picker";
import { GoogleDriveFile } from "@/lib/integrations/google-drive";
import { useFileUpload } from "@/hooks/use-file-upload";
import { formatFileSize, getFileTypeIcon } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { EmojiPicker } from "./emoji-picker";
import { getMentionSuggestions, MentionSuggestion } from "@/lib/mentions";
import { MentionList } from "./mention-list";
import { RichTextRenderer } from "./rich-text-renderer";

interface ChannelMember {
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface MessageInputProps {
  onSend: (content: string, attachments?: any[]) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  threadId?: string | null;
  channelMembers?: ChannelMember[];
  workspaceId?: string;
}

/**
 * Renders a message input component with file upload and mention support.
 *
 * This component manages the state for message content, file selections, and mentions. It handles user interactions such as typing, file uploads, and sending messages. The component also fetches wiki pages for mention suggestions and adjusts the textarea height dynamically. It includes drag-and-drop functionality for file uploads and provides a preview mode for the message content.
 *
 * @param onSend - Callback function to handle sending the message.
 * @param onTypingStart - Callback function to indicate typing has started.
 * @param onTypingStop - Callback function to indicate typing has stopped.
 * @param placeholder - Placeholder text for the input area (default: "Type a message...").
 * @param disabled - Flag to disable the input (default: false).
 * @param threadId - Optional identifier for the thread (default: null).
 * @param channelMembers - List of channel members for mention suggestions.
 * @param workspaceId - Identifier for the workspace.
 */
export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  placeholder = "Type a message...",
  disabled = false,
  threadId = null,
  channelMembers = [],
  workspaceId,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Mentions state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [wikiPages, setWikiPages] = useState<{ id: string; title: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { uploads, uploadFiles, isUploading, clearUploads } = useFileUpload(workspaceId);

  // Fetch wiki pages for suggestions
  useEffect(() => {
    if (!workspaceId) return;

    const fetchWikiPages = async () => {
      try {
        const response = await fetch(`/api/wiki/${workspaceId}/pages?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setWikiPages(data.pages.map((p: any) => ({ id: p.id, title: p.title })));
        }
      } catch (error) {
        console.error("Failed to fetch wiki pages for suggestions:", error);
      }
    };

    fetchWikiPages();
  }, [workspaceId]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, []);

  // Update suggestions when query changes
  useEffect(() => {
    if (mentionQuery !== null) {
      const newSuggestions = getMentionSuggestions(mentionQuery, channelMembers, wikiPages);
      setSuggestions(newSuggestions);
      setActiveSuggestionIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [mentionQuery, channelMembers, wikiPages]);

  // Handle content change
  /**
   * Handles changes to the content and manages mention suggestions.
   *
   * This function updates the content state with the provided value, adjusts the textarea height,
   * and checks for mention triggers by looking for the last '@' character. If a valid mention is detected,
   * it updates the mention query and index accordingly. Additionally, it manages typing indicators by
   * starting and stopping a typing timeout based on user input.
   *
   * @param value - The new content value to be processed.
   */
  const handleContentChange = (value: string) => {
    setContent(value);
    adjustTextareaHeight();

    // Check for mention trigger
    // We need to find the last @ that is not followed by a space
    const lastAtPos = value.lastIndexOf("@");

    if (lastAtPos !== -1) {
      const textAfterAt = value.slice(lastAtPos + 1);
      // If there's a space, we assume the mention is done or invalid for now
      // unless we want to support multi-word mentions which is harder
      if (!textAfterAt.includes(" ")) {
        // Show suggestions even with empty query (when user just types @)
        setMentionQuery(textAfterAt);
        setMentionIndex(lastAtPos);
      } else {
        setMentionQuery(null);
        setMentionIndex(-1);
      }
    } else {
      setMentionQuery(null);
      setMentionIndex(-1);
    }

    // Typing indicators
    if (value && !typingTimeoutRef.current) {
      onTypingStart?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
      typingTimeoutRef.current = undefined;
    }, 1000);
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);

    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
      adjustTextareaHeight();
    }, 0);
  };

  // Handle mention selection
  const handleMentionSelect = (suggestion: MentionSuggestion) => {
    if (mentionIndex === -1) return;

    const beforeMention = content.substring(0, mentionIndex);
    // We replace everything after the @ until the end or next space
    const afterMention = content.substring(mentionIndex + (mentionQuery?.length || 0) + 1);

    // Insert rich mention format: @[display](type:id)
    const mentionText = `@[${suggestion.display}](${suggestion.type}:${suggestion.id})`;
    const newContent = `${beforeMention}${mentionText} ${afterMention}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionIndex(-1);
    setSuggestions([]);

    setTimeout(() => {
      textareaRef.current?.focus();
      // Set cursor after the inserted mention + space
      const newCursorPos = mentionIndex + mentionText.length + 1;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      adjustTextareaHeight();
    }, 0);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Google Drive file selection
  const handleDriveFileSelect = (file: GoogleDriveFile) => {
    setSelectedDriveFiles((prev) => [...prev, file]);
  };

  // Remove selected Drive file
  const removeDriveFile = (index: number) => {
    setSelectedDriveFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle send
  const handleSend = async () => {
    if (
      (!content.trim() && selectedFiles.length === 0 && selectedDriveFiles.length === 0) ||
      sending
    )
      return;

    setSending(true);

    try {
      let attachments: any[] = [];

      if (selectedFiles.length > 0) {
        console.log("[MessageInput] Uploading files:", selectedFiles);
        try {
          const uploadedFiles = await uploadFiles(selectedFiles);
          console.log("[MessageInput] Upload successful:", uploadedFiles);
          attachments = uploadedFiles;
        } catch (uploadError) {
          console.error("[MessageInput] Upload failed:", uploadError);
          alert(
            `Upload failed: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}. Please check your UploadThing configuration.`
          );
          setSending(false);
          return;
        }
      }

      // Add Google Drive files to attachments
      if (selectedDriveFiles.length > 0) {
        const driveAttachments = selectedDriveFiles.map((file) => ({
          type: "google-drive",
          ...file,
        }));
        attachments = [...attachments, ...driveAttachments];
      }

      console.log("[MessageInput] Sending message with attachments:", attachments);
      await onSend(content.trim(), attachments.length > 0 ? attachments : undefined);

      setContent("");
      setSelectedFiles([]);
      setSelectedDriveFiles([]);
      clearUploads();
      setIsPreview(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    } catch (error) {
      console.error("[MessageInput] Error sending message:", error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestion navigation
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(suggestions[activeSuggestionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggestions([]);
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "bg-background border-t p-4 transition-colors",
        isDragging && "bg-muted/50 border-primary/50 dashed border-2"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="mb-2 flex items-center gap-1">
        <Button
          variant={isPreview ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? <Edit2 className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
          {isPreview ? "Write" : "Preview"}
        </Button>
        <div className="bg-border mx-1 h-4 w-px" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText("**bold**")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText("_italic_")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText("`code`")}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <span className="text-lg">{getFileTypeIcon(file.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="max-w-[200px] truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Google Drive file previews */}
      {selectedDriveFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedDriveFiles.map((file, index) => (
            <div
              key={index}
              className="bg-muted/50 border-primary/20 flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <HardDrive className="text-primary h-4 w-4" />
              <div className="min-w-0 flex-1">
                <p className="max-w-[200px] truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">Google Drive</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeDriveFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mb-3 space-y-2">
          {uploads.map((upload, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{upload.file.name}</span>
                <span className="text-muted-foreground">{upload.progress}%</span>
              </div>
              <Progress value={upload.progress} className="h-1" />
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Paperclip className="text-muted-foreground h-5 w-5" />
        </Button>

        <GoogleDrivePicker
          onSelect={handleDriveFileSelect}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              disabled={disabled || isUploading}
            >
              <HardDrive className="text-muted-foreground h-5 w-5" />
            </Button>
          }
        />

        <div className="relative flex-1">
          {isPreview ? (
            <div className="bg-muted/20 prose prose-sm dark:prose-invert max-h-[200px] min-h-[40px] overflow-y-auto rounded-md border p-2">
              {content ? (
                <RichTextRenderer content={content} />
              ) : (
                <span className="text-muted-foreground italic">Nothing to preview</span>
              )}
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || sending}
              className="max-h-[200px] min-h-[40px] resize-none pr-8"
              rows={1}
            />
          )}

          {/* Mention Popup */}
          {suggestions.length > 0 && (
            <MentionList
              suggestions={suggestions}
              onSelect={handleMentionSelect}
              activeIndex={activeSuggestionIndex}
            />
          )}
        </div>

        <EmojiPicker onSelect={insertText} />

        <Button
          onClick={handleSend}
          disabled={
            (!content.trim() && selectedFiles.length === 0) || disabled || sending || isUploading
          }
          size="sm"
          className="h-9 w-9 p-0"
        >
          {sending || isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <p className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>
          Press <kbd className="bg-muted rounded px-1 py-0.5">Enter</kbd> to send,{" "}
          <kbd className="bg-muted rounded px-1 py-0.5">Shift+Enter</kbd> for new line
        </span>
        {isDragging && <span className="text-primary font-medium">Drop files to upload</span>}
      </p>
    </div>
  );
}
