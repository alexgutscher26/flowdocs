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
  File as FileIcon,
  HardDrive,
  ExternalLink,
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
  onPin?: (messageId: string, isPinned: boolean) => void;
  totalChannelMembers?: number;
}

/**
 * Render a message item with various interactive features.
 *
 * This function displays a message along with its user information, content, attachments, and reactions.
 * It handles hover states to show action buttons, allows for replying, editing, deleting, and pinning messages,
 * and manages the display of read receipts and user presence based on the provided props.
 *
 * @param message - The message object containing details such as user information, content, and attachments.
 * @param isGrouped - A boolean indicating if the message is part of a grouped conversation.
 * @param showAvatar - A boolean indicating if the user's avatar should be displayed.
 * @param currentUserId - The ID of the current user for comparison with the message sender.
 * @param onReply - Callback function to handle replying to the message.
 * @param onEdit - Callback function to handle editing the message.
 * @param onDelete - Callback function to handle deleting the message.
 * @param onReaction - Callback function to handle adding a reaction to the message.
 * @param onReactionRemove - Callback function to handle removing a reaction from the message.
 * @param onPin - Callback function to handle pinning or unpinning the message.
 * @param totalChannelMembers - The total number of members in the channel for read receipts.
 */
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
  onPin,
  totalChannelMembers = 0,
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isOwnMessage = message.userId === currentUserId;
  const hasReplies = (message._count?.replies || 0) > 0;

  const handleMouseEnter = () => {
    console.log("Message hovered:", message.id);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    console.log("Mouse left message:", message.id);
    setIsHovered(false);
  };

  return (
    <div
      className={cn(
        "group hover:bg-muted/50 relative px-4 py-1 transition-colors",
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
        <div className="min-w-0 flex-1">
          {/* Header (only show if not grouped) */}
          {!isGrouped && (
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold">
                {message.user.name || message.user.email}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatMessageTime(new Date(message.createdAt))}
              </span>
              {message.isEdited && <span className="text-muted-foreground text-xs">(edited)</span>}
              {message.isPinned && (
                <span className="text-muted-foreground text-xs" title="Pinned">
                  📌
                </span>
              )}
            </div>
          )}

          {/* Message text */}
          <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index}>
                  {attachment.type === "google-drive" ? (
                    <a
                      href={attachment.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted/50 hover:bg-muted border-primary/20 flex max-w-sm items-center gap-2 rounded-lg border p-3 transition-colors"
                    >
                      <HardDrive className="h-5 w-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attachment.name}</p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          Google Drive
                          <ExternalLink className="h-3 w-3" />
                        </p>
                      </div>
                    </a>
                  ) : isImageFile(attachment.type) ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-lg"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-h-96 max-w-full h-auto rounded-lg border object-contain transition-opacity hover:opacity-90"
                      />
                    </a>
                  ) : isVideoFile(attachment.type) ? (
                    <video
                      src={attachment.url}
                      controls
                      className="max-h-96 max-w-full h-auto rounded-lg border"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted/50 hover:bg-muted flex max-w-sm items-center gap-2 rounded-lg border p-3 transition-colors"
                    >
                      <FileIcon className="text-muted-foreground h-5 w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attachment.name}</p>
                        <p className="text-muted-foreground text-xs">
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
              className="text-primary hover:text-primary mt-2 h-auto px-2 py-1 text-xs"
              onClick={() => onReply?.(message)}
            >
              <Reply className="mr-1 h-3 w-3" />
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
            <div className="mt-1 flex items-center gap-2">
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
          className="absolute -top-3 right-4 flex items-center gap-0.5 rounded-md border bg-white px-1 py-0.5 shadow-lg dark:bg-gray-800"
          style={{ zIndex: 9999 }}
        >
          {onReaction && <ReactionPicker onSelect={(emoji) => onReaction(message.id, emoji)} />}

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
                  <Reply className="mr-2 h-4 w-4" />
                  Reply in thread
                </DropdownMenuItem>
              )}
              {/* Pin/Unpin Option */}
              {onPin && (
                <DropdownMenuItem onClick={() => onPin(message.id, Boolean(message.isPinned))}>
                  <span className="mr-2 h-4 w-4">📌</span>
                  {message.isPinned ? "Unpin message" : "Pin message"}
                </DropdownMenuItem>
              )}

              {isOwnMessage && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit message
                </DropdownMenuItem>
              )}
              {isOwnMessage && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
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
