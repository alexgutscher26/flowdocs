# FlowDocs Knowledge Base

## Project Overview

FlowDocs is a team communication and knowledge base platform designed to bridge the gap between ephemeral chat and permanent documentation. It combines real-time messaging (like Slack) with structured wiki pages (like Notion), powered by an AI assistant that helps capture and organize knowledge.

## Core Architecture

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **State Management**: React Hooks + Context + URL State (nuqs)
- **Real-time**: Custom WebSocket implementation with Socket.IO client

### Backend

- **Runtime**: Node.js (Next.js Server Actions & API Routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth (Session-based + OAuth)
- **Search Engine**: Typesense (Self-hosted or Cloud)
- **AI Provider**: OpenRouter (Access to Claude, GPT-4, etc.)
- **File Storage**: AWS S3 / Cloudflare R2 compatible

## Key Features & Implementation Details

### 1. Real-time Chat

- **WebSocket Server**: Located in `server.ts`, handles real-time event broadcasting.
- **Components**: `components/chat/*`
- **Features**:
  - Channels (Public/Private)
  - Threaded replies
  - Direct Messages
  - Typing indicators & Presence
  - File attachments

### 2. Wiki System

- **Data Model**: `WikiPage` with version history (`WikiVersion`).
- **Components**: `components/wiki/*`
- **Features**:
  - Markdown rendering
  - Nested page hierarchy
  - Thread-to-Wiki conversion
  - Version control

### 3. AI Assistant (RAG)

- **Logic**: `lib/ai/knowledge-base.ts`
- **Vector Search**: Uses Typesense to find relevant messages and wiki pages.
- **Generation**: Vercel AI SDK (`generateText`) with OpenRouter.
- **Features**:
  - Context-aware Q&A
  - Thread summarization
  - Wiki page suggestions

### 4. Search

- **Logic**: `lib/search.ts`
- **Engine**: Typesense
- **Indexes**:
  - `messages`: Chat history
  - `wiki_pages`: Documentation
  - `users`: Member directory

## Development Guidelines

### Database Changes

1.  Modify `prisma/schema.prisma`
2.  Run `bun prisma:generate` to update the client
3.  Run `bun prisma:push` to sync with the database (dev only)

### Adding New Features

1.  **Plan**: Create an implementation plan in `implementation_plan.md`.
2.  **UI**: Build components in `components/` using Shadcn UI.
3.  **Logic**: Add server actions in `app/actions/` or API routes in `app/api/`.
4.  **State**: Use URL state for shareable UI states, local state for ephemeral interactions.

### Environment Variables

Required keys in `.env.local`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` & `BETTER_AUTH_URL`
- `OPENROUTER_API_KEY`
- `TYPESENSE_API_KEY` & `TYPESENSE_HOST`

## Useful Commands

```bash
bun dev              # Start dev server
bun prisma:studio    # Open database GUI
bun email            # Preview email templates
```
