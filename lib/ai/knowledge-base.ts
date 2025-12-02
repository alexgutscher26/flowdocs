import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { searchMessages, searchWikiPages, SearchOptions } from "@/lib/search";
import { Message } from "@/generated/prisma/client";

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
const MAX_CONTEXT_LENGTH = 4000; // Characters
const DEFAULT_SEARCH_LIMIT = 10;
const DEFAULT_WIKI_LIMIT = 5;

if (!OPENROUTER_API_KEY) {
  console.warn("\u26a0\ufe0f  OPENROUTER_API_KEY is not set. AI features will not work.");
}

// Configure OpenRouter
const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY || "dummy-key",
  baseURL: "https://openrouter.ai/api/v1",
});

// Define the model to use
const model = openrouter(OPENROUTER_MODEL);

/**
 * Answer a question using RAG (Retrieval Augmented Generation) based on team knowledge (messages and wiki pages).
 *
 * This function retrieves relevant context from Typesense for the given query and workspaceId, processes message and wiki results while respecting a maximum context length, and generates an answer using the FlowDocs context. It handles various error cases, including missing API keys, empty queries, and workspace IDs, and ensures that the response is concise and actionable.
 *
 * @param query - The question to be answered.
 * @param workspaceId - The ID of the workspace from which to retrieve context.
 * @returns An object containing the generated answer and sources of information.
 * @throws Error If the OpenRouter API key is not configured, if the query is empty, or if the workspace ID is missing.
 */
export async function answerQuestion(query: string, workspaceId: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables."
    );
  }

  if (!query?.trim()) {
    throw new Error("Query cannot be empty");
  }

  if (!workspaceId?.trim()) {
    throw new Error("Workspace ID is required");
  }

  try {
    // 1. Retrieve relevant context from Typesense
    const searchOptions: SearchOptions = { limit: DEFAULT_SEARCH_LIMIT };
    const wikiSearchOptions: SearchOptions = { limit: DEFAULT_WIKI_LIMIT };

    const [messageResults, wikiResults] = await Promise.all([
      searchMessages(query, { workspaceId }, searchOptions),
      searchWikiPages(query, { workspaceId }, wikiSearchOptions),
    ]);

    const contextParts: string[] = [];
    const sources: string[] = [];
    let totalLength = 0;

    // Process message results with length limit
    if (messageResults.hits && Array.isArray(messageResults.hits)) {
      for (const hit of messageResults.hits) {
        const doc = hit.document;
        if (!doc) continue;

        const content = doc.content || "";
        const contextEntry = `Message by ${doc.userId || "unknown"} in channel ${doc.channelId || "unknown"}: "${content}"`;

        if (totalLength + contextEntry.length > MAX_CONTEXT_LENGTH) break;

        contextParts.push(contextEntry);
        sources.push(`Message in channel ${doc.channelId || "unknown"}`);
        totalLength += contextEntry.length;
      }
    }

    // Process wiki results with length limit
    if (wikiResults.hits && Array.isArray(wikiResults.hits)) {
      for (const hit of wikiResults.hits) {
        const doc = hit.document;
        if (!doc) continue;

        const title = doc.title || "Untitled";
        const content = (doc.content || "").substring(0, 500);
        const contextEntry = `Wiki Page "${title}":\n${content}${content.length >= 500 ? "..." : ""}`;

        if (totalLength + contextEntry.length > MAX_CONTEXT_LENGTH) break;

        contextParts.push(contextEntry);
        sources.push(`Wiki: ${title}`);
        totalLength += contextEntry.length;
      }
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
- Real-time collaboration with WebSocket support
- File storage with AWS S3/Cloudflare R2 integration
- User presence and typing indicators

${
  hasContext
    ? "Answer the user's question based on the provided context from their workspace. Be specific, helpful, and cite the sources when relevant. If the context doesn't contain enough information, acknowledge what you know and what you don't."
    : "The workspace doesn't have any indexed content yet. Provide helpful information about FlowDocs features and how to get started. Encourage them to create channels, send messages, and create wiki pages to build their knowledge base."
}

Keep answers concise, professional, and actionable.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: hasContext
        ? `Context:\n${context}\n\nQuestion: ${query}`
        : `Question: ${query}\n\nNote: This is a new workspace with no content yet. Help the user understand FlowDocs and how to get started.`,
    });

    return {
      answer: text,
      sources: hasContext ? [...new Set(sources)].slice(0, 5) : [],
    };
  } catch (error) {
    console.error("Error in answerQuestion:", error);
    throw new Error(
      error instanceof Error ? `AI Error: ${error.message}` : "Failed to generate AI response"
    );
  }
}

/**
 * Summarize a conversation thread.
 *
 * This function checks for the presence of the OpenRouter API key and validates the input messages.
 * It constructs a transcript from the messages and calls the generateText function to obtain a summary,
 * focusing on key points, decisions, and action items. If any errors occur during the process,
 * they are logged and a failure message is thrown.
 *
 * @param messages - Array of messages to summarize.
 * @returns Summary text of the conversation thread.
 * @throws Error If the OpenRouter API key is not configured or if summarization fails.
 */
export async function summarizeThread(messages: Message[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!messages || messages.length === 0) {
    return "No messages to summarize.";
  }

  try {
    const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

    const { text } = await generateText({
      model,
      system:
        "You are a helpful assistant that summarizes conversation threads. Focus on key points, decisions, and action items.",
      prompt: `Please provide a concise summary of the following conversation thread (${messages.length} messages):\n\n${transcript.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return text;
  } catch (error) {
    console.error("Error in summarizeThread:", error);
    throw new Error("Failed to summarize thread");
  }
}

/**
 * Suggest a wiki page based on a conversation thread.
 * Returns title, slug, and markdown content.
 * @param messages - Array of messages to analyze
 * @returns Structured wiki page suggestion
 */
export async function suggestWikiPage(messages: Message[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!messages || messages.length === 0) {
    throw new Error("No messages provided for wiki page suggestion");
  }

  try {
    const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

    const { object } = await generateObject({
      model,
      schema: z.object({
        title: z.string().describe("A clear, descriptive title for the wiki page"),
        slug: z.string().describe("A URL-friendly slug (lowercase, hyphens, no spaces)"),
        content: z.string().describe("Well-formatted markdown content for the page"),
        tags: z.array(z.string()).describe("3-5 relevant tags for categorization"),
        excerpt: z.string().optional().describe("A brief 1-2 sentence summary"),
      }),
      system:
        "You are an expert technical writer. Create well-structured, informative wiki pages from conversations. Focus on extracting key information, decisions, and actionable insights.",
      prompt: `Create a comprehensive wiki page that documents the key information from this conversation (${messages.length} messages):\n\n${transcript.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return object;
  } catch (error) {
    console.error("Error in suggestWikiPage:", error);
    throw new Error("Failed to generate wiki page suggestion");
  }
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
 *
 * This function checks for the presence of the OPENROUTER_API_KEY and validates the input text.
 * It then calls the generateObject function to extract action items, which are defined by a specific schema.
 * If successful, it returns the extracted action items; otherwise, it handles errors appropriately.
 *
 * @param text - The input text from which action items will be extracted.
 * @returns An array of action items extracted from the input text.
 * @throws Error If the OpenRouter API key is not configured or if extraction fails.
 */
export async function extractActionItems(text: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!text?.trim()) {
    return [];
  }

  try {
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
      prompt: `Extract all action items from the following text:\n\n${text.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return object.actionItems;
  } catch (error) {
    console.error("Error in extractActionItems:", error);
    throw new Error("Failed to extract action items");
  }
}
