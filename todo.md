# Chat-to-Docs MVP Implementation Roadmap

**Tagline**: "Chat that becomes documentation automatically—no more lost context in endless Slack threads."

**Target**: Small teams (5-50 people) at startups, agencies, remote companies who can't justify Notion/Confluence enterprise complexity.

---

## Phase 1: Core Features (Months 1-3)

### Epic 1: Real-time Chat Infrastructure

#### Database Schema Extensions

- [x] **File**: `prisma/schema.prisma`
  - [x] Add `Channel` model with workspace relationship
  - [x] Add `Message` model with threading support
  - [x] Add `ChannelMember` model for permissions
  - [x] Add enums: `ChannelType`, `MessageType`, `ChannelRole`
  - [x] Add relationship: Message → WikiPage conversion
  - [x] Generate and run Prisma migration
  - **Acceptance**: Database can store channels, messages, threads, and members

#### WebSocket Infrastructure

- [x] **File**: `lib/websocket.ts` (new)
  - [x] Set up Socket.IO server with Redis adapter
  - [x] Implement room-based messaging (workspace + channel)
  - [x] Add user presence tracking
  - [x] Build message broadcasting system
  - [x] Create typing indicators
  - [x] Implement online user lists
  - **Acceptance**: Real-time messages sync across multiple clients

#### Chat API Endpoints

- [x] **File**: `app/api/chat/[workspaceId]/channels/route.ts` (new)
  - [x] `GET /api/chat/[workspaceId]/channels` - List channels
  - [x] `POST /api/chat/[workspaceId]/channels` - Create channel
  - [x] `GET /api/chat/[workspaceId]/channels/[channelId]` - Get channel details
  - [x] `PUT /api/chat/[workspaceId]/channels/[channelId]` - Update channel
  - [x] `DELETE /api/chat/[workspaceId]/channels/[channelId]` - Archive channel
  - **Acceptance**: Full channel CRUD operations working

- [x] **File**: `app/api/chat/[workspaceId]/channels/[channelId]/messages/route.ts` (new)
  - [x] `GET /api/chat/[workspaceId]/channels/[channelId]/messages` - List with pagination
  - [x] `POST /api/chat/[workspaceId]/channels/[channelId]/messages` - Send message
  - [x] `PUT /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]` - Edit message
  - [x] `DELETE /api/chat/[workspaceId]/channels/[channelId]/messages/[messageId]` - Delete message
  - [x] Add message threading support (threadId parameter)
  - **Acceptance**: Messages can be sent, edited, deleted, and threaded

#### Chat UI Components

- [x] **File**: `components/chat/chat-layout.tsx` (new)
  - [x] Channel sidebar with unread counts
  - [x] Message list with infinite scroll
  - [x] Message input with file upload area
  - [x] Real-time WebSocket integration
  - [x] Thread view overlay
  - [x] User presence indicators
  - **Acceptance**: Complete chat interface similar to Slack

- [x] **File**: `components/chat/message-list.tsx` (new)
  - [x] Message bubbles with user avatars and info
  - [x] Thread expansion/collapse functionality
  - [x] Reply threading UI
  - [x] Message reactions (emoji reactions)
  - [x] File attachment previews
  - [x] Timestamp formatting (relative time)
  - [x] Read receipts indicator
  - **Acceptance**: Messages display correctly with all interactive elements

- [x] **File**: `components/chat/message-input.tsx` (new)
  - [x] Rich text with markdown preview
  - [x] File drag-and-drop upload
  - [x] Emoji picker integration
  - [x] @mention autocomplete with user search
  - [x] Channel/link autocomplete
  - [x] Message preview before sending
  - **Acceptance**: Users can compose and send messages with rich features

### Epic 2: Thread-to-Wiki Conversion System

#### Wiki Database Schema

- [x] **File**: `prisma/schema.prisma` (extend)
  - [x] Add `WikiPage` model with markdown content
  - [x] Add `WikiVersion` model for version history
  - [x] Add `WikiTag` model for categorization
  - [x] Set up relationships: WikiPage → Message (source thread)
  - [x] Add nested page support (parentId relationship)
  - [x] Generate and run migration
  - **Acceptance**: Wiki pages can store content, versions, and tags

#### Auto-Conversion Logic

- [x] **File**: `lib/wiki-converter.ts` (new)
  - [x] **Thread Analysis**: Identify key messages and decisions
  - [x] **Structure Extraction**: Extract headings, code blocks, links
  - [x] **Summary Generation**: Create executive summary
  - [x] **Auto-tagging**: Categorize content with relevant tags
  - [x] **Format Conversion**: Convert chat to clean markdown
  - [x] **AI Enhancement** (Optional): GPT-4 integration for smart summaries
  - **Acceptance**: Threads convert to well-structured wiki pages automatically

