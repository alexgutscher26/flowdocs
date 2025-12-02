<a href="https://flowdocs.dev">
  <h1 align="center">FlowDocs</h1>
</a>

<p align="center">
  <strong>Team Communication & Knowledge Base Hybrid</strong><br>
  The open-source alternative to Slack + Notion.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#documentation"><strong>Documentation</strong></a>
</p>
<br/>

## Introduction

FlowDocs is a modern collaboration platform that combines real-time chat with structured documentation. It solves the problem of lost context by allowing you to easily convert chat threads into permanent wiki pages, all searchable through a powerful AI assistant.

## Features

### 💬 Real-time Communication
- **Channels & Threads**: Organize discussions by topic.
- **Direct Messages**: Private 1:1 or group conversations.
- **Rich Text Editor**: Markdown support, code blocks, and file attachments.
- **Reactions & Mentions**: Express yourself and notify teammates.

### 📚 Knowledge Base (Wiki)
- **Structured Documentation**: Create and organize wiki pages with a hierarchy.
- **Thread-to-Wiki**: One-click conversion of chat threads into documentation.
- **Version History**: Track changes and revert if needed.
- **Collaborative Editing**: Real-time updates (coming soon).

### 🤖 AI Assistant (RAG)
- **Context-Aware Answers**: Ask questions about your workspace content.
- **Source Citations**: See exactly which messages or wiki pages were used.
- **Summarization**: Get quick summaries of long threads.
- **Proactive Suggestions**: AI suggests when to create a wiki page from a discussion.
- **Powered by OpenRouter**: Use Claude 3.5 Sonnet, GPT-4o, or any other model.

### 🔍 Search & Discovery
- **Full-Text Search**: Powered by Typesense for lightning-fast results.
- **Unified Search**: Search across messages, files, and wiki pages.
- **Filters**: Narrow down by user, channel, date, or tag.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Typesense (for search)
- OpenRouter API Key (for AI features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/flowdocs.git
    cd flowdocs
    ```

2.  **Install dependencies**
    ```bash
    bun install
    ```

3.  **Set up environment variables**
    ```bash
    cp .env.example .env.local
    ```
    Update `.env.local` with your credentials:
    - `DATABASE_URL` (PostgreSQL)
    - `TYPESENSE_API_KEY` & Host
    - `OPENROUTER_API_KEY` (Get from [openrouter.ai](https://openrouter.ai))
    - `BETTER_AUTH_SECRET` & URL

4.  **Initialize Database**
    ```bash
    bun prisma:generate
    bun prisma:push
    ```

5.  **Start Development Server**
    ```bash
    bun dev
    ```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Better Auth
- **Search**: Typesense
- **AI**: Vercel AI SDK + OpenRouter
- **Styling**: Tailwind CSS + Shadcn UI
- **Real-time**: WebSocket (Custom implementation)
- **File Storage**: AWS S3 / Cloudflare R2

## Documentation

- [Security Policy](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## License

AGPL-3.0
