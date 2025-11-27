"use client";

import { ExtendedMessage } from "@/types/chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ConvertToWikiButton } from "./convert-to-wiki-button";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ThreadViewProps {
  workspaceId: string;
  channelId: string;
  channelName: string;
  parentMessage: ExtendedMessage;
  currentUserId: string;
  onClose: () => void;
  className?: string;
}

export function ThreadView({
  workspaceId,
  channelId,
  channelName,
  parentMessage,
  currentUserId,
  onClose,
  className,
}: ThreadViewProps) {
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    updateMessage,
    messagesEndRef,
  } = useChatMessages({
    workspaceId,
    channelId,
    userId: currentUserId,
    threadId: parentMessage.id,
  });

  const handleSend = async (content: string, attachments?: any[]) => {
    await sendMessage(content, attachments);
  };

  return (
    <div className={cn("bg-background flex h-full flex-col border-l", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Thread</h3>
          <p className="text-muted-foreground truncate text-xs">
            {parentMessage.user.name || parentMessage.user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConvertToWikiButton
            messages={[parentMessage, ...messages]}
            threadTitle={`Thread from ${parentMessage.user.name || parentMessage.user.email}`}
            channelId={channelId}
            channelName={channelName}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            threadStarterId={parentMessage.userId}
          />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Parent message */}
      <div className="bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold">
                {parentMessage.user.name || parentMessage.user.email}
              </span>
              <span className="text-muted-foreground text-xs">started this thread</span>
            </div>
            <div className="text-sm break-words whitespace-pre-wrap">{parentMessage.content}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Thread replies */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4 py-2">
          <p className="text-muted-foreground text-xs font-medium">
            {messages.length} {messages.length === 1 ? "reply" : "replies"}
          </p>
        </div>

        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onDelete={deleteMessage}
          onEdit={(msg) => {
            const newContent = prompt("Edit message:", msg.content);
            if (newContent) {
              updateMessage(msg.id, newContent);
            }
          }}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        />

        {/* Reply input */}
        <MessageInput
          onSend={handleSend}
          placeholder="Reply to thread..."
          threadId={parentMessage.id}
        />
      </div>
    </div>
  );
}
