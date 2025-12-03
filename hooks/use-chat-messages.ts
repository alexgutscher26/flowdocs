import { useState, useCallback, useEffect, useRef } from "react";
import { ExtendedMessage } from "@/types/chat";
import { useWebSocket } from "./use-websocket";

interface UseChatMessagesOptions {
  workspaceId: string;
  channelId: string;
  userId: string;
  threadId?: string | null;
  limit?: number;
}

interface MessagesState {
  messages: ExtendedMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

export function useChatMessages({
  workspaceId,
  channelId,
  userId,
  threadId = null,
  limit = 50,
}: UseChatMessagesOptions) {
  const [state, setState] = useState<MessagesState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: true,
    nextCursor: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { onMessage, connected, onReactionAdded, onReactionRemoved } = useWebSocket({
    workspaceId,
    userId,
  });

  // Fetch initial messages
  const fetchMessages = useCallback(
    async (cursor?: string | null) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(cursor && { cursor }),
          ...(threadId && { threadId }),
        });

        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        console.log("[fetchMessages] First message reactions (raw):", data.messages[0]?.reactions);

        // Transform messages to match frontend interface (flatten reaction user data)
        const messages = data.messages.map((msg: any) => ({
          ...msg,
          reactions: msg.reactions?.map((r: any) => ({
            ...r,
            userName: r.user?.name,
            userImage: r.user?.image,
          })),
        }));

