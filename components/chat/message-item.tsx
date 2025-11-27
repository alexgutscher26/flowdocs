"use client";

import { useState } from "react";
import { ExtendedMessage, PresenceStatus } from "@/types/chat";
import { formatMessageTime } from "@/lib/message-utils";
import { UserPresence } from "./user-presence";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Reply,
    Pencil,
    Trash2,
    File as FileIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatFileSize, isImageFile, isVideoFile } from "@/lib/message-utils";
import { ReactionPicker } from "./reaction-picker";
import { MessageReactions } from "./message-reactions";
import { ReadReceipts } from "./read-receipts";

interface MessageItemProps {
    message: ExtendedMessage;
    isGrouped?: boolean;
    showAvatar?: boolean;
    currentUserId: string;
    onReply?: (message: ExtendedMessage) => void;
    onEdit?: (message: ExtendedMessage) => void;
    onDelete?: (messageId: string) => void;
    onReaction?: (messageId: string, emoji: string) => void;
    onReactionRemove?: (reactionId: string) => void;
    totalChannelMembers?: number;
}

export function MessageItem({
    message,
    isGrouped = false,
    showAvatar = true,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onReaction,
    onReactionRemove,
    totalChannelMembers = 0,
}: MessageItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isOwnMessage = message.userId === currentUserId;
    const hasReplies = (message._count?.replies || 0) > 0;

    const handleMouseEnter = () => {
        console.log('Message hovered:', message.id);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        console.log('Mouse left message:', message.id);
        setIsHovered(false);
    };

    return (
        <div
            className={cn(
                "group relative px-4 py-1 hover:bg-muted/50 transition-colors",
                isGrouped && "py-0.5"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <div className={cn("flex-shrink-0", isGrouped && showAvatar && "invisible")}>
                    {showAvatar && (
                        <UserPresence
                            userId={message.user.id}
                            userName={message.user.name}
                            userImage={message.user.image}
                            status={PresenceStatus.ONLINE}
                            size="md"
                        />
                    )}
                    {!showAvatar && <div className="w-8" />}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                    {/* Header (only show if not grouped) */}
                    {!isGrouped && (
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                                {message.user.name || message.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatMessageTime(new Date(message.createdAt))}
                            </span>
                            {message.isEdited && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            )}
                        </div>
                    )}

                    {/* Message text */}
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                                <div key={index}>
                                    {isImageFile(attachment.type) ? (
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block max-w-sm"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="rounded-lg border max-h-96 object-cover hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                    ) : isVideoFile(attachment.type) ? (
                                        <video
                                            src={attachment.url}
                                            controls
                                            className="rounded-lg border max-w-sm max-h-96"
                                        />
                                    ) : (
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors max-w-sm"
                                        >
                                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(attachment.size)}
                                                </p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Thread replies indicator */}
                    {hasReplies && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-auto py-1 px-2 text-xs text-primary hover:text-primary"
                            onClick={() => onReply?.(message)}
                        >
                            <Reply className="h-3 w-3 mr-1" />
                            {message._count?.replies} {message._count?.replies === 1 ? "reply" : "replies"}
                        </Button>
                    )}

                    {/* Message Reactions */}
                    {onReaction && onReactionRemove && (
                        <MessageReactions
                            reactions={message.reactions || []}
                            currentUserId={currentUserId}
                            onReactionClick={(emoji) => onReaction(message.id, emoji)}
                            onReactionRemove={onReactionRemove}
                        />
                    )}

                    {/* Read Receipts */}
                    {!isGrouped && message.readBy && message.readBy.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <ReadReceipts
                                readBy={message.readBy}
                                totalMembers={totalChannelMembers}
                                currentUserId={currentUserId}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            {isHovered && (
                <div
                    className="absolute -top-3 right-4 flex items-center gap-0.5 bg-white dark:bg-gray-800 border shadow-lg rounded-md px-1 py-0.5"
                    style={{ zIndex: 9999 }}
                >
                    {onReaction && (
                        <ReactionPicker onSelect={(emoji) => onReaction(message.id, emoji)} />
                    )}

                    {onReply && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onReply(message)}
                            title="Reply in thread"
                        >
                            <Reply className="h-4 w-4" />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onReply && (
                                <DropdownMenuItem onClick={() => onReply(message)}>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply in thread
                                </DropdownMenuItem>
                            )}
                            {isOwnMessage && onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(message)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit message
                                </DropdownMenuItem>
                            )}
                            {isOwnMessage && onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(message.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete message
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}