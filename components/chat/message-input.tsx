"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2, Bold, Italic, Code, Eye, Edit2, AtSign } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { formatFileSize, getFileTypeIcon } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { EmojiPicker } from "./emoji-picker";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}

export function MessageInput({
    onSend,
    onTypingStart,
    onTypingStop,
    placeholder = "Type a message...",
    disabled = false,
    threadId = null,
    channelMembers = [],
}: MessageInputProps) {
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isPreview, setIsPreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number>(-1);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const { uploads, uploadFiles, isUploading, clearUploads } = useFileUpload();

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
        }
    }, []);

    // Handle content change
    const handleContentChange = (value: string) => {
        setContent(value);
        adjustTextareaHeight();

        // Check for mention trigger
        const lastChar = value.slice(-1);
        if (lastChar === "@") {
            setMentionQuery("");
            setMentionIndex(value.length - 1);
        } else if (mentionQuery !== null) {
            const query = value.slice(mentionIndex + 1);
            if (query.includes(" ")) {
                setMentionQuery(null);
                setMentionIndex(-1);
            } else {
                setMentionQuery(query);
            }
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
    const handleMentionSelect = (userName: string) => {
        if (mentionIndex === -1) return;

        const beforeMention = content.substring(0, mentionIndex);
        const afterMention = content.substring(mentionIndex + (mentionQuery?.length || 0) + 1);
        const newContent = `${beforeMention}@${userName} ${afterMention}`;

        setContent(newContent);
        setMentionQuery(null);
        setMentionIndex(-1);

        setTimeout(() => {
            textareaRef.current?.focus();
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

    // Handle send
    const handleSend = async () => {
        if ((!content.trim() && selectedFiles.length === 0) || sending) return;

        setSending(true);

        try {
            let attachments: any[] = [];

            if (selectedFiles.length > 0) {
                const uploadedFiles = await uploadFiles(selectedFiles);
                attachments = uploadedFiles;
            }

            await onSend(content.trim(), attachments.length > 0 ? attachments : undefined);

            setContent("");
            setSelectedFiles([]);
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
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            if (mentionQuery !== null) return; // Let enter select mention
            e.preventDefault();
            handleSend();
        }
    };

    // Filter members for mention
    const filteredMembers = mentionQuery !== null
        ? channelMembers.filter(member =>
            member.user.name?.toLowerCase().includes(mentionQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    return (
        <div
            className={cn(
                "border-t bg-background p-4 transition-colors",
                isDragging && "bg-muted/50 border-primary/50 dashed border-2"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-2">
                <Button
                    variant={isPreview ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => setIsPreview(!isPreview)}
                >
                    {isPreview ? <Edit2 className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {isPreview ? "Write" : "Preview"}
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("**bold**")}>
                    <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("_italic_")}>
                    <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertText("`code`")}>
                    <Code className="h-4 w-4" />
                </Button>
            </div>

            {/* File previews */}
            {selectedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
                            <span className="text-lg">{getFileTypeIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(index)}>
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
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>

                <div className="relative flex-1">
                    {isPreview ? (
                        <div className="min-h-[40px] max-h-[200px] overflow-y-auto p-2 rounded-md border bg-muted/20 prose prose-sm dark:prose-invert">
                            {content ? (
                                <div className="whitespace-pre-wrap">{content}</div>
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
                            className="min-h-[40px] max-h-[200px] resize-none pr-8"
                            rows={1}
                        />
                    )}

                    {/* Mention Popup */}
                    {mentionQuery !== null && filteredMembers.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md border bg-popover p-1 shadow-md">
                            <Command>
                                <CommandList>
                                    <CommandGroup heading="Members">
                                        {filteredMembers.map((member) => (
                                            <CommandItem
                                                key={member.userId}
                                                onSelect={() => handleMentionSelect(member.user.name || "")}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                    {member.user.image ? (
                                                        <img src={member.user.image} alt={member.user.name || ""} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs">{member.user.name?.[0]}</span>
                                                    )}
                                                </div>
                                                <span>{member.user.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    )}
                </div>

                <EmojiPicker onSelect={insertText} />

                <Button
                    onClick={handleSend}
                    disabled={(!content.trim() && selectedFiles.length === 0) || disabled || sending || isUploading}
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

            <p className="text-xs text-muted-foreground mt-2 flex justify-between">
                <span>
                    Press <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to send,{" "}
                    <kbd className="px-1 py-0.5 rounded bg-muted">Shift+Enter</kbd> for new line
                </span>
                {isDragging && <span className="text-primary font-medium">Drop files to upload</span>}
            </p>
        </div>
    );
}
