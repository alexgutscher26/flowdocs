"use client";

import { useState } from "react";
import { ExtendedMessage, PresenceStatus } from "@/types/chat";
import { formatMessageTime } from "@/lib/message-utils";
import { UserPresence } from "./user-presence";
import { Button } from "@/components/ui/button";
import { Reply, File as FileIcon, HardDrive, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, isImageFile, isVideoFile } from "@/lib/message-utils";
import { ReactionPicker } from "./reaction-picker";
import { MessageReactions } from "./message-reactions";
import { ReadReceipts } from "./read-receipts";
import { RichTextRenderer } from "./rich-text-renderer";
import { MessageActionsMenu } from "./message-actions-menu";
import { ForwardMessageDialog } from "./forward-message-dialog";
import { useToast } from "@/hooks/use-toast";

interface MessageItemProps {
  message: ExtendedMessage;
  workspaceId: string;
  isGrouped?: boolean;
  showAvatar?: boolean;
  currentUserId: string;
  onReply?: (message: ExtendedMessage) => void;
  onEdit?: (message: ExtendedMessage) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (reactionId: string) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onQuoteReply?: (quotedContent: string) => void;
  totalChannelMembers?: number;
  isHighlighted?: boolean;
}

/**
 * Render a message item with various interactive features.
 *
 * This function displays a message along with user information, content, attachments, and reactions.
 * It manages hover states to show action buttons, allows for replying, editing, deleting, and pinning messages,
 * and handles the display of read receipts and user presence based on the provided props.
 * Additionally, it includes functionality for bookmarking messages and marking them as unread.
 *
 * @param message - The message object containing details such as user information, content, and attachments.
 * @param workspaceId - The ID of the workspace to which the message belongs.
 * @param isGrouped - A boolean indicating if the message is part of a grouped conversation.
 * @param showAvatar - A boolean indicating if the user's avatar should be displayed.
 * @param currentUserId - The ID of the current user for comparison with the message sender.
 * @param onReply - Callback function to handle replying to the message.
 * @param onEdit - Callback function to handle editing the message.
 * @param onDelete - Callback function to handle deleting the message.
 * @param onReaction - Callback function to handle adding a reaction to the message.
 * @param onReactionRemove - Callback function to handle removing a reaction from the message.
 * @param onPin - Callback function to handle pinning or unpinning the message.
 * @param onQuoteReply - Callback function to handle quoting a reply to the message.
 * @param totalChannelMembers - The total number of members in the channel for read receipts.
 * @param isHighlighted - A boolean indicating if the message should be highlighted.
 */
export function MessageItem({
  message,
  workspaceId,
  isGrouped = false,
  showAvatar = true,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onReactionRemove,
  onPin,
  onQuoteReply,
  totalChannelMembers = 0,
  isHighlighted = false,
}: MessageItemProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
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

  /**
   * Toggles the bookmark status of a message.
   *
   * This function sends a request to either add or remove a bookmark for a message identified by messageId.
   * It determines the HTTP method based on the currentlySaved status and updates the UI accordingly.
   * In case of an error during the fetch operation, it logs the error and displays a toast notification to the user.
   *
   * @param {string} messageId - The ID of the message to be bookmarked or unbookmarked.
   * @param {boolean} currentlySaved - Indicates whether the message is currently saved as a bookmark.
   */
  const handleBookmark = async (messageId: string, currentlySaved: boolean) => {
    try {
      const method = currentlySaved ? "DELETE" : "POST";
      const response = await fetch(`/api/chat/${workspaceId}/messages/${messageId}/bookmark`, {
        method,
      });

      if (response.ok) {
        setIsSaved(!currentlySaved);
        toast({
          title: currentlySaved ? "Bookmark removed" : "Message saved",
          description: currentlySaved
            ? "Message removed from saved items"
            : "Message saved for later",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const handleForward = (message: ExtendedMessage) => {
    setIsForwardDialogOpen(true);
  };

  /**
   * Marks a message as unread by sending a request to the server.
   *
   * This function takes a message ID and makes a POST request to update the read status of the message.
   * If the request is successful, a toast notification is displayed to inform the user.
   * In case of an error during the request, an error message is logged and a different toast notification is shown.
   *
   * @param {string} messageId - The ID of the message to be marked as unread.
   */
  const handleMarkUnread = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/${workspaceId}/messages/${messageId}/read-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markUnread: true }),
      });

      if (response.ok) {
        toast({
          title: "Marked as unread",
          description: "Message marked as unread",
        });
      }
    } catch (error) {
      console.error("Error marking as unread:", error);
      toast({
        title: "Error",
        description: "Failed to mark as unread",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group hover:bg-muted/50 relative px-4 py-1 transition-colors",
        isGrouped && "py-0.5",
        isHighlighted && "bg-primary/10 hover:bg-primary/15 animate-pulse"
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
          <RichTextRenderer
            content={message.content}
            workspaceId={workspaceId}
            className="text-sm"
          />

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index}>
                  {attachment.type === "google-drive" ? (
                    <a
                      href={attachment.webViewLink as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted/50 hover:bg-muted border-primary/20 flex max-w-sm items-center gap-2 rounded-lg border p-3 transition-colors"
                    >
                      <HardDrive className="text-primary h-5 w-5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attachment.name}</p>
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
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
                        className="h-auto max-h-96 max-w-full rounded-lg border object-contain transition-opacity hover:opacity-90"
                      />
                    </a>
                  ) : isVideoFile(attachment.type) ? (
                    <video
                      src={attachment.url}
                      controls
                      className="h-auto max-h-96 max-w-full rounded-lg border"
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

          <MessageActionsMenu
            message={message}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            isOwnMessage={isOwnMessage}
            isSaved={isSaved}
            onPin={onPin}
            onEdit={onEdit}
            onDelete={onDelete}
            onReply={onReply}
            onBookmark={handleBookmark}
            onForward={handleForward}
            onMarkUnread={handleMarkUnread}
            onQuoteReply={onQuoteReply}
          />
        </div>
      )}

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        open={isForwardDialogOpen}
        onOpenChange={setIsForwardDialogOpen}
        message={message}
        workspaceId={workspaceId}
        currentChannelId={message.channelId}
      />
    </div>
  );
}
