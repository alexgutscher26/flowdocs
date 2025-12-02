# FlowDocs (HagenKit)

A Next.js application with real-time collaboration features.

## Tech Stack

- **Framework**: Next.js 16 with custom server (for WebSocket support)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: better-auth
- **Real-time**: Socket.IO
- **UI**: Radix UI, Tailwind CSS, shadcn/ui components
- **Email**: React Email with Resend
- **File Upload**: UploadThing
- **Search**: Typesense
- **Content**: Content Collections for MDX

## Key Commands

- `bun run dev` - Start development server with WebSocket support
- `bun run build` - Build for production
- `bun run email` - Preview email templates
- `bun run prisma:migrate` - Run database migrations
- `bun run prisma:generate` - Generate Prisma client
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components (UI in `/components/ui`)
- `/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/emails` - Email templates
- `/content` - MDX content (blog, docs, etc.)
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions
