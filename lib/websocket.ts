import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { Server as HttpServer } from "http";
import { WebSocketEvent } from "@/types/chat";

// Define types for our socket events
export interface ServerToClientEvents {
  [WebSocketEvent.MESSAGE_RECEIVED]: (data: any) => void;
  [WebSocketEvent.USER_TYPING]: (data: {
    userId: string;
    channelId: string;
    userName: string;
  }) => void;
  [WebSocketEvent.PRESENCE_UPDATE]: (data: {
    userId: string;
    status: string;
    lastSeen?: Date;
  }) => void;
  [WebSocketEvent.USER_ONLINE]: (data: { userId: string; status: string }) => void;
  [WebSocketEvent.USER_OFFLINE]: (data: {
    userId: string;
    status: string;
    lastSeen?: Date;
  }) => void;
}

export interface ClientToServerEvents {
  [WebSocketEvent.JOIN_CHANNEL]: (data: { channelId: string }) => void;
  [WebSocketEvent.LEAVE_CHANNEL]: (data: { channelId: string }) => void;
  [WebSocketEvent.MESSAGE_SENT]: (data: { channelId: string; message: any }) => void;
  [WebSocketEvent.TYPING_START]: (data: {
    channelId: string;
    userId: string;
    userName: string;
  }) => void;
  [WebSocketEvent.TYPING_STOP]: (data: { channelId: string; userId: string }) => void;
  [WebSocketEvent.PRESENCE_UPDATE]: (data: { userId: string; status: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  workspaceId: string;
}

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

/**
 * Initialize the Socket.IO server with the given HTTP server.
 *
 * This function sets up a Socket.IO server, configures a Redis adapter if a REDIS_URL is provided, and handles various socket events such as connection, channel join/leave, message sending, and presence updates. It ensures that clients are properly managed within their respective workspaces and channels, broadcasting relevant events to other connected clients.
 *
 * @param httpServer - The HTTP server instance to attach the Socket.IO server to.
 * @returns The initialized Socket.IO server instance.
 */
export const initSocketServer = (httpServer: HttpServer) => {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Setup Redis Adapter if REDIS_URL is present
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();

    // Add error handlers to prevent unhandled error warnings
    pubClient.on("error", (err) => {
      console.error("Redis Pub Client Error:", err);
    });

    subClient.on("error", (err) => {
      console.error("Redis Sub Client Error:", err);
    });

    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter configured");
  } else {
    console.warn("REDIS_URL not found, falling back to in-memory adapter");
  }

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    const { workspaceId, userId } = socket.handshake.query;

    if (!workspaceId || !userId || typeof workspaceId !== "string" || typeof userId !== "string") {
      console.error("Missing workspaceId or userId in connection");
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    socket.data.workspaceId = workspaceId;

    // Join workspace room
    socket.join(`workspace:${workspaceId}`);
    console.log(`User ${userId} joined workspace ${workspaceId}`);

    // Broadcast online status to workspace
    socket.to(`workspace:${workspaceId}`).emit(WebSocketEvent.USER_ONLINE, {
      userId,
      status: "online",
    });

    // Handle channel join
    socket.on(WebSocketEvent.JOIN_CHANNEL, ({ channelId }) => {
      console.log(`User ${userId} joining channel ${channelId}`);
      socket.join(`channel:${channelId}`);

      // Notify others in the channel
      socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_ONLINE, {
        userId,
        status: "online",
      });
    });

    // Handle channel leave
    socket.on(WebSocketEvent.LEAVE_CHANNEL, ({ channelId }) => {
      console.log(`User ${userId} leaving channel ${channelId}`);
      socket.leave(`channel:${channelId}`);

      // Notify others in the channel
      socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_OFFLINE, {
        userId,
        status: "offline",
      });
    });

    // Handle message sent
    socket.on(WebSocketEvent.MESSAGE_SENT, ({ channelId, message }) => {
      console.log(`Message sent to channel ${channelId}`);

      // Broadcast to all clients in the channel except sender
      socket.to(`channel:${channelId}`).emit(WebSocketEvent.MESSAGE_RECEIVED, {
        channelId,
        message,
      });
    });

    // Handle typing start
    socket.on(WebSocketEvent.TYPING_START, ({ channelId, userId, userName }) => {
      socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_TYPING, {
        channelId,
        userId,
        userName,
      });
    });

    // Handle typing stop
    socket.on(WebSocketEvent.TYPING_STOP, ({ channelId, userId }) => {
      socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_TYPING, {
        channelId,
        userId,
        userName: "",
      });
    });

    // Handle presence update
    socket.on(WebSocketEvent.PRESENCE_UPDATE, ({ userId, status }) => {
      socket.to(`workspace:${workspaceId}`).emit(WebSocketEvent.PRESENCE_UPDATE, {
        userId,
        status,
        lastSeen: new Date(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Notify workspace of offline status
      socket.to(`workspace:${workspaceId}`).emit(WebSocketEvent.USER_OFFLINE, {
        userId,
        status: "offline",
        lastSeen: new Date(),
      });
    });
  });

  console.log("Socket.IO server initialized");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

export function broadcastToChannel(channelId: string, event: string, data: any) {
  if (io) {
    io.to(`channel:${channelId}`).emit(event as any, data);
  }
}

export function broadcastToWorkspace(workspaceId: string, event: string, data: any) {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event as any, data);
  }
}
