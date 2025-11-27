# Chat UI Components

A comprehensive Slack-like chat interface with real-time messaging, threading, and file upload capabilities.

## Features

- **Real-time Messaging**: WebSocket-powered instant messaging using Socket.io
- **Channel Management**: Public, private, and direct message channels
- **Threading**: Reply to messages in dedicated thread views
- **File Upload**: Upload images, videos, and documents using UploadThing
- **Infinite Scroll**: Load older messages as you scroll
- **Typing Indicators**: See when others are typing
- **User Presence**: Online/offline/away status indicators
- **Message Actions**: Edit and delete your own messages
- **Responsive Design**: Works on desktop and mobile

## Components

### ChatLayout
Main container component that orchestrates all chat functionality.

```tsx
import { ChatLayout } from "@/components/chat";

<ChatLayout
  workspaceId="workspace-id"
  userId="user-id"
  userName="User Name"
  initialChannelId="channel-id" // optional
  onCreateChannel={() => {}} // optional
/>
```

### ChannelSidebar
Displays list of channels with search and unread counts.

### MessageList
Renders messages with infinite scroll and date grouping.

### MessageInput
Input area with file upload and typing indicators.

### ThreadView
Overlay for viewing and replying to message threads.

### UserPresence
Avatar with online status indicator.

## Usage Example

```tsx
"use client";

import { ChatLayout } from "@/components/chat";
import { useSession } from "@/lib/auth-client";

export default function ChatPage({ params }: { params: { workspaceId: string } }) {
  const { data: session } = useSession();

  if (!session?.user) {
    return <div>Please sign in</div>;
  }

  return (
    <ChatLayout
      workspaceId={params.workspaceId}
      userId={session.user.id}
      userName={session.user.name || session.user.email}
    />
  );
}
```

## Setup

### 1. Install Dependencies

```bash
npm install socket.io socket.io-client uploadthing @uploadthing/react react-intersection-observer date-fns
```

### 2. Configure UploadThing

Add your UploadThing API keys to `.env`:

```env
UPLOADTHING_SECRET=your_secret_key
UPLOADTHING_APP_ID=your_app_id
```

### 3. Initialize WebSocket Server

The WebSocket server is automatically initialized in `server.ts`. Make sure your Next.js app is running with a custom server.

### 4. Database Schema

The chat components use the following Prisma models:
- `Channel`
- `ChannelMember`
- `Message`
- `User`

Make sure these are defined in your `schema.prisma`.

## API Routes

The components expect the following API routes to exist:

- `GET /api/chat/[workspaceId]/channels` - List channels
- `POST /api/chat/[workspaceId]/channels` - Create channel
- `GET /api/chat/[workspaceId]/channels/[channelId]` - Get channel details
- `GET /api/chat/[workspaceId]/channels/[channelId]/messages` - List messages
- `POST /api/chat/[workspaceId]/channels/[channelId]/messages` - Send message
- `PUT /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]` - Edit message
- `DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]` - Delete message

## WebSocket Events

The components use the following WebSocket events:

- `join_channel` - Join a channel room
- `leave_channel` - Leave a channel room
- `message_sent` - Send a message
- `message_received` - Receive a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `user_online` - User came online
- `user_offline` - User went offline
- `presence_update` - Presence status changed

## Customization

### Styling

All components use Tailwind CSS and shadcn/ui components. Customize by:

1. Modifying the component files directly
2. Overriding Tailwind classes
3. Updating your `tailwind.config.ts`

### File Upload Limits

Configure file upload limits in `app/api/uploadthing/core.ts`:

```typescript
chatFileUploader: f({
  image: { maxFileSize: "4MB", maxFileCount: 5 },
  video: { maxFileSize: "16MB", maxFileCount: 2 },
  // ... other file types
})
```

## Troubleshooting

### WebSocket not connecting

- Ensure your custom server is running
- Check that the WebSocket path is `/api/socket`
- Verify CORS settings in `lib/websocket.ts`

### File upload failing

- Verify UploadThing API keys are set
- Check file size limits
- Ensure user is authenticated

### Messages not loading

- Check API routes are working
- Verify database connection
- Check browser console for errors

## License

MIT

### Future Features

Message Reactions: Add emoji reactions to messages
Message Search: Search within channel messages
Rich Text Editor: Add formatting toolbar (bold, italic, code)
Mentions: @mention users with autocomplete
Link Previews: Automatically generate previews for URLs
Read Receipts: Track who has read messages
Message Pinning: Pin important messages to channel
Channel Settings: Edit channel name, description, members
Notifications: Desktop/push notifications for new messages
Voice/Video: Integrate voice/video calling