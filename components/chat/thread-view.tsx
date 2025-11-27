"use client";

import { ExtendedMessage } from "@/types/chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ThreadViewProps {
    workspaceId: string;
    channelId: string;
    parentMessage: ExtendedMessage;
    currentUserId: string;
    onClose: () => void;
    className?: string;
}

export function ThreadView({
    workspaceId,
    channelId,
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
        <div
            className={cn(
                "flex flex-col h-full bg-background border-l",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Thread</h3>
                    <p className="text-xs text-muted-foreground truncate">
                        {parentMessage.user.name || parentMessage.user.email}
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Parent message */}
            <div className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                                {parentMessage.user.name || parentMessage.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                started this thread
                            </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words">
                            {parentMessage.content}
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Thread replies */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b">
                    <p className="text-xs font-medium text-muted-foreground">
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
                    messagesEndRef={messagesEndRef}
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
