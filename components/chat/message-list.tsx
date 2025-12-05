"use client";

import { useEffect } from "react";
import { ExtendedMessage } from "@/types/chat";
import { MessageItem } from "./message-item";
import { groupMessagesByDate } from "@/lib/message-utils";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: ExtendedMessage[];
  currentUserId: string;
  workspaceId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: ExtendedMessage) => void;
  onEdit?: (message: ExtendedMessage) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (reactionId: string) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onQuoteReply?: (quotedContent: string) => void;
  totalChannelMembers?: number;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  highlightMessageId?: string;
}

export function MessageList({
  messages,
  currentUserId,
  workspaceId,
  loading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onReactionRemove,
  onPin,
  onQuoteReply,
  totalChannelMembers,
  messagesEndRef,
  highlightMessageId,
}: MessageListProps) {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightMessageId) {
      const element = document.getElementById(`message-${highlightMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightMessageId, messages]);

  // Trigger load more when scrolling to top
  useEffect(() => {
    if (inView && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="bg-card max-w-md rounded-lg p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Loader2 className="text-primary h-12 w-12" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">No messages yet</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                This channel is brand new! Start a conversation below.
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium">You can:</p>
              <ul className="text-muted-foreground space-y-1.5 text-left text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Share updates and ideas with your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Ask questions and collaborate in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Convert important threads to wiki pages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col-reverse">
        {/* Messages end marker for auto-scroll */}
        <div ref={messagesEndRef} />

        {/* Message groups */}
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Messages in this date group */}
            {group.messages.map((groupedMsg, msgIndex) => (
              <div key={groupedMsg.id}>
                {groupedMsg.messages.map((msg, index) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    workspaceId={workspaceId}
                    isGrouped={index > 0}
                    showAvatar={index === 0}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReaction={onReaction}
                    onReactionRemove={onReactionRemove}
                    onPin={onPin}
                    onQuoteReply={onQuoteReply}
                    totalChannelMembers={totalChannelMembers}
                    isHighlighted={msg.id === highlightMessageId}
                  />
                ))}
              </div>
            ))}

            {/* Date separator */}
            <div className="relative my-4">
              <Separator />
              <div className="bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3">
                <span className="text-muted-foreground text-xs font-medium">{group.date}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Load more trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {loading && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
          </div>
        )}

        {/* Initial loading state */}
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
