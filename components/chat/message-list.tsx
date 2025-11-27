"use client";

import { useEffect, useRef } from "react";
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
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: ExtendedMessage) => void;
  onEdit?: (message: ExtendedMessage) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (reactionId: string) => void;
  totalChannelMembers?: number;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onReactionRemove,
  totalChannelMembers,
  messagesEndRef,
}: MessageListProps) {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

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
        <div className="text-center">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-muted-foreground mt-1 text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
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
                    isGrouped={index > 0}
                    showAvatar={index === 0}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReaction={onReaction}
                    onReactionRemove={onReactionRemove}
                    totalChannelMembers={totalChannelMembers}
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