#### Wiki Editor Interface

- [x] **File**: `components/wiki/wiki-editor.tsx` (new)
  - [x] Markdown editor with live preview
  - [x] Formatting toolbar (bold, italic, code, links)
  - [x] File/image insertion from chat
  - [x] Auto-save draft functionality
  - [x] Version history comparison view
  - [x] Tag management interface
  - **Acceptance**: Users can edit wiki pages with rich features

- [x] **File**: `components/wiki/wiki-page-view.tsx` (new)
  - [x] Rendered markdown with syntax highlighting
  - [x] Table of contents generation
  - [x] Related pages sidebar
  - [x] Backlinks to original chat threads
  - [x] Edit button for page owners
  - [x] Version history viewer
  - [x] Print/export options
  - **Acceptance**: Wiki pages display beautifully and link to conversations

#### Conversion Trigger UI

- [x] **File**: `components/chat/convert-to-wiki-button.tsx` (new)
  - [x] Button in thread header (for thread starters/admins)
  - [x] Preview modal with auto-generated content
  - [x] Edit interface before final conversion
  - [x] Confirmation flow with tagging options
  - [x] Success notification with link to wiki page
  - [x] Update original thread with wiki page link
  - **Acceptance**: Converting threads to wiki pages is intuitive and reliable

### Epic 3: Smart Search System

#### Search Infrastructure Setup

- [x] **File**: `lib/search.ts` (new)
  - [x] Set up Typesense search service
  - [x] Configure search indexes for messages and wiki pages
  - [x] Implement message indexing (content + metadata)
  - [x] Implement wiki page indexing with tags
  - [x] Add file content indexing capabilities
  - [x] Set up user search index for mentions
  - **Environment variables**: `TYPESENSE_API_KEY`, `TYPESENSE_HOST`, `TYPESENSE_PORT`
  - **Acceptance**: All content types are searchable via Typesense

#### Search API Endpoints

- [x] **File**: `app/api/search/route.ts` (new)
  - [x] Universal search endpoint with query parameters
  - [x] Support for content type filtering (message|wiki|file|user)
  - [x] Channel and author filtering
  - [x] Date range filtering
  - [x] Wiki tag filtering
  - [x] Result highlighting and snippets
  - [x] Faceted search results (counts by type, channel)
  - **Acceptance**: Search returns relevant, filtered results quickly

#### Search UI Components

- [x] **File**: `components/search/search-modal.tsx` (new)
  - [x] Keyboard shortcut trigger (Cmd+K/Ctrl+K)
  - [x] Real-time search as user types
  - [x] Result categorization (messages, wiki, files)
  - [x] Keyboard navigation through results
  - [x] Advanced filters sidebar
  - [x] Recent searches history
  - [x] "Did you mean?" suggestions
  - [x] Result preview on hover
  - **Acceptance**: Fast, intuitive search experience

- [x] **File**: `components/search/search-results-page.tsx` (new)
  - [x] Full-page search at `/dashboard/search`
  - [x] Persistent search state in URL
  - [x] Advanced filtering sidebar
  - [x] Result sorting options (relevance, date, author)
  - [x] Export search results functionality
  - [x] Save search queries feature
  - **Acceptance**: Comprehensive search interface for power users

### Epic 4: Channels and Direct Messages

#### Channel Management UI

- [x] **File**: `components/chat/channel-sidebar.tsx` (new)
  - [x] Channel list with unread badges
  - [x] Create new channel modal
  - [x] Channel search functionality
  - [x] Channel categories/custom groups
  - [x] Direct messages section
  - [x] Online status indicators
  - [x] Channel settings access
  - **Acceptance**: Easy channel navigation and management

#### Channel Types Implementation

- [x] **Public Channels**:
  - [x] Accessible to all workspace members
  - [x] Discoverable in channel browser
  - [x] Messages indexed in search
  - [x] Join/leave functionality
  - **Acceptance**: Public channels work like Slack public channels

- [x] **Private Channels**:
  - [x] Invite-only access control
  - [x] Hidden from non-members
  - [x] Workspace admin visibility
  - [x] Member management interface
  - **Acceptance**: Private channels are secure and exclusive

