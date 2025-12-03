import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  WebSocketEvent,
  WebSocketMessagePayload,
  WebSocketTypingPayload,
  WebSocketPresencePayload,
  PresenceStatus,
} from "@/types/chat";

interface UseWebSocketOptions {
  workspaceId: string;
  userId: string;
  enabled?: boolean;
}

interface WebSocketState {
  connected: boolean;
  error: string | null;
}

export function useWebSocket({ workspaceId, userId, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    error: null,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !workspaceId || !userId) return;

    const socket = io({
      path: "/api/socket",
      query: {
        workspaceId,
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on(WebSocketEvent.CONNECT, () => {
      console.log("WebSocket connected");
      setState({ connected: true, error: null });
    });

    socket.on(WebSocketEvent.DISCONNECT, () => {
      console.log("WebSocket disconnected");
      setState({ connected: false, error: null });
    });

    socket.on(WebSocketEvent.ERROR, (error: Error) => {
      console.error("WebSocket error:", error);
      setState((prev) => ({ ...prev, error: error.message }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, userId, enabled]);

  // Join a channel
  const joinChannel = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WebSocketEvent.JOIN_CHANNEL, { channelId });
    }
  }, []);

  // Leave a channel
  const leaveChannel = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WebSocketEvent.LEAVE_CHANNEL, { channelId });
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((payload: WebSocketMessagePayload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WebSocketEvent.MESSAGE_SENT, payload);
    }
  }, []);

  // Start typing indicator
  const startTyping = useCallback(
    (channelId: string, userName: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(WebSocketEvent.TYPING_START, {
          channelId,
          userId,
          userName,
        });
      }
    },
    [userId]
  );

  // Stop typing indicator
  const stopTyping = useCallback(
    (channelId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(WebSocketEvent.TYPING_STOP, {
          channelId,
          userId,
        });
      }
    },
    [userId]
  );

  // Update presence
  const updatePresence = useCallback(
    (status: "online" | "away" | "offline") => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(WebSocketEvent.PRESENCE_UPDATE, {
          userId,
          status,
        });
      }
    },
    [userId]
  );

  // Subscribe to message events
  const onMessage = useCallback((callback: (payload: WebSocketMessagePayload) => void) => {
    if (socketRef.current) {
      socketRef.current.on(WebSocketEvent.MESSAGE_RECEIVED, callback);
      return () => {
        socketRef.current?.off(WebSocketEvent.MESSAGE_RECEIVED, callback);
      };
    }
  }, []);

  // Subscribe to typing events
  const onTyping = useCallback((callback: (payload: WebSocketTypingPayload) => void) => {
    if (socketRef.current) {
      socketRef.current.on(WebSocketEvent.USER_TYPING, callback);
      return () => {
        socketRef.current?.off(WebSocketEvent.USER_TYPING, callback);
      };
    }
  }, []);

  // Subscribe to presence events
  const onPresence = useCallback((callback: (payload: WebSocketPresencePayload) => void) => {
    if (socketRef.current) {
      const handleOnline = (payload: WebSocketPresencePayload) =>
        callback({ ...payload, status: PresenceStatus.ONLINE });
      const handleOffline = (payload: WebSocketPresencePayload) =>
        callback({ ...payload, status: PresenceStatus.OFFLINE });

      socketRef.current.on(WebSocketEvent.USER_ONLINE, handleOnline);
      socketRef.current.on(WebSocketEvent.USER_OFFLINE, handleOffline);

      return () => {
        socketRef.current?.off(WebSocketEvent.USER_ONLINE, handleOnline);
        socketRef.current?.off(WebSocketEvent.USER_OFFLINE, handleOffline);
      };
    }
  }, []);

  return {
    socket: socketRef.current,
    connected: state.connected,
    error: state.error,
    joinChannel,
    leaveChannel,
    sendMessage,
    startTyping,
    stopTyping,
    updatePresence,
    onMessage,
    onTyping,
    onPresence,
    onReactionAdded: useCallback((callback: (payload: { messageId: string; reaction: any }) => void) => {
      if (socketRef.current) {
        socketRef.current.on(WebSocketEvent.REACTION_ADDED, callback);
        return () => {
          socketRef.current?.off(WebSocketEvent.REACTION_ADDED, callback);
        };
      }
    }, []),
    onReactionRemoved: useCallback(
      (callback: (payload: { messageId: string; reactionId: string }) => void) => {
        if (socketRef.current) {
          socketRef.current.on(WebSocketEvent.REACTION_REMOVED, callback);
          return () => {
            socketRef.current?.off(WebSocketEvent.REACTION_REMOVED, callback);
          };
        }
      },
      []
    ),
  };
}
