"use client";

import { useState, useEffect } from "react";
import { ExtendedMessage, ExtendedChannel } from "@/types/chat";
import { ChannelSidebar } from "./channel-sidebar";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadView } from "./thread-view";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useWebSocket } from "@/hooks/use-websocket";
import { Hash, Users, Lock, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";

interface ChatLayoutProps {
  workspaceId: string;
  userId: string;
  userName: string;
  initialChannelId?: string;
  onCreateChannel?: () => void;
  className?: string;
}

/**
 * Renders the chat layout component for a messaging application.
 *
 * This component manages the state of the active channel, handles WebSocket connections for real-time messaging,
 * and provides functionalities for sending messages, managing typing indicators, and displaying online users.
 * It fetches channel details, subscribes to typing and presence updates, and integrates various subcomponents for
 * a cohesive chat experience, including message input, message list, and channel sidebar.
 *
 * @param workspaceId - The ID of the workspace to which the chat belongs.
 * @param userId - The ID of the current user.
 * @param userName - The name of the current user.
 * @param initialChannelId - The ID of the channel to be initially active.
 * @param onCreateChannel - Callback function to be called when a new channel is created.
 * @param className - Additional CSS classes to apply to the component.
 */
export function ChatLayout({
  workspaceId,
  userId,
  userName,
  initialChannelId,
  onCreateChannel,
  className,
}: ChatLayoutProps) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(initialChannelId || null);
  const [activeChannel, setActiveChannel] = useState<ExtendedChannel | null>(null);
  const [threadMessage, setThreadMessage] = useState<ExtendedMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [channelRefreshTrigger, setChannelRefreshTrigger] = useState(0);

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // WebSocket connection
  const {
    connected,
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping,
    onMessage,
    onTyping,
    onPresence,
  } = useWebSocket({
    workspaceId,
    userId,
    enabled: true,
  });

  // Chat messages
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
    reactToMessage,
    removeReaction,
    messagesEndRef,
  } = useChatMessages({
    workspaceId,
    channelId: activeChannelId || "",
    userId,
  });

  // Fetch active channel details
  useEffect(() => {
    if (!activeChannelId) return;

    async function fetchChannel() {
      try {
        const response = await fetch(`/api/chat/${workspaceId}/channels/${activeChannelId}`);
        if (response.ok) {
          const data = await response.json();
          setActiveChannel(data);
        }
      } catch (error) {
        console.error("Error fetching channel:", error);
      }
    }

    fetchChannel();
  }, [workspaceId, activeChannelId]);

  // Join/leave channels via WebSocket
  useEffect(() => {
    if (!activeChannelId || !connected) return;

    joinChannel(activeChannelId);

    return () => {
      leaveChannel(activeChannelId);
    };
  }, [activeChannelId, connected, joinChannel, leaveChannel]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = onTyping?.((payload) => {
      if (payload.channelId === activeChannelId && payload.userId !== userId) {
        setTypingUsers((prev) => {
          if (!prev.includes(payload.userName)) {
            return [...prev, payload.userName];
          }
          return prev;
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((name) => name !== payload.userName));
        }, 3000);
      }
    });

    return unsubscribe;
  }, [connected, onTyping, activeChannelId, userId]);

  // Subscribe to presence updates
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = onPresence?.((payload) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (payload.status === "online") {
          newSet.add(payload.userId);
        } else {
          newSet.delete(payload.userId);
        }
        return newSet;
      });
    });

    return unsubscribe;
  }, [connected, onPresence]);

  // Handle message send
  const handleSendMessage = async (content: string, attachments?: any[]) => {
    await sendMessage(content, attachments);
    stopTyping(activeChannelId!);
  };

  // Handle typing
  const handleTypingStart = () => {
    if (activeChannelId) {
      startTyping(activeChannelId, userName);
    }
  };

  const handleTypingStop = () => {
    if (activeChannelId) {
      stopTyping(activeChannelId);
    }
  };

  // Handle thread open
  const handleOpenThread = (message: ExtendedMessage) => {
    setThreadMessage(message);
  };

  // Handle thread close
  const handleCloseThread = () => {
    setThreadMessage(null);
  };

  // Handle reaction add
  const handleAddReaction = async (messageId: string, emoji: string) => {
    await reactToMessage(messageId, emoji);
  };

  // Handle reaction remove
  const handleRemoveReaction = async (reactionId: string) => {
    await removeReaction(reactionId);
  };

  // Get channel icon
  const getChannelIcon = () => {
    if (!activeChannel) return <Hash className="h-5 w-5" />;

    switch (activeChannel.type) {
      case ChannelType.PUBLIC:
        return <Hash className="h-5 w-5" />;
      case ChannelType.PRIVATE:
        return <Lock className="h-5 w-5" />;
      case ChannelType.DM:
        return <Users className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  return (
    <div className={cn("bg-background flex h-screen", className)}>
      {/* Channel Sidebar */}
      <ChannelSidebar
        workspaceId={workspaceId}
        activeChannelId={activeChannelId}
        onChannelSelect={setActiveChannelId}
        onCreateChannel={() => setCreateDialogOpen(true)}
        refreshTrigger={channelRefreshTrigger}
        onlineUsers={onlineUsers}
        currentUserId={userId}
      />

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {activeChannelId && activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="flex h-14 items-center gap-3 border-b px-4">
              {getChannelIcon()}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <p className="text-muted-foreground truncate text-xs">
                    {activeChannel.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!connected && (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Connecting...
                  </div>
                )}
                <span className="text-muted-foreground text-xs">
                  {activeChannel._count.members}{" "}
                  {activeChannel._count.members === 1 ? "member" : "members"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setSettingsDialogOpen(true)}
                  title="Channel settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={userId}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onReply={handleOpenThread}
              onDelete={deleteMessage}
              onEdit={(msg) => {
                const newContent = prompt("Edit message:", msg.content);
                if (newContent) {
                  editMessage(msg.id, newContent);
                }
              }}
              onReaction={handleAddReaction}
              onReactionRemove={handleRemoveReaction}
              totalChannelMembers={activeChannel._count.members}
              messagesEndRef={messagesEndRef as any}
            />

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="text-muted-foreground px-4 py-2 text-xs">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                    : `${typingUsers.length} people are typing...`}
              </div>
            )}

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              placeholder={`Message #${activeChannel.name}`}
              channelMembers={activeChannel.members}
              workspaceId={workspaceId}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Hash className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">Welcome to Chat</h3>
              <p className="text-muted-foreground">
                Select a channel from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thread Sidebar */}
      {threadMessage && (
        <ThreadView
          workspaceId={workspaceId}
          channelId={activeChannelId!}
          channelName={activeChannel!.name}
          parentMessage={threadMessage}
          currentUserId={userId}
          onClose={handleCloseThread}
          className="w-96 border-l"
        />
      )}

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
        onChannelCreated={(channelId) => {
          setActiveChannelId(channelId);
          setChannelRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Channel Settings Dialog */}
      {activeChannel && (
        <ChannelSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          channel={activeChannel}
          workspaceId={workspaceId}
          currentUserId={userId}
          onChannelUpdated={() => {
            setChannelRefreshTrigger((prev) => prev + 1);
            // Refetch active channel data
            if (activeChannelId) {
              fetch(`/api/chat/${workspaceId}/channels/${activeChannelId}`)
                .then((res) => res.json())
                .then((data) => setActiveChannel(data))
                .catch((error) => console.error("Error refetching channel:", error));
            }
          }}
        />
      )}
    </div>
  );
}
