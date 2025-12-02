import { ChannelType, ChannelRole, MessageType } from "@/generated/prisma/enums";

// Manually defined types to avoid import issues
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  // Add other fields as needed
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  type: ChannelType;
  archived: boolean;
  archivedAt: Date | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  channelId: string;
  userId: string;
  threadId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

// Extended types with computed fields and relations

export interface ExtendedChannelMember extends ChannelMember {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ExtendedChannel extends Channel {
  members: ExtendedChannelMember[];
  _count: {
    members: number;
    messages: number;
  };
  unreadCount?: number;
  lastMessage?: ExtendedMessage;
}

export interface ExtendedMessage extends Message {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count?: {
    replies: number;
  };
  replies?: ExtendedMessage[];
  parent?: ExtendedMessage | null;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  readBy?: ReadReceipt[];
  isPinned?: boolean;
}

export interface MessageAttachment {
  [x: string]: string | undefined;
  key?: string; // UploadThing key
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  userName?: string;
  userImage?: string;
  createdAt: Date;
}

export interface ReadReceipt {
  userId: string;
  userName: string;
  userImage?: string;
  readAt: Date;
}

// WebSocket event types

export enum WebSocketEvent {
  // Connection events
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",

  // Channel events
  JOIN_CHANNEL = "join_channel",
  LEAVE_CHANNEL = "leave_channel",

  // Message events
  MESSAGE_SENT = "message_sent",
  MESSAGE_RECEIVED = "message_received",
  MESSAGE_UPDATED = "message_updated",
  MESSAGE_DELETED = "message_deleted",

  // Reaction events
  REACTION_ADDED = "reaction_added",
  REACTION_REMOVED = "reaction_removed",

  // Typing events
  TYPING_START = "typing_start",
  TYPING_STOP = "typing_stop",
  USER_TYPING = "user_typing",

  // Presence events
  PRESENCE_UPDATE = "presence_update",
  USER_ONLINE = "user_online",
  USER_OFFLINE = "user_offline",
}

export interface WebSocketMessagePayload {
  channelId: string;
  message: ExtendedMessage;
}

export interface WebSocketTypingPayload {
  channelId: string;
  userId: string;
  userName: string;
}

export interface WebSocketPresencePayload {
  userId: string;
  status: PresenceStatus;
  lastSeen?: Date;
}

// Presence types

export enum PresenceStatus {
  ONLINE = "online",
  AWAY = "away",
  OFFLINE = "offline",
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
}

// File upload types

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  key: string;
}

// Chat UI state types

export interface ChatState {
  activeChannelId: string | null;
  activeThreadId: string | null;
  isThreadOpen: boolean;
  typingUsers: Map<string, string[]>; // channelId -> userIds[]
  presenceMap: Map<string, UserPresence>; // userId -> presence
}

export interface MessageGroup {
  date: string;
  messages: GroupedMessage[];
}

export interface GroupedMessage {
  id: string;
  messages: ExtendedMessage[]; // Consecutive messages from same user
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  firstMessageTime: Date;
}
