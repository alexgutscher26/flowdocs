"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Bookmark,
  BookmarkCheck,
  Link,
  Forward,
  MailOpen,
  Quote,
  Pencil,
  Trash2,
} from "lucide-react";
import { ExtendedMessage } from "@/types/chat";
import { generatePermalink, copyToClipboard, formatQuoteReply } from "@/lib/message-actions";
import { cn } from "@/lib/utils";

interface MessageActionsMenuProps {
  message: ExtendedMessage;
  workspaceId: string;
  currentUserId: string;
  isOwnMessage: boolean;
  isSaved?: boolean;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onEdit?: (message: ExtendedMessage) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: ExtendedMessage) => void;
  onBookmark?: (messageId: string, isSaved: boolean) => void;
  onForward?: (message: ExtendedMessage) => void;
  onMarkUnread?: (messageId: string) => void;
  onQuoteReply?: (quotedContent: string) => void;
}

/**
 * Renders a menu for various actions that can be performed on a message.
 *
 * This component provides options to reply, quote reply, pin/unpin, bookmark/save, mark as unread, copy link, forward, edit, and delete a message.
 * It utilizes state management to control the visibility of the menu and handles user interactions through callback functions passed as props.
 *
 * @param message - The message object containing details such as id, content, and user information.
 * @param workspaceId - The ID of the workspace where the message resides.
 * @param currentUserId - The ID of the current user interacting with the message.
 * @param isOwnMessage - A boolean indicating if the message belongs to the current user.
 * @param isSaved - A boolean indicating if the message is saved/bookmarked.
 * @param onPin - Callback function to handle pinning/unpinning the message.
 * @param onEdit - Callback function to handle editing the message.
 * @param onDelete - Callback function to handle deleting the message.
 * @param onReply - Callback function to handle replying to the message.
 * @param onBookmark - Callback function to handle bookmarking the message.
 * @param onForward - Callback function to handle forwarding the message.
 * @param onMarkUnread - Callback function to handle marking the message as unread.
 * @param onQuoteReply - Callback function to handle quoting the reply to the message.
 */
export function MessageActionsMenu({
  message,
  workspaceId,
  currentUserId,
  isOwnMessage,
  isSaved = false,
  onPin,
  onEdit,
  onDelete,
  onReply,
  onBookmark,
  onForward,
  onMarkUnread,
  onQuoteReply,
}: MessageActionsMenuProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    const permalink = generatePermalink(
      workspaceId,
      message.channelId,
      message.id,
      message.threadId || undefined
    );

    const success = await copyToClipboard(permalink);

    if (success) {
      toast({
        title: "Link copied",
        description: "Message link copied to clipboard",
      });
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
    setOpen(false);
  };

  /**
   * Executes the given action and closes the open state.
   */
  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        <div className="flex flex-col">
          {/* Reply */}
          {onReply && (
            <button
              onClick={() => handleAction(() => onReply(message))}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              <Quote className="mr-2 h-4 w-4" />
              Reply in thread
            </button>
          )}

          {/* Quote Reply */}
          {onQuoteReply && (
            <button
              onClick={() =>
                handleAction(() => {
                  const quotedContent = formatQuoteReply(
                    message.content,
                    message.user.name || message.user.email
                  );
                  onQuoteReply(quotedContent);
                })
              }
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              <Quote className="mr-2 h-4 w-4" />
              Quote reply
            </button>
          )}

          <div className="my-1 h-px bg-border" />

          {/* Pin/Unpin */}
          {onPin && (
            <button
              onClick={() => handleAction(() => onPin(message.id, Boolean(message.isPinned)))}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              {message.isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin message
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin message
                </>
              )}
            </button>
          )}

          {/* Bookmark/Save */}
          {onBookmark && (
            <button
              onClick={() => handleAction(() => onBookmark(message.id, isSaved))}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                  Remove bookmark
                </>
              ) : (
                <>
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save message
                </>
              )}
            </button>
          )}

          {/* Mark as Unread */}
          {onMarkUnread && !isOwnMessage && (
            <button
              onClick={() => handleAction(() => onMarkUnread(message.id))}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              <MailOpen className="mr-2 h-4 w-4" />
              Mark as unread
            </button>
          )}

          <div className="my-1 h-px bg-border" />

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
          >
            <Link className="mr-2 h-4 w-4" />
            Copy link
          </button>

          {/* Forward */}
          {onForward && (
            <button
              onClick={() => handleAction(() => onForward(message))}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
            >
              <Forward className="mr-2 h-4 w-4" />
              Forward message
            </button>
          )}

          {/* Edit and Delete for own messages */}
          {isOwnMessage && (
            <>
              <div className="my-1 h-px bg-border" />
              {onEdit && (
                <button
                  onClick={() => handleAction(() => onEdit(message))}
                  className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit message
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => handleAction(() => onDelete(message.id))}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete message
                </button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