        setState((prev) => ({
          ...prev,
          messages: cursor ? [...prev.messages, ...messages] : messages,
          hasMore: Boolean(data.nextCursor),
          nextCursor: data.nextCursor,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        }));
      }
    },
    [workspaceId, channelId, threadId, limit]
  );

  // Load more messages (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore && state.nextCursor) {
      fetchMessages(state.nextCursor);
    }
  }, [state.loading, state.hasMore, state.nextCursor, fetchMessages]);

  // Send a new message
  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: { url: string; name: string; size: number; type: string }[]
    ) => {
      try {
        console.log("[useChatMessages] Sending message:", { content, attachments });

        const response = await fetch(`/api/chat/${workspaceId}/channels/${channelId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            threadId,
            attachments,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("[useChatMessages] API error:", response.status, errorData);
          throw new Error(errorData.error || `Failed to send message (${response.status})`);
        }

        const newMessage = await response.json();
        console.log("[useChatMessages] Message sent successfully:", newMessage.id);

        // Optimistically add message to state
        setState((prev) => ({
          ...prev,
          messages: [newMessage, ...prev.messages],
        }));

        // Scroll to bottom
        scrollToBottom();

        return newMessage;
      } catch (error) {
        console.error("[useChatMessages] Error sending message:", error);
        throw error;
      }
    },
    [workspaceId, channelId, threadId]
  );

  // Toggle pin status
  const togglePinMessage = useCallback(
    async (messageId: string, isPinned: boolean) => {
      try {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isPinned: !isPinned } : msg
          ),
        }));

        const method = isPinned ? "DELETE" : "POST";
        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages/${messageId}/pin`,
          { method }
        );

        if (!response.ok) {
          throw new Error("Failed to update pin status");
        }

        const updatedMessage = await response.json();

        // Confirm update with server data
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isPinned: updatedMessage.isPinned } : msg
          ),
        }));
      } catch (error) {
        console.error("Error toggling pin status:", error);
        // Revert optimistic update on error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => (msg.id === messageId ? { ...msg, isPinned } : msg)),
        }));
      }
    },
    [workspaceId, channelId]
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages/${messageId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete message");
        }

        // Remove message from state
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== messageId),
        }));
      } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
      }
    },
    [workspaceId, channelId]
  );

  // Update a message
  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages/${messageId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update message");
        }

        const updatedMessage = await response.json();

        // Update message in state
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) => (m.id === messageId ? updatedMessage : m)),
        }));
      } catch (error) {
        console.error("Error updating message:", error);
        throw error;
      }
    },
    [workspaceId, channelId]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = onMessage?.((payload) => {
      if (payload.channelId === channelId) {
        setState((prev) => {
          // Avoid duplicates
          const exists = prev.messages.some((m) => m.id === payload.message.id);
          if (exists) return prev;

          return {
            ...prev,
            messages: [payload.message, ...prev.messages],
          };
        });

        scrollToBottom();
      }
    });

    const unsubscribeReactionAdded = onReactionAdded?.((payload: { messageId: string; reaction: any }) => {
      const { messageId, reaction } = payload;

      // Transform reaction to match frontend interface
      const formattedReaction = {
        ...reaction,
        userName: reaction.user?.name,
        userImage: reaction.user?.image,
      };

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) => {
          if (msg.id !== messageId) return msg;

          // Avoid duplicates (if we already have this reaction, e.g. from optimistic update)
          const exists = msg.reactions?.some(r => r.id === reaction.id);
          if (exists) return msg;

          // If we have a temp reaction for this emoji/user, replace it
          // Otherwise add new
          const tempReactionIndex = msg.reactions?.findIndex(
            r => r.id.startsWith("temp-") && r.emoji === reaction.emoji && r.userId === reaction.userId
          );

          let newReactions = [...(msg.reactions || [])];

          if (tempReactionIndex !== undefined && tempReactionIndex !== -1) {
            newReactions[tempReactionIndex] = formattedReaction;
          } else {
            newReactions.push(formattedReaction);
          }

          return {
            ...msg,
            reactions: newReactions,
          };
        }),
      }));
    });

    const unsubscribeReactionRemoved = onReactionRemoved?.((payload: { messageId: string; reactionId: string }) => {
      const { messageId, reactionId } = payload;

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            reactions: (msg.reactions || []).filter((r) => r.id !== reactionId),
          };
        }),
      }));
    });

    return () => {
      unsubscribe?.();
      unsubscribeReactionAdded?.();
      unsubscribeReactionRemoved?.();
    };
  }, [connected, onMessage, onReactionAdded, onReactionRemoved, channelId, scrollToBottom]);

  // Fetch messages on mount or when channel changes
  useEffect(() => {
    setState({
      messages: [],
      loading: false,
      error: null,
      hasMore: true,
      nextCursor: null,
    });
    fetchMessages();
  }, [channelId, threadId]);

  return {
    ...state,
    fetchMessages,
    sendMessage,
    togglePinMessage,
    deleteMessage,
    editMessage: updateMessage,
    reactToMessage: async (messageId: string, emoji: string) => {
      console.log("[reactToMessage] Called with:", { messageId, emoji, userId });

      // Check if already reacted to avoid duplicate requests
      const message = state.messages.find((m) => m.id === messageId);
      if (!message) {
        console.log("[reactToMessage] Message not found:", messageId);
        return;
      }

      console.log("[reactToMessage] Message found, reactions:", message.reactions);

      const existingReaction = message.reactions?.find(
        (r) => r.emoji === emoji && r.userId === userId
      );

      if (existingReaction) {
        console.log("[reactToMessage] Already reacted, skipping");
        return;
      }

      console.log("[reactToMessage] Adding optimistic update...");

      try {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => {
            if (msg.id !== messageId) return msg;

            // Check if reaction already exists
            const existingReaction = msg.reactions?.find(
              (r) => r.emoji === emoji && r.userId === userId
            );

            if (existingReaction) return msg;

            // Add new reaction
            const newReaction = {
              id: `temp-${Date.now()}`,
              emoji,
              userId,
              messageId,
              createdAt: new Date(),
              userName: "You",
              userImage: undefined,
            };

            return {
              ...msg,
              reactions: [...(msg.reactions || []), newReaction],
            };
          }),
        }));

        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages/${messageId}/reactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          }
        );

        if (!response.ok) {
          // If reaction already exists (409 Conflict), treat as success
          if (response.status === 409) {
            console.log("Reaction already exists in DB, keeping optimistic update");
            return;
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to add reaction");
        }

        const savedReaction = await response.json();
        const formattedReaction = {
          ...savedReaction,
          userName: savedReaction.user?.name,
          userImage: savedReaction.user?.image,
        };

        // Update with real data
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...msg,
              reactions: (msg.reactions || []).map((r) =>
                r.id.startsWith("temp-") && r.emoji === emoji ? formattedReaction : r
              ),
            };
          }),
        }));
      } catch (error) {
        console.error("Error adding reaction:", error);
        // Revert optimistic update (simplified: just refresh messages or remove the temp one)
        // For now, we'll just log it, but a robust app would revert the specific change
        fetchMessages(); // Fallback: refresh to get correct state
      }
    },
    removeReaction: async (reactionId: string) => {
      try {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => ({
            ...msg,
            reactions: msg.reactions?.filter((r) => r.id !== reactionId) || [],
          })),
        }));

        const response = await fetch(
          `/api/chat/${workspaceId}/channels/${channelId}/messages/reactions/${reactionId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) throw new Error("Failed to remove reaction");
      } catch (error) {
        console.error("Error removing reaction:", error);
        fetchMessages(); // Fallback: refresh to get correct state
      }
    },
    refreshMessages: () => fetchMessages(null),
    loadMore: () => {
      if (state.hasMore && !state.loading) {
        fetchMessages(state.nextCursor);
      }
    },
    messagesEndRef,
  };
}
