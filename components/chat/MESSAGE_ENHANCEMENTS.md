# Message List Enhancements - Implementation Guide

## Overview

Enhanced the message list with emoji reactions, read receipts, and improved thread UI. All components are ready to use and can be integrated into the existing chat layout.

## New Components Created

### 1. ReactionPicker (`reaction-picker.tsx`)

Emoji picker popover for adding reactions to messages.

**Usage:**
```tsx
<ReactionPicker onSelect={(emoji) => handleReaction(messageId, emoji)} />
```

**Features:**
- 18 common emojis (👍, ❤️, 😂, etc.)
- Popover interface
- Click to select and close

### 2. MessageReactions (`message-reactions.tsx`)

Displays grouped reactions on messages with user tooltips.

**Usage:**
```tsx
<MessageReactions
  reactions={message.reactions || []}
  currentUserId={userId}
  onReactionClick={(emoji) => addReaction(messageId, emoji)}
  onReactionRemove={(reactionId) => removeReaction(reactionId)}
/>
```

**Features:**
- Groups reactions by emoji
- Shows count for each emoji
- Highlights user's own reactions
- Tooltip shows who reacted
- Click to toggle reaction

### 3. ReadReceipts (`read-receipts.tsx`)

Shows who has read a message with avatars and timestamps.

**Usage:**
```tsx
<ReadReceipts
  readBy={message.readBy || []}
  totalMembers={channelMemberCount}
  currentUserId={userId}
/>
```

**Features:**
- Single check (✓) for sent
- Double check (✓✓) for read by some
- Blue double check for read by all
- Shows up to 3 avatars
- Tooltip with full list and timestamps

## Updated Components

### MessageItem (`message-item.tsx`)

Added new props:
```typescript
interface MessageItemProps {
  // ... existing props
  onReaction?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (reactionId: string) => void;
  totalChannelMembers?: number;
}
```

**New Features:**
- Reaction picker in hover menu
- Reactions display below message
- Read receipts indicator
- Thread expansion (already existed)

## Type Definitions

Updated `types/chat.ts` with:

```typescript
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

export interface ExtendedMessage extends Message {
  // ... existing fields
  reactions?: MessageReaction[];
  readBy?: ReadReceipt[];
}
```

## API Endpoints

Created `/api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions/route.ts`:

- **POST** - Add reaction
- **DELETE** - Remove reaction

> **Note:** These are placeholder implementations. To fully integrate:
> 1. Add `MessageReaction` model to Prisma schema
> 2. Update message queries to include reactions
> 3. Add WebSocket events for real-time reaction updates

## Integration Steps

### 1. Update Prisma Schema (Optional but Recommended)

Add to `schema.prisma`:

```prisma
model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())
  
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId, emoji])
  @@index([messageId])
  @@map("message_reaction")
}

model ReadReceipt {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId])
  @@index([messageId])
  @@map("read_receipt")
}

// Update Message model
model Message {
  // ... existing fields
  reactions   MessageReaction[]
  readReceipts ReadReceipt[]
}
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

### 2. Update Message Queries

In your message API routes, include reactions and read receipts:

```typescript
const messages = await prisma.message.findMany({
  // ... existing query
  include: {
    user: { select: { id: true, name: true, email: true, image: true } },
    reactions: {
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    },
    readReceipts: {
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    },
    _count: { select: { replies: true } }
  }
});
```

### 3. Update ChatLayout Component

Add reaction handlers:

```typescript
// In chat-layout.tsx
const handleAddReaction = async (messageId: string, emoji: string) => {
  try {
    await fetch(
      `/api/chat/${workspaceId}/channels/${activeChannelId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }
    );
    // Refetch messages or update optimistically
  } catch (error) {
    console.error("Error adding reaction:", error);
  }
};

const handleRemoveReaction = async (reactionId: string) => {
  try {
    await fetch(
      `/api/chat/${workspaceId}/channels/${activeChannelId}/messages/reactions/${reactionId}`,
      {
        method: "DELETE",
      }
    );
    // Refetch messages or update optimistically
  } catch (error) {
    console.error("Error removing reaction:", error);
  }
};

// Pass to MessageList
<MessageList
  // ... existing props
  onReaction={handleAddReaction}
  onReactionRemove={handleRemoveReaction}
  totalChannelMembers={activeChannel?._count.members || 0}
/>
```

### 4. Update MessageList Component

Pass props through to MessageItem:

```typescript
// In message-list.tsx
interface MessageListProps {
  // ... existing props
  onReaction?: (messageId: string, emoji: string) => void;
  onReactionRemove?: (reactionId: string) => void;
  totalChannelMembers?: number;
}

// In render
<MessageItem
  // ... existing props
  onReaction={onReaction}
  onReactionRemove={onReactionRemove}
  totalChannelMembers={totalChannelMembers}
/>
```

### 5. Add WebSocket Events (Optional)

For real-time reactions, add to `lib/websocket.ts`:

```typescript
// Add to WebSocketEvent enum
REACTION_ADDED = "reaction_added",
REACTION_REMOVED = "reaction_removed",

// Add handlers
socket.on(WebSocketEvent.REACTION_ADDED, ({ channelId, messageId, reaction }) => {
  socket.to(`channel:${channelId}`).emit(WebSocketEvent.REACTION_ADDED, {
    channelId,
    messageId,
    reaction,
  });
});
```

## Features Checklist

- [x] **Message Reactions**
  - [x] Emoji picker component
  - [x] Reaction display with grouping
  - [x] Add/remove reactions
  - [x] User tooltips
  - [x] Highlight own reactions

- [x] **Read Receipts**
  - [x] Check mark indicators
  - [x] Avatar display
  - [x] Tooltip with details
  - [x] Timestamp formatting

- [x] **Thread UI**
  - [x] Thread reply count
  - [x] Thread expansion (existing)
  - [x] Thread overlay (existing)

- [x] **Message Display**
  - [x] User avatars (existing)
  - [x] Timestamps (existing)
  - [x] File attachments (existing)
  - [x] Message grouping (existing)

## Testing

### Manual Testing Steps

1. **Reactions:**
   - Hover over a message
   - Click the smile icon
   - Select an emoji
   - Verify reaction appears below message
   - Click reaction to remove it
   - Verify tooltip shows who reacted

2. **Read Receipts:**
   - Send a message
   - Verify single check appears
   - Have another user read it
   - Verify double check appears
   - Hover to see who read it

3. **Threads:**
   - Click reply count on a message
   - Verify thread opens
   - Send a reply
   - Verify count updates

## Current Limitations

1. **Database Schema:** Reactions and read receipts are not persisted (placeholder API)
2. **Real-time Updates:** WebSocket events for reactions not implemented
3. **Read Receipt Tracking:** Automatic read tracking not implemented

## Next Steps

To make this production-ready:

1. Update Prisma schema with MessageReaction and ReadReceipt models
2. Implement database persistence in API routes
3. Add WebSocket events for real-time updates
4. Implement automatic read receipt tracking
5. Add reaction search/filter
6. Add custom emoji support
7. Add reaction analytics

## Files Created/Modified

**New Files:**
- `components/chat/reaction-picker.tsx`
- `components/chat/message-reactions.tsx`
- `components/chat/read-receipts.tsx`
- `app/api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]/reactions/route.ts`

**Modified Files:**
- `types/chat.ts` - Added MessageReaction and ReadReceipt types
- `components/chat/message-item.tsx` - Added reaction and read receipt support

**Ready to Integrate:**
- `components/chat/chat-layout.tsx` - Needs reaction handlers
- `components/chat/message-list.tsx` - Needs to pass through props
