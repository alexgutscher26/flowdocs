import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { searchMessages, searchWikiPages, SearchOptions } from "@/lib/search";
import { Message } from "@/generated/prisma/client";

// Configure OpenRouter
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Define the model to use - configurable via env vars
const model = openrouter(process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet");

/**
 * Answer a question using RAG (Retrieval Augmented Generation)
 * based on team knowledge (messages and wiki pages).
 */
export async function answerQuestion(query: string, workspaceId: string) {
  // 1. Retrieve relevant context from Typesense
  const searchOptions: SearchOptions = { limit: 10 };
  const wikiSearchOptions: SearchOptions = { limit: 5 };

  const [messageResults, wikiResults] = await Promise.all([
    searchMessages(query, { workspaceId }, searchOptions),
    searchWikiPages(query, { workspaceId }, wikiSearchOptions),
  ]);

  const contextParts: string[] = [];
  const sources: string[] = [];

  if (messageResults.hits) {
    messageResults.hits.forEach((hit: any) => {
      const doc = hit.document;
      contextParts.push(`Message by ${doc.userId} in channel ${doc.channelId}: "${doc.content}"`);
      sources.push(`Message in channel ${doc.channelId}`);
    });
  }

  if (wikiResults.hits) {
    wikiResults.hits.forEach((hit: any) => {
      const doc = hit.document;
      contextParts.push(`Wiki Page "${doc.title}":\n${doc.content.substring(0, 500)}...`);
      sources.push(`Wiki: ${doc.title}`);
    });
  }

  const hasContext = contextParts.length > 0;
  const context = hasContext ? contextParts.join("\n\n") : "No indexed content available yet.";

  // 2. Generate answer with FlowDocs context
  const systemPrompt = `You are a helpful AI assistant for FlowDocs, a team communication and knowledge base platform that combines chat and wiki features (similar to Slack + Notion).

FlowDocs Features:
- Real-time chat with channels, threads, and direct messages
- Wiki pages with markdown support and version history
- Convert important conversations into wiki documentation
- Full-text search across messages and wiki pages
- File uploads and sharing
- User mentions and notifications
- Message reactions and pinning

${
  hasContext
    ? "Answer the user's question based on the provided context from their workspace. Be specific and cite the sources."
    : "The workspace doesn't have any indexed content yet. Provide helpful information about FlowDocs features and how to get started. Encourage them to create channels, send messages, and create wiki pages to build their knowledge base."
}

Keep answers concise and professional.`;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: hasContext
      ? `Context:\n${context}\n\nQuestion: ${query}`
      : `Question: ${query}\n\nNote: This is a new workspace with no content yet. Help the user understand FlowDocs and how to get started.`,
  });

  return { answer: text, sources: hasContext ? [...new Set(sources)].slice(0, 5) : [] };
}

/**
 * Summarize a conversation thread.
 */
export async function summarizeThread(messages: Message[]) {
  const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

  const { text } = await generateText({
    model,
    system: "You are a helpful assistant that summarizes conversation threads.",
    prompt: `Please provide a concise summary of the following conversation thread:\n\n${transcript}`,
  });

  return text;
}

/**
 * Suggest a wiki page based on a conversation thread.
 * Returns title, slug, and markdown content.
 */
export async function suggestWikiPage(messages: Message[]) {
  const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      title: z.string().describe("The title of the wiki page"),
      slug: z.string().describe("A URL-friendly slug for the page"),
      content: z.string().describe("The markdown content of the page"),
      tags: z.array(z.string()).describe("Suggested tags for the page"),
    }),
    system: "You are an expert technical writer. Create a wiki page based on the conversation.",
    prompt: `Create a wiki page that documents the key information from this conversation:\n\n${transcript}`,
  });

  return object;
}

/**
 * Find related conversations based on a query.
 * This uses the search index to find semantically similar messages.
 */
export async function findRelatedConversations(query: string, workspaceId: string) {
  const results = await searchMessages(query, { workspaceId }, { limit: 20 });

  // Group hits by threadId (if available) or channelId
  const related = new Map<string, { count: number; snippet: string }>();

  if (results.hits) {
    results.hits.forEach((hit: any) => {
      const doc = hit.document;
      // Prefer threadId if it exists (assuming it's indexed, if not fallback to channel)
      // Note: search.ts schema might need threadId added if not present
      const key = doc.channelId;

      if (!related.has(key)) {
        related.set(key, { count: 0, snippet: doc.content });
      }
      const item = related.get(key)!;
      item.count++;
    });
  }

  return Array.from(related.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
}

/**
 * Extract action items from text.
 */
export async function extractActionItems(text: string) {
  const { object } = await generateObject({
    model,
    schema: z.object({
      actionItems: z.array(
        z.object({
          task: z.string(),
          assignee: z.string().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
        })
      ),
    }),
    system: "You are a project manager. Extract action items from the text.",
    prompt: `Extract all action items from the following text:\n\n${text}`,
  });

  return object.actionItems;
}