- [x] **Direct Messages**:
  - [x] **Backend**: Fix channel list privacy (hide other's DMs from admins)
  - [x] **Backend**: Create "Find or Create DM" API endpoint
  - [x] **Frontend**: Create "New Message" dialog with user search
  - [x] **Frontend**: Add "+" button to DM section in sidebar
  - [x] **Frontend**: Integrate DM creation with sidebar
  - **Acceptance**: DMs work seamlessly without channel overhead

#### Channel Settings

- [x] **File**: `components/chat/channel-settings-dialog.tsx`
  - [x] Channel name and description editing
  - [x] Member management (add/remove users for private channels)
  - [x] Channel deletion
  - [x] Public/private toggle
  - [x] Role assignments (promote/demote between ADMIN and MEMBER)
  - [x] Channel archival with message preservation
  - **Acceptance**: Complete channel management capabilities

### Epic 5: File Attachments and Integrations

#### File Storage System

- [ ] **File**: `lib/file-storage.ts` (new)
  - [ ] AWS S3 or Cloudflare R2 integration
  - [ ] File type validation and security scanning
  - [ ] Image resizing and optimization
  - [ ] Thumbnail generation for images/videos
  - [ ] Virus scanning integration
  - [ ] Storage quota management per workspace
  - **Environment variables**: Storage credentials and bucket names
  - **Acceptance**: Secure, optimized file handling

#### Google Drive Integration

- [ ] **File**: `lib/integrations/google-drive.ts` (new)
  - [ ] OAuth setup with Google Drive scopes
  - [ ] Browse Google Drive files interface
  - [ ] Link files to chat messages
  - [ ] Document/image/video previews
  - [ ] Sync file permissions
  - [ ] Search Google Drive content
  - **Acceptance**: Google Drive files accessible directly in chat

#### GitHub Integration

- [ ] **File**: `lib/integrations/github.ts` (new)
  - [ ] Auto-detect GitHub URLs in messages
  - [ ] Fetch issue/PR metadata and status
  - [ ] Show repository link previews
  - [ ] Link commits to relevant discussions
  - [ ] Repository connection management
  - **Acceptance**: GitHub context embedded in conversations

#### Calendar Integration

- [ ] **File**: `lib/integrations/calendar.ts` (new)
  - [ ] Google Calendar OAuth integration
  - [ ] Outlook Calendar API integration
  - [ ] Schedule meetings from chat discussions
  - [ ] Show meeting availability
  - [ ] Auto-create events from decisions
  - [ ] Meeting notes integration
  - **Acceptance**: Seamless meeting scheduling from conversations

---

## Phase 2: Growth Features (Months 4-6)

### Epic 6: AI Assistant

#### AI Knowledge Base

- [ ] **File**: `lib/ai/knowledge-base.ts` (new)
  - [ ] OpenAI API or Anthropic Claude integration
  - [ ] Question answering using team knowledge
  - [ ] Thread summarization
  - [ ] Wiki page creation suggestions
  - [ ] Related conversation finding
  - [ ] Action item extraction
  - **Environment variables**: AI API keys and model settings
  - **Acceptance**: AI provides helpful context-aware assistance

#### AI UI Components

- [ ] **File**: `components/ai/ai-chat-widget.tsx` (new)
  - [ ] Floating chat bubble interface
  - [ ] Conversation history and context
  - [ ] Source citation for AI responses
  - [ ] Feedback mechanism (helpful/not helpful)
  - [ ] Context-aware suggestions
  - [ ] Proactive recommendations
  - **Acceptance**: Intuitive AI assistance within chat interface

### Epic 7: Mentions and Notifications

#### Mention System

- [ ] **File**: `lib/mentions.ts` (new)
  - [ ] @user mentions with autocomplete
  - [ ] @channel and @here mentions
  - [ ] @wiki page mentions for linking
  - [ ] Mention suggestion algorithm
  - [ ] Notification batching to reduce noise
  - **Acceptance**: Seamless mention experience like Slack

#### Notification Engine

- [ ] **File**: `lib/notifications.ts` (new)
  - [ ] In-app notification center
  - [ ] Email notifications using existing React Email
  - [ ] Browser push notifications
  - [ ] Notification preferences per user
  - [ ] Smart notification routing
  - **Acceptance**: Users stay informed without notification fatigue

---

### Performance Optimization

- [ ] Implement cursor-based pagination for messages
- [ ] Optimize search indexing strategy
- [ ] Set up CDN for file serving
- [ ] Implement caching for frequently accessed data

---

## Security Checklist

### Message Security

- [ ] Encrypt messages at rest and in transit
- [ ] Implement role-based permissions
- [ ] Add audit logging for edits/deletions
- [ ] Create data retention policies

### File Security

- [ ] Implement virus scanning for uploads
- [ ] Add access control for file permissions
- [ ] Ensure encrypted storage
- [ ] GDPR compliance measures

### API Security

- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] Authentication middleware for all routes
- [ ] CORS configuration for integrations

---

**Total Estimated Timeline**: 3 months for MVP, 6 months for full feature set
**Key Success Factor**: Seamless thread-to-wiki conversion that saves teams time while capturing institutional knowledge.
