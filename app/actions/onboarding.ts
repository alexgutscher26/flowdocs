"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export interface OnboardingData {
  role?: string;
  useCase?: string;
  discoverySource?: string;
  workspaceName: string;
  firstName?: string;
  businessName?: string;
  businessPhone?: string;
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const workspaceSlug = data.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Check if slug is already taken
    const existingWorkspace = await prisma.workspace.findUnique({
      where: {
        slug: workspaceSlug,
      },
    });

    if (existingWorkspace) {
      throw new Error("Workspace name already exists. Please choose another.");
    }

    // Create workspace and update user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.workspaceName,
          slug: workspaceSlug,
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      // Create default channels (#general and #random)
      await tx.channel.createMany({
        data: [
          {
            name: "general",
            description: "General workspace discussions",
            type: "PUBLIC",
            workspaceId: workspace.id,
          },
          {
            name: "random",
            description: "Casual conversations and off-topic chat",
            type: "PUBLIC",
            workspaceId: workspace.id,
          },
        ],
      });

      // Get the created channels and add user as OWNER
      const channels = await tx.channel.findMany({
        where: {
          workspaceId: workspace.id,
          name: { in: ["general", "random"] },
        },
      });

      // Add user as OWNER to both channels
      await tx.channelMember.createMany({
        data: channels.map((channel) => ({
          channelId: channel.id,
          userId: session.user.id,
          role: "OWNER",
        })),
      });

      // Find the general channel for adding welcome message
      const generalChannel = channels.find((ch) => ch.name === "general");

      if (generalChannel) {
        // Create welcome message
        await tx.message.create({
          data: {
            content: `👋 Welcome to ${data.workspaceName}!

This is your team's workspace for collaboration and knowledge sharing.

QUICK START GUIDE

Channels: Use channels to organize conversations by topic. We've created #general and #random to get you started.

Messages: Share updates, ask questions, and collaborate with your team in real-time.

Wiki: Convert important discussions into permanent documentation. Look for "Convert to Wiki" on message threads.

Search: Use Cmd+K (Ctrl+K on Windows) to quickly search across all messages, wiki pages, and files.

GETTING STARTED

1. Invite your teammates from workspace settings
2. Start a conversation in this channel
3. Create your first wiki page to document your processes
4. Explore features and make this workspace your own

Need help? Check out the Getting Started guide in the wiki section.`,
            type: "SYSTEM",
            channelId: generalChannel.id,
            userId: session.user.id,
            isPinned: true,
          },
        });
      }

      // Create a Getting Started wiki page
      await tx.wikiPage.create({
        data: {
          title: "Getting Started",
          slug: "getting-started",
          content: `# Getting Started with ${data.workspaceName}

Welcome to your new workspace! This guide will help you make the most of your team collaboration platform.

## Overview

This workspace combines real-time chat with a powerful knowledge base, helping your team communicate effectively and preserve important information.

## Core Features

### 💬 Channels
- Organize conversations by topic or project
- Create public channels for team-wide discussions
- Use private channels for sensitive information
- Direct messages for one-on-one conversations

### 📝 Real-time Messaging
- Share updates and ideas instantly
- Thread replies to keep conversations organized
- React with emoji for quick feedback
- Edit and delete your own messages

### 📚 Wiki & Documentation
- Convert important chat threads into wiki pages
- Create pages from scratch using markdown
- Organize with tags and nested pages
- Track changes with version history

### 🔍 Search
- Press Cmd+K (Ctrl+K on Windows) to search
- Find messages, wiki pages, and files
- Filter by type, date, author, and more
- Save frequent searches for quick access

## Getting Started Checklist

- [ ] Invited team members to join the workspace
- [ ] Created additional channels for your projects
- [ ] Started your first conversation
- [ ] Created your first wiki page
- [ ] Converted a chat thread to documentation
- [ ] Customized workspace settings

## Best Practices

### Channel Organization
- Use descriptive names (e.g., #project-alpha, #design)
- Add descriptions to clarify channel purpose
- Archive inactive channels to reduce clutter

### Effective Communication
- Use threads for focused discussions
- @mention teammates when you need their input
- Use reactions to acknowledge messages

### Knowledge Management
- Convert valuable discussions to wiki pages
- Keep wiki pages up-to-date
- Use tags to categorize content
- Link related pages together

## Need Help?

- Ask questions in #general
- Check workspace settings for customization options
- Invite more teammates as your team grows

---

*This page was automatically created when your workspace was set up. Feel free to edit or delete it!*`,
          excerpt:
            "Learn how to use channels, messaging, wiki, and search to collaborate effectively with your team.",
          published: true,
          workspaceId: workspace.id,
          authorId: session.user.id,
        },
      });

      // Update user with onboarding completion
      const user = await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          onboardingCompleted: true,
          ...(data.firstName && { name: data.firstName }),
          onboardingData: {
            ...(data.role && { role: data.role }),
            ...(data.useCase && { useCase: data.useCase }),
            ...(data.discoverySource && { discoverySource: data.discoverySource }),
            ...(data.businessName && { businessName: data.businessName }),
            ...(data.businessPhone && { businessPhone: data.businessPhone }),
            completedAt: new Date().toISOString(),
          },
          defaultWorkspaceId: workspace.id,
        },
      });

      return { workspace, user };
    });

    return { success: true, workspace: result.workspace };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    throw error;
  }
}

export async function updateOnboardingData(data: Partial<OnboardingData>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get current onboarding data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingData: true },
    });

    const currentData = (
      user?.onboardingData ? (user.onboardingData as unknown as OnboardingData) : {}
    ) as OnboardingData;

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingData: {
          ...currentData,
          ...data,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    throw error;
  }
}
