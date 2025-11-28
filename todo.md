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

- [ ] **File**: `components/chat/channel-sidebar.tsx` (new)
  - [ ] Channel list with unread badges
  - [ ] Create new channel modal
  - [ ] Channel search functionality
  - [ ] Channel categories/custom groups
  - [ ] Direct messages section
  - [ ] Online status indicators
  - [ ] Channel settings access
  - **Acceptance**: Easy channel navigation and management

#### Channel Types Implementation

- [ ] **Public Channels**:
  - [ ] Accessible to all workspace members
  - [ ] Discoverable in channel browser
  - [ ] Messages indexed in search
  - [ ] Join/leave functionality
  - **Acceptance**: Public channels work like Slack public channels

- [ ] **Private Channels**:
  - [ ] Invite-only access control
  - [ ] Hidden from non-members
  - [ ] Workspace admin visibility
  - [ ] Member management interface
  - **Acceptance**: Private channels are secure and exclusive

- [ ] **Direct Messages**:
  - [ ] One-on-one conversations
  - [ ] Auto-creation on first message
  - [ ] No separate channel entity
  - [ ] Message privacy controls
  - **Acceptance**: DMs work seamlessly without channel overhead

#### Channel Settings

- [ ] **File**: `components/chat/channel-settings.tsx` (new)
  - [ ] Channel name and description editing
  - [ ] Public/private toggle
  - [ ] Member management (add/remove users)
  - [ ] Role assignments (admin/member)
  - [ ] Channel archival with message preservation
  - [ ] Notification preferences per user
  - [ ] Integration settings per channel
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

### Epic 8: Mobile App

#### Progressive Web App (PWA)

- [ ] **File**: `public/manifest.json` (update)
  - [ ] PWA manifest configuration
  - [ ] Service worker for offline reading
  - [ ] Install prompt on mobile devices
  - [ ] Push notification support
  - [ ] Mobile-optimized responsive design
  - [ ] Home screen icon and splash screen
  - **Acceptance**: App-like experience on mobile browsers

#### Mobile-Specific Features

- [ ] **File**: `components/chat/mobile-chat-layout.tsx` (new)
  - [ ] Bottom navigation for thumb-friendly access
  - [ ] Swipe gestures for navigation
  - [ ] Camera integration for photo sharing
  - [ ] Voice message recording and playback
  - [ ] Touch-optimized UI elements
  - [ ] Mobile keyboard handling
  - **Acceptance**: First-class mobile experience

---

## Implementation Timeline

### Month 1: Foundation

- **Week 1-2**: Database schema + Chat API
  - [ ] Complete Epic 1: Database schema extensions
  - [ ] Build all chat API endpoints
  - [ ] Set up basic testing framework

- **Week 3-4**: WebSocket infrastructure + Basic chat UI
  - [ ] Complete WebSocket server implementation
  - [ ] Build basic chat layout components
  - [ ] Implement real-time message synchronization

### Month 2: Core Features

- **Week 5-6**: Wiki conversion system
  - [ ] Complete Epic 2: Wiki database schema
  - [ ] Build wiki conversion logic
  - [ ] Create wiki editor and viewer components

- **Week 7-8**: Smart search implementation
  - [ ] Complete Epic 3: Search infrastructure
  - [ ] Build search UI components
  - [ ] Implement indexing for all content types

### Month 3: Polish & Integrations

- **Week 9-10**: File attachments + Google Drive
  - [ ] Complete Epic 5: File storage system
  - [ ] Implement Google Drive integration
  - [ ] Build file upload/preview features

- **Week 11-12**: GitHub integration + Testing & Launch
  - [ ] Complete GitHub and calendar integrations
  - [ ] Comprehensive testing and bug fixes
  - [ ] Performance optimization and launch preparation

### Month 4-6: Growth Features

- [ ] Epic 6: AI assistant implementation
- [ ] Epic 7: Advanced notifications system
- [ ] Epic 8: Mobile app and PWA features

---

## Technical Tasks

### Environment Setup

- [ ] Add new environment variables to `.env.example`:
  - `REDIS_URL` (for WebSocket adapter)
  - `TYPESENSE_API_KEY`, `TYPESENSE_HOST`, `TYPESENSE_PORT`
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION`
  - `OPENAI_API_KEY` (optional, for AI features)
  - `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`

### Prisma Migrations

- [ ] Run `npx prisma migrate dev` for schema changes
- [ ] Update Prisma client generation
- [ ] Add seed data for testing

### Testing Requirements

- [ ] Unit tests for all API endpoints
- [ ] Integration tests for chat flows
- [ ] WebSocket connection testing
- [ ] Search functionality tests
- [ ] Wiki conversion process tests
- [ ] File upload and security tests

### Performance Optimization

- [ ] Implement cursor-based pagination for messages
- [ ] Optimize search indexing strategy
- [ ] Set up CDN for file serving
- [ ] Implement caching for frequently accessed data

---

## Success Metrics

### MVP Success Indicators

- [ ] **Activation**: 70% of new workspaces create 3+ channels in first week
- [ ] **Engagement**: 50 messages per user per week average
- [ ] **Retention**: 60% monthly retention after 3 months
- [ ] **Wiki Conversion**: 30% of threads with 10+ messages convert to wiki
- [ ] **Search Usage**: 10 searches per user per week average

### Viral Loop Metrics

- [ ] **Invitation Rate**: 2.5 team invites per workspace average
- [ ] **Conversion Rate**: 15% upgrade to paid within 90 days
- [ ] **Word-of-Mouth**: 40% of signups from referrals

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

## Deployment Checklist

### Development Environment

- [ ] Docker Compose setup with all services
- [ ] Mock services for integration testing
- [ ] Database seeding for development data

### Staging Environment

- [ ] Full feature testing environment
- [ ] Performance benchmarking setup
- [ ] Integration testing with real APIs

### Production Deployment

- [ ] Blue-green deployment strategy
- [ ] Zero-downtime database migrations
- [ ] Monitoring and alerting setup
- [ ] Backup and disaster recovery plan

---

**Total Estimated Timeline**: 3 months for MVP, 6 months for full feature set
**Key Success Factor**: Seamless thread-to-wiki conversion that saves teams time while capturing institutional knowledge.
